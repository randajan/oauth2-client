import { Account } from "../class/Account";



export class SeznamAccount extends Account {

    async profile() {
        const { grant } = this;
        const { access_token } = this.credentials;

        return grant._fetchApiGet("/user", {
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