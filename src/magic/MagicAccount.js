import { Account } from "../class/Account";
import { vault } from "../consts";


export class MagicAccount extends Account {

    async profile() {
        const { grant } = this;
        const { access_token } = this.credentials;
        const payload = grant.readAccessToken(access_token);
        return { [grant.accIdKey]: payload.sub };
    }

    async tokens() {
        return this.credentials;
    }

    async scopes() {
        return [];
    }

}
