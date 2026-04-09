import { Account } from "../class/Account";
import { vault } from "../consts";


export class MagicAccount extends Account {

    async _resolveProfile() {
        const { grant } = this;
        const { access_token } = this.credentials;
        const payload = grant.readAccessToken(access_token);
        return { id: payload.sub };
    }

    async _resolveTokens() {
        return this.credentials;
    }

}
