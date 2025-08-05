import { google } from "googleapis";
import { OAuth2Grant } from "../class/OAuth2Grant";
import { GoogleAccount } from "./GoogleAccount";

export class GoogleGrant extends OAuth2Grant {

    static name="google";
    static uidKey="id";
    static scopePrefix="https://www.googleapis.com/auth/";
    static scopesCommon=["openid", "userinfo.profile", "userinfo.email"];
    static scopesNoPrefix=["openid"];
    static Account = GoogleAccount;

    constructor(client, opt={}) {
        super(client, opt);

        const { optExtra, clientId, clientSecret, redirectUri } = this;

        this.optAuth = { ...optExtra, clientId, clientSecret, redirectUri };
        this.auth = this.createAuth();
    }

    createAuth() {
        return new google.auth.OAuth2(this.optAuth);
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