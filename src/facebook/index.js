import { Client } from "../class/Client";
import { FacebookAccount } from "./FacebookAccount";
import { FacebookGrant } from "./FacebookGrant";


export const createFacebookOAuth2 = (options={})=>new Client(FacebookGrant, options);
export default createFacebookOAuth2;

export {
    FacebookAccount,
    FacebookGrant
}