import { Client } from "../class/Client";
import { SeznamAccount } from "./SeznamAccount";
import { SeznamGrant } from "./SeznamGrant";


export const createSeznamOAuth2 = (options={})=>new Client(SeznamGrant, options);
export default createSeznamOAuth2;

export {
    SeznamAccount,
    SeznamGrant
}