import { OAuth2Client } from "../class/OAuth2Client";
import { SeznamAccount } from "./SeznamAccount";
import { SeznamGrant } from "./SeznamGrant";


export const createSeznamOAuth2 = (options={})=>new OAuth2Client(SeznamGrant, options);
export default createSeznamOAuth2;

export {
    SeznamAccount,
    SeznamGrant
}