import { google } from "googleapis";
import { ScopeGrant } from "../class/ScopeGrant";
import { GoogleAccount } from "./GoogleAccount";
import { solid } from "@randajan/props";

export class GoogleGrant extends ScopeGrant {

    static name="google";
    static uidKey="id";
    static scopePrefix="https://www.googleapis.com/auth/";
    static scopesCommon=["openid", "userinfo.profile", "userinfo.email"];
    static scopesNoPrefix=["openid"];
    static Account = GoogleAccount;

    constructor(opt={}) {
        super(opt);

        solid(this, "auth", this._createAuth());
    }

    _createAuth() {
        const { extra, clientId, clientSecret, redirectUri } = this;
        return new google.auth.OAuth2({ ...extra, clientId, clientSecret, redirectUri });
    }

    _generateAuthUrl(scope, state, extra) {
        return this.auth.generateAuthUrl({
            ...extra,
            access_type: this.isOffline ? "offline" : "online",
            scope,
            state
        });
    }

    async _swapCodeForTokens(code) {
        const { tokens } = await this.auth.getToken(code);
        return tokens;
    }

}
