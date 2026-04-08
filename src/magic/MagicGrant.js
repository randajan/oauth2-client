import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { RedirectError } from "../errors";
import { base64ToBase64Url, extendURL, isValidURL, strFromBase64Url, strToBase64Url, validateFn, validateStr, validateURL } from "../tools";
import { Grant } from "../class/Grant";
import { MagicAccount } from "./MagicAccount";


export class MagicGrant extends Grant {

    static name = "magic";
    static uidKey = "id";
    static Account = MagicAccount;

    constructor(client, opt = {}) {
        super(client, opt);

        this.magicUri = validateURL(false, opt.magicUri, "options.magicUri") || this.landingUri;
        this.magicSecret = validateStr(true, opt.magicSecret, "options.magicSecret");
        this.magicTtlMs = this.parseTtl(opt.magicTtlMs, 600000, "options.magicTtlMs");
        this.accessTokenTtlMs = this.parseTtl(opt.accessTokenTtlMs, 86400000, "options.accessTokenTtlMs");
        this.onMagic = validateFn(true, opt.onMagic, "options.onMagic");
        this.usedCodes = new Map();
    }

    parseTtl(value, fallback, propName) {
        const ttl = (value == null) ? fallback : Number(value);
        if (!Number.isFinite(ttl) || ttl <= 0) {
            throw new Error(`${propName} must be a positive number`);
        }
        return Math.floor(ttl);
    }

    async getInitAuthURL(options = {}) {
        const { magicUri, onMagic } = this;
        const { landingUri, state:stateObj, userId, extra } = options;

        const state = this.serializeState(stateObj, landingUri);

        const confirmUrl = this.generateAuthUrl(userId, state, extra || {});

        const customUrl = await onMagic(confirmUrl, {
            magicUri,
            userId,
            state,
            extra: { ...extra }
        });

        if (customUrl == null) { return extendURL(magicUri, { userId }); }
        if (isValidURL(customUrl)) { return customUrl; }

        throw new RedirectError(13, "Bad request. options.onMagic must return valid URL");
    }

    generateAuthUrl(userId, state, extra={}) {
        const { redirectUri, magicTtlMs } = this;

        if (typeof userId !== "string" || userId === "") {
            throw new RedirectError(12, "Bad request. Missing 'userId'");
        }

        const { token:code } = this.createToken("magic_code", userId, magicTtlMs);
        return extendURL(redirectUri, { code, state });
    }

    async swapCodeForTokens(code) {
        const payload = this.readToken(code, "magic_code", 21, 22);
        const isNew = this.trackUsedCode(code);
        if (!isNew) {
            throw new RedirectError(23, "Magic code has already been used");
        }

        const { token:access_token, payload:accessPayload } = this.createToken("access_token", payload.sub, this.accessTokenTtlMs);
        return {
            access_token,
            expiry_date: accessPayload.exp
        };
    }

    readAccessToken(accessToken) {
        return this.readToken(accessToken, "access_token", 31, 32);
    }

    readToken(token, type, errorCode = 21, expiredCode = 22) {
        if (!token || typeof token !== "string") {
            throw new RedirectError(errorCode, `Bad request. Missing '${type}' token`);
        }

        const parts = token.split(".");
        if (parts.length !== 2 || !parts[0] || !parts[1]) {
            throw new RedirectError(errorCode, "Invalid token format");
        }

        const [ payloadEncoded, signature ] = parts;
        const signatureExpected = this.sign(payloadEncoded);

        const given = Buffer.from(signature, "utf8");
        const expected = Buffer.from(signatureExpected, "utf8");

        if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
            throw new RedirectError(errorCode, "Invalid token signature");
        }

        let payload;
        try {
            payload = JSON.parse(strFromBase64Url(payloadEncoded));
        } catch (err) {
            throw new RedirectError(errorCode, "Invalid token payload");
        }

        const now = Date.now();
        const { typ, sub, exp } = payload || {};

        if (typ !== type || typeof sub !== "string" || !sub) {
            throw new RedirectError(errorCode, "Invalid token claims");
        }

        if (!Number.isFinite(exp) || now >= exp) {
            const message = (type === "access_token") ? "Access token has expired" : "Magic code has expired";
            throw new RedirectError(expiredCode, message);
        }

        return payload;
    }

    createToken(type, sub, ttlMs) {
        const iat = Date.now();
        const payload = {
            typ: type,
            sub: String(sub),
            iat,
            exp: iat + ttlMs,
            rnd: randomBytes(12).toString("hex")
        };
        const payloadEncoded = strToBase64Url(JSON.stringify(payload));
        const signature = this.sign(payloadEncoded);
        return { token: `${payloadEncoded}.${signature}`, payload };
    }

    sign(payloadEncoded) {
        const digest = createHmac("sha256", this.magicSecret).update(payloadEncoded).digest();
        return base64ToBase64Url(digest.toString("base64"));
    }

    trackUsedCode(code) {
        if (this.usedCodes.has(code)) { return false; }

        const timeout = setTimeout(() => {
            this.usedCodes.delete(code);
        }, this.magicTtlMs);

        if (typeof timeout.unref === "function") {
            timeout.unref();
        }

        this.usedCodes.set(code, timeout);
        return true;
    }

}
