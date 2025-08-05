// SeznamGrant.js
import fetch from "node-fetch";
import { OAuth2Grant } from "../class/OAuth2Grant";
import { extendURL } from "../tools";
import { RedirectError } from "../errors";
import { SeznamAccount } from "./SeznamAccount";

export class SeznamGrant extends OAuth2Grant {

    static name = "seznam";
    static uidKey = "email";
    static scopePrefix = "";                 // Seznam prefix nepoužívá
    static scopesCommon = ["identity"];      // povinný scope
    static scopesNoPrefix = [];              // nic zvláštního
    static Account = SeznamAccount;

    createApiUrl(path, query = {}) {
        return extendURL(
            `https://login.szn.cz/api/v1${path}`,
            query
        );
    }

    async fetchApiGet(path, headers, errorCode = 2) {
        const url = this.createApiUrl(path);
        const res = await fetch(url, { headers });
        if (!res.ok) { throw new RedirectError(errorCode, await res.text()); }
        return res.json();
    }

    async fetchApiPost(path, body, errorCode = 2) {
        const url = this.createApiUrl(path);
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify(body)
        });
        if (!res.ok) { throw new RedirectError(errorCode, await res.text()); }
        return res.json();
    }

    generateAuthUrl(scope, state, extra) {
        const { clientId, redirectUri, isOffline } = this;

        const access_type = isOffline ? "offline" : "";

        return this.createApiUrl("/oauth/auth", {
            ...extra,
            access_type,
            response_type: "code",
            client_id: clientId,
            redirect_uri: redirectUri,
            scope: scope.join(","),          // Seznam odděluje čárkou
            state,
        });
    }

    async swapCodeForTokens(code) {
        const { clientId, clientSecret, redirectUri } = this;

        return this.fetchApiPost("/oauth/token", {
            grant_type: "authorization_code",
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri
        }, 2);

    }
}
