import { solids } from "@randajan/props";
import { vault } from "../consts";
import { formatCredentials } from "../tools";




export class Account {

    constructor(client, credentials={}) {

        credentials = formatCredentials(credentials);

        solids(this, {
            client,
            credentials
        }, false);
    }

    async uid() {
        const profile = await this.profile();
        const { name, accIdKey } = this.client;
        const id = profile?.[accIdKey];
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

        if (typeof grant.effaceScopes !== "function") { return []; }

        return grant.effaceScopes(scopes);
    }

}
