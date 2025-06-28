import { google } from "googleapis";
import { vault } from "../consts";
import { solids } from "@randajan/props";
import { effaceScopes } from "./scopes";

export class GoogleAccount {

    constructor(client, credentials) {

        const { createAuth, onRenew } = vault.get(client);

        const auth = createAuth();
        auth.setCredentials(credentials);
        auth.on('tokens', _=>{ onRenew(this); });

        solids(this, {
            client,
            auth,
        });
    }

    oauth2() {
        return google.oauth2({ auth: this.auth, version: 'v2' });
    }

    async profile() {
        const { data } = await this.oauth2().userinfo.get();
        return data;
    }

    async tokens() {
        const { token } = await this.auth.getAccessToken();

        return { ...this.auth.credentials, access_token: token };
    }

    async scopes() {
        const { auth } = this;

        if (auth.credentials?.scope) {
            return effaceScopes(auth.credentials.scope);
        }

        const { token } = await auth.getAccessToken();
        if (!token) { return []; }

        const info = await auth.getTokenInfo(token);
        if (!info) { return []; }

        return effaceScopes(info.scopes);
    }

}