import { vault } from "../consts";
import { virtuals } from "@randajan/props";
import { OAuth2Grant } from "./OAuth2Grant";
import { OAuth2Account } from "./OAuth2Account";


export class OAuth2Client {

    static Grant = OAuth2Grant;
    static Account = OAuth2Account;

    constructor(options={}) {

        const { Grant } = this.constructor;
        const grant = new Grant(this, options);

        virtuals(this, {
            name:_=>grant.name,
            uidKey:_=>grant.uidKey
        })

        vault.set(this, grant);
    }

    account(credentials, ...args) {
        const grant = vault.get(this);
        const c = grant.getCredentials ? grant.getCredentials(credentials, ...args) : credentials;
        return (c instanceof Promise) ? c.then(cr => grant.createAccount(cr)) : grant.createAccount(c);
    }

    getInitAuthURL(options = {}) {
        const grant = vault.get(this);
        try { return grant.getInitAuthURL(options); }
        catch (err) { return grant.fallbackRedirect(1, err); }
    }

    getExitAuthURL({ code, state }, context) {
        const grant = vault.get(this);
        try { return grant.getExitAuthURL({ code, state }, context); }
        catch (err) { return grant.fallbackRedirect(2, err); }
    }

}