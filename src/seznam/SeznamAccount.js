import { Account } from "../class/Account";



export class SeznamAccount extends Account {

    async _resolveProfile() {
        const { grant } = this;
        const { access_token } = this.credentials;

        return grant._fetchApiGet("/user", {
            Authorization: `bearer ${access_token}`, "Accept": "application/json"
        });
    }

    async _resolveTokens() {
        return this.credentials;
    }

    async _resolveScopes() {
        return this.credentials.scopes;
    }

}