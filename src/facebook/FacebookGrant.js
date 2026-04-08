import fetch from "node-fetch";
import { ScopeGrant } from "../class/ScopeGrant";
import { extendURL, validateStr } from "../tools";
import { RedirectError } from "../errors";
import { FacebookAccount } from "./FacebookAccount";



export class FacebookGrant extends ScopeGrant {

    static name = "facebook";
    static accIdKey = "id";
    static scopePrefix = "";
    static scopesCommon = [];
    static scopesNoPrefix = [];
    static Account = FacebookAccount;

    constructor(client, opt = {}) {
        super(client, opt);

        this.apiVersion = validateStr(false, opt.apiVersion, "options.apiVersion") || "v23.0";
    }

    createApiUrl(subdomain, path, query={}) {
        const { apiVersion } = this;
        return extendURL(
            `https://${subdomain}.facebook.com/${apiVersion}${path}`,
            query
        );
    }

    async fetchApi(path, query, errorCode = 2) {
        const url = this.createApiUrl("graph", path, query);
        const res = await fetch(url);
        if (!res.ok) { throw new RedirectError(errorCode, await res.text()); }
        return res.json();
    }

    generateAuthUrl(scope, state, extra) {
        const { clientId, redirectUri } = this;

        return this.createApiUrl("www", `/dialog/oauth`, {
            ...extra,
            response_type: "code",
            client_id: clientId,
            redirect_uri: redirectUri,
            scope: scope.join(","),                 // FB odděluje čárkou
            state
        });
    }

    async swapCodeForTokens(code) {
        const { clientId, clientSecret, redirectUri } = this;

        return this.fetchApi(`/oauth/access_token`, {
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            code
        });

    }

}
