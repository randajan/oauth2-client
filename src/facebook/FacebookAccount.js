import { Account } from "../class/Account";
import { vault } from "../consts";


export class FacebookAccount extends Account {

    async _resolveProfile(fields = ["id", "name", "email", "picture"]) {
        const { grant } = this;
        const { access_token } = this.credentials;

        return grant._fetchApi(`/me`, {
            access_token,
            fields: fields.join(",")
        });
    }

    async _resolveTokens() {
        return this.credentials;
    }

    async _resolveScopes() {
        const { grant } = this;
        const { access_token } = this.credentials;

        const { data } = await grant._fetchApi("/me/permissions", {
            access_token
        });

        // /me/permissions vrací [{permission, status}, …]
        return data.filter(p => p.status === "granted").map(p => p.permission);
    }

}
