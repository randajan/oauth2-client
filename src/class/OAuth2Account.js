import { solids } from "@randajan/props";
import { vault } from "../consts";




export class OAuth2Account {

    constructor(client, credentials={}) {
        solids(this, {
            client,
        }, false);
    }

    async uid() {
        const profile = await this.profile();
        const { name, uidKey } = this.client;
        const id = profile?.[uidKey];
        if (id) { return `${name}:${id}`; }
    }

    async profile() {
        return {};
    }

    async tokens() {
        return {};
    }

    async scopes(scopes) {
        const grant = vault.get(this.client);
        return grant.effaceScopes(scopes);
    }

}