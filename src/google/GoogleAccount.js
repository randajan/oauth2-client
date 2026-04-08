import { google } from "googleapis";
import { solids } from "@randajan/props";

import { Account } from "../class/Account";
import { vault } from "../consts";



export class GoogleAccount extends Account {

    constructor(client, credentials={}) {
        super(client, credentials);

        const grant = vault.get(client);

        const auth = grant.createAuth();
        auth.setCredentials(this.credentials);
        auth.on('tokens', _=>{ grant.onRenew(this); });

        solids(this, {
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
        
        if (auth.credentials?.scope) { return super.scopes(auth.credentials.scope); }

        const { token } = await auth.getAccessToken();
        if (!token) { return []; }

        const info = await auth.getTokenInfo(token);
        if (!info) { return []; }

        return super.scopes(info.scopes);
    }

}
