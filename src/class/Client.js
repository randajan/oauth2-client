import { vault } from "../consts";
import { virtuals } from "@randajan/props";
import { Grant } from "./Grant";


export class Client {

    static Grant = Grant;

    static isClass(Class) { return typeof Class === "function" && (Class === Client || Class.prototype instanceof Client); }

    constructor(options={}) {
        const { Grant } = this.constructor;
        const grant = new Grant(this, options);

        virtuals(this, {
            key:_=>grant.key,
            name:_=>grant.name,
            accIdKey:_=>grant.accIdKey
        })

        vault.set(this, grant);
    }

    account(credentials, ...args) {
        const grant = vault.get(this);
        const c = grant.getCredentials(credentials, ...args);
        return (c instanceof Promise) ? c.then(cr => grant.createAccount(cr)) : grant.createAccount(c);
    }

    async getInitAuthURL(options = {}) {
        const grant = vault.get(this);
        try { return await grant.getInitAuthURL(options); }
        catch (err) { return grant.fallbackRedirect(1, err); }
    }

    async getExitAuthURL({ code, state }, context) {
        const grant = vault.get(this);
        try { return await grant.getExitAuthURL({ code, state }, context); }
        catch (err) { return grant.fallbackRedirect(2, err); }
    }

}
