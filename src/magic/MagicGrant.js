import { randomBytes } from "crypto";
import { RedirectError } from "../errors";
import { extendURL, isValidURL, validateFn, validateTtl, validateURL } from "../tools";
import { objFromSignedBase64Url, objToSignedBase64Url } from "../crypto";
import { Grant } from "../class/Grant";
import { MagicAccount } from "./MagicAccount";
import { solids } from "@randajan/props";


export class MagicGrant extends Grant {

    static name = "magic";
    static reqClientId = false;
    static Account = MagicAccount;

    constructor(opt = {}) {
        super(opt);

        solids(this, {
            pendingUri:validateURL(false, opt.pendingUri, "options.pendingUri") || this.landingUri,
            magicTtlMs: validateTtl(false, opt.magicTtlMs, "options.magicTtlMs") || 600000,
            accessTokenTtlMs: validateTtl(false, opt.accessTokenTtlMs, "options.accessTokenTtlMs") || 86400000,
            onMagic: validateFn(true, opt.onMagic, "options.onMagic"),
            usedCodes: new Map(),
        });
    }

    _generateAuthUrl(userId, state, extra={}) {
        const { exitUri, magicTtlMs } = this;

        if (typeof userId !== "string" || userId === "") {
            throw new RedirectError(12, "Bad request. Missing 'userId'");
        }

        const { token:code } = this.createToken("magic_code", userId, magicTtlMs);
        return extendURL(exitUri, { code, state });
    }

    async _resolveInitURL(query = {}, options = {}) {
        const { pendingUri, onMagic, magicTtlMs } = this;
        const { state, userId, landingUri } = query;
        const { extra } = options;

        const signedState = this._signState(state, landingUri);
        const confirmUrl = this._generateAuthUrl(userId, signedState, extra || {});

        const customUrl = await onMagic(confirmUrl, {
            ttl:magicTtlMs,
            pendingUri,
            userId,
            state,
            extra: { ...extra }
        });

        if (customUrl == null) { return extendURL(pendingUri, { userId }); }
        if (isValidURL(customUrl)) { return customUrl; }

        throw new RedirectError(11, "Bad request. options.onMagic must return valid URL");
    }

    async _swapCodeForTokens(code) {
        const payload = this.readToken(code, "magic_code");
        const isNew = this._trackUsedCode(code);
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

        let payload;
        try {
            payload = objFromSignedBase64Url(token, this.clientSecret);
        } catch (err) {
            if (err.message === "Invalid signed payload format") {
                throw new RedirectError(14, "Invalid token format");
            }
            if (err.message === "Invalid signed payload signature") {
                throw new RedirectError(15, "Invalid token signature");
            }
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
        return { token: objToSignedBase64Url(payload, this.clientSecret), payload };
    }

    _trackUsedCode(code) {
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
