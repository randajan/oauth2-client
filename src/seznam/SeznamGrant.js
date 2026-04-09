// SeznamGrant.js
import fetch from "node-fetch";
import { ScopeGrant } from "../class/ScopeGrant";
import { extendURL } from "../tools";
import { RedirectError } from "../errors";
import { SeznamAccount } from "./SeznamAccount";

export class SeznamGrant extends ScopeGrant {

    static name = "seznam";
    static scopePrefix = "";                 // Seznam prefix nepoužívá
    static scopesCommon = ["identity"];      // povinný scope
    static scopesNoPrefix = [];              // nic zvláštního
    static Account = SeznamAccount;

    _createApiUrl(path, query = {}) {
        return extendURL(
            `https://login.szn.cz/api/v1${path}`,
            query
        );
    }

    async _fetchApiGet(path, headers) {
        const url = this._createApiUrl(path);
        const res = await fetch(url, { headers });
        if (!res.ok) { throw new RedirectError(20, await res.text()); }
        return res.json();
    }

    async _fetchApiPost(path, body) {
        const url = this._createApiUrl(path);
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify(body)
        });
        if (!res.ok) { throw new RedirectError(20, await res.text()); }
        return res.json();
    }

    _generateAuthUrl(scope, state, extra) {
        const { clientId, redirectUri, isOffline } = this;

        const access_type = isOffline ? "offline" : "";

        return this._createApiUrl("/oauth/auth", {
            ...extra,
            access_type,
            response_type: "code",
            client_id: clientId,
            redirect_uri: redirectUri,
            scope: scope.join(","),          // Seznam odděluje čárkou
            state,
        });
    }

    async _swapCodeForTokens(code) {
        const { clientId, clientSecret, redirectUri } = this;

        return this._fetchApiPost("/oauth/token", {
            grant_type: "authorization_code",
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri
        }, 2);

    }
}

