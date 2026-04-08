import { google } from "googleapis";
import { ScopeGrant } from "../class/ScopeGrant";
import { GoogleAccount } from "./GoogleAccount";

export class GoogleGrant extends ScopeGrant {

    static name="google";
    static uidKey="id";
    static scopePrefix="https://www.googleapis.com/auth/";
    static scopesCommon=["openid", "userinfo.profile", "userinfo.email"];
    static scopesNoPrefix=["openid"];
    static Account = GoogleAccount;

    constructor(client, opt={}) {
        super(client, opt);

        this.auth = this.createAuth();
    }

    createAuth() {
        const { optExtra, clientId, clientSecret, redirectUri } = this;
        return new google.auth.OAuth2({ ...optExtra, clientId, clientSecret, redirectUri });
    }

    generateAuthUrl(scope, state, extra) {
        return this.auth.generateAuthUrl({
            ...extra,
            access_type: this.isOffline ? "offline" : "online",
            scope,
            state
        });
    }

    async swapCodeForTokens(code) {
        const { tokens } = await this.auth.getToken(code);
        return tokens;
    }

}
