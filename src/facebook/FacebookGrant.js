import fetch from "node-fetch";
import { OAuth2Grant } from "../class/OAuth2Grant";
import { extendURL, validateStr } from "../tools";
import { RedirectError } from "../errors";



export class FacebookGrant extends OAuth2Grant {

    static name = "facebook";
    static uidKey = "id";
    static scopePrefix = "";
    static scopesCommon = [];
    static scopesNoPrefix = [];

    constructor(client, opt = {}) {
        super(client, opt);

        this.apiVersion = validateStr(true, opt.apiVersion, "options.apiVersion");
    }

    generateAuthUrl(scope, state, extra) {
        const { apiVersion, clientId, redirectUri } = this;

        return extendURL(
            `https://www.facebook.com/${apiVersion}/dialog/oauth`,
            {
                ...extra,
                response_type: "code",
                client_id: clientId,
                redirect_uri: redirectUri,
                scope: scope.join(","),                 // FB odděluje čárkou
                state
            }
        );
    }

    async swapCodeForTokens(code) {
        const { clientId, clientSecret, redirectUri, apiVersion } = this;

        const url = extendURL(
            `https://graph.facebook.com/${apiVersion}/oauth/access_token`,
            {
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                code
            }
        );

        const res = await fetch(url);
        if (!res.ok) { throw new RedirectError(2, await res.text()); }
        return res.json();
    }

}