import { vault } from "../consts";
import { virtuals } from "@randajan/props";


export class OAuth2Client {

    constructor(Grant, options={}) {
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