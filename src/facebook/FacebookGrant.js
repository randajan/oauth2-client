import fetch from "node-fetch";
import { ScopeGrant } from "../class/ScopeGrant";
import { extendURL, validateStr } from "../tools";
import { RedirectError } from "../errors";
import { FacebookAccount } from "./FacebookAccount";
import { solid } from "@randajan/props";



export class FacebookGrant extends ScopeGrant {

    static name = "facebook";
    static scopePrefix = "";
    static scopesCommon = [];
    static scopesNoPrefix = [];
    static Account = FacebookAccount;

    constructor(opt = {}) {
        super(opt);

        solid(this, "apiVersion", validateStr(false, opt.apiVersion, "options.apiVersion") || "v23.0");
    }

    _createApiUrl(subdomain, path, query={}) {
        const { apiVersion } = this;
        return extendURL(
            `https://${subdomain}.facebook.com/${apiVersion}${path}`,
            query
        );
    }

    async _fetchApi(path, query) {
        const url = this._createApiUrl("graph", path, query);
        const res = await fetch(url);
        if (!res.ok) { throw new RedirectError(20, await res.text()); }
        return res.json();
    }

    _generateAuthUrl(scope, state, extra) {
        const { clientId, redirectUri } = this;

        return this._createApiUrl("www", `/dialog/oauth`, {
            ...extra,
            response_type: "code",
            client_id: clientId,
            redirect_uri: redirectUri,
            scope: scope.join(","),                 // FB odděluje čárkou
            state
        });
    }

    async _swapCodeForTokens(code) {
        const { clientId, clientSecret, redirectUri } = this;

        return this._fetchApi(`/oauth/access_token`, {
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            code
        });

    }

}
