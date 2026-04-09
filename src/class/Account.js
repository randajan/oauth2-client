import { solids } from "@randajan/props";
import { formatCredentials } from "../tools";




export class Account {

    constructor(grant, credentials={}) {

        solids(this, {
            grant,
            credentials:formatCredentials(credentials)
        }, false);
    }

    async _resolveProfile(...args) {
        return {};
    }

    async _resolveTokens(...args) {
        return {};
    }

    async _resolveScopes(...args) {
        return [];
    }

    async profile(...args) {
        return this.grant.formatProfile(await this._resolveProfile(...args));
    }

    async tokens(...args) {
        return this._resolveTokens(...args);
    }

    async scopes(...args) {
       const { grant } = this;

        if (typeof grant._effaceScopes !== "function") { return []; }
        return grant._effaceScopes(await this._resolveScopes(...args));
    }

}
