import { OAuth2Client } from "../class/OAuth2Client";
import { FacebookAccount } from "./FacebookAccount";
import { FacebookGrant } from "./FacebookGrant";


export const createFacebookOAuth2 = (options={})=>new OAuth2Client(FacebookGrant, options);
export default createFacebookOAuth2;

export {
    FacebookAccount,
    FacebookGrant
}