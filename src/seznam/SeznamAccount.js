import { google } from "googleapis";
import { solids } from "@randajan/props";

import { OAuth2Account } from "../class/OAuth2Account";
import { vault } from "../consts";



export class SeznamAccount extends OAuth2Account {

    async profile() {
        const grant = vault.get(this.client);
        const { access_token } = this.credentials;

        return grant.fetchApiGet("/user", {
            Authorization: `bearer ${access_token}`, "Accept": "application/json"
        });
    }

    async tokens() {
        return this.credentials;
    }

    async scopes() {
        if (this.credentials?.scopes) {
            return super.scopes(this.credentials.scopes);
        }
        return [];
    }

}