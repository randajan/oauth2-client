import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { RedirectError } from "../errors";
import { base64ToBase64Url, extendURL, isValidURL, strFromBase64Url, strToBase64Url, validateFn, validateStr, validateTtl, validateURL, wrapFnWith } from "../tools";
import { Grant } from "../class/Grant";
import { MagicAccount } from "./MagicAccount";
import { solids } from "@randajan/props";


export class MagicGrant extends Grant {

    static name = "magic";
    static accIdKey = "id";
    static reqClientId = false;
    static Account = MagicAccount;

    constructor(opt = {}) {
        super(opt);

        solids(this, {
            magicUri:validateURL(false, opt.magicUri, "options.magicUri") || this.landingUri,
            magicTtlMs: validateTtl(false, opt.magicTtlMs, "options.magicTtlMs") || 600000,
            accessTokenTtlMs: validateTtl(false, opt.accessTokenTtlMs, "options.accessTokenTtlMs") || 86400000,
            onMagic: wrapFnWith(validateFn(true, opt.onMagic, "options.onMagic"), this),
            usedCodes: new Map(),
        });
    }

    async getInitAuthURL(options = {}) {
        const { magicUri, onMagic } = this;
        const { landingUri, state:stateObj, userId, extra } = options;

        const state = this._serializeState(stateObj, landingUri);

        const confirmUrl = this._generateAuthUrl(userId, state, extra || {});

        const customUrl = await onMagic(confirmUrl, {
            magicUri,
            userId,
            state,
            extra: { ...extra }
        });

        if (customUrl == null) { return extendURL(magicUri, { userId }); }
        if (isValidURL(customUrl)) { return customUrl; }

        throw new RedirectError(11, "Bad request. options.onMagic must return valid URL");
    }

    _generateAuthUrl(userId, state, extra={}) {
        const { redirectUri, magicTtlMs } = this;

        if (typeof userId !== "string" || userId === "") {
            throw new RedirectError(12, "Bad request. Missing 'userId'");
        }

        const { token:code } = this.createToken("magic_code", userId, magicTtlMs);
        return extendURL(redirectUri, { code, state });
    }

    async _swapCodeForTokens(code) {
        const payload = this.readToken(code, "magic_code");
        const isNew = this.trackUsedCode(code);
        if (!isNew) {
            throw new RedirectError(19, "Magic code has already been used");
        }

        const { token:access_token, payload:accessPayload } = this.createToken("access_token", payload.sub, this.accessTokenTtlMs);
        return {
            access_token,
            expiry_date: accessPayload.exp
        };
    }

    readAccessToken(accessToken) {
        return this.readToken(accessToken, "access_token");
    }

    readToken(token, type) {
        if (!token || typeof token !== "string") {
            throw new RedirectError(13, `Bad request. Missing '${type}' token`);
        }

        const parts = token.split(".");
        if (parts.length !== 2 || !parts[0] || !parts[1]) {
            throw new RedirectError(14, "Invalid token format");
        }

        const [ payloadEncoded, signature ] = parts;
        const signatureExpected = this.sign(payloadEncoded);

        const given = Buffer.from(signature, "utf8");
        const expected = Buffer.from(signatureExpected, "utf8");

        if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
            throw new RedirectError(15, "Invalid token signature");
        }

        let payload;
        try {
            payload = JSON.parse(strFromBase64Url(payloadEncoded));
        } catch (err) {
            throw new RedirectError(16, "Invalid token payload");
        }

        const now = Date.now();
        const { typ, sub, exp } = payload || {};

        if (typ !== type || typeof sub !== "string" || !sub) {
            throw new RedirectError(17, "Invalid token claims");
        }

        if (!Number.isFinite(exp) || now >= exp) {
            const message = (type === "access_token") ? "Access token has expired" : "Magic code has expired";
            throw new RedirectError(18, message);
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
        const digest = createHmac("sha256", this.clientSecret).update(payloadEncoded).digest();
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
