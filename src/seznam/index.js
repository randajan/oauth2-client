import { Client } from "../class/Client";
import { SeznamAccount } from "./SeznamAccount";
import { SeznamGrant } from "./SeznamGrant";


export class SeznamClient extends Client {
    static Grant = SeznamGrant;
}

export default (options={})=>new SeznamClient(options);

export {
    SeznamAccount,
    SeznamGrant
}
