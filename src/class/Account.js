import { solids } from "@randajan/props";
import { formatCredentials } from "../tools";




export class Account {

    static create(grant, credentials={}) {
        return new this(grant, credentials);
    }

    constructor(grant, credentials={}) {

        credentials = formatCredentials(credentials);

        solids(this, {
            grant,
            credentials
        }, false);
    }

    async uid() {
        const profile = await this.profile();
        const { name, accountId } = this.grant;
        const id = profile?.[accountId];
        if (id) { return `${name}:${id}`; }
    }

    async profile() {
        return {};
    }

    async tokens() {
        return {};
    }

    async scopes(scopes) {
       const { grant } = this;

        if (typeof grant._effaceScopes !== "function") { return []; }

        return grant._effaceScopes(scopes);
    }

}
