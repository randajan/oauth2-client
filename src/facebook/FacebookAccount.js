import { Account } from "../class/Account";
import { vault } from "../consts";


export class FacebookAccount extends Account {

    async profile(fields = ["id", "name", "email", "picture"]) {
        const { grant } = this;
        const { access_token } = this.credentials;

        return grant.fetchApi(`/me`, {
            access_token,
            fields: fields.join(",")
        }, 3);
    }

    async tokens() {
        return this.credentials;
    }

    async scopes() {
        const { grant } = this;
        const { access_token } = this.credentials;

        const { data } = await grant.fetchApi("/me/permisssions", {
            access_token
        }, 3);

        // /me/permissions vrací [{permission, status}, …]
        return super.scopes(data.filter(p => p.status === "granted").map(p => p.permission));
    }

}