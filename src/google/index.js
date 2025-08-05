import { OAuth2Client } from "../class/OAuth2Client";
import { GoogleAccount } from "./GoogleAccount";
import { GoogleGrant } from "./GoogleGrant";


export const createGoogleOAuth2 = (options={})=>new OAuth2Client(GoogleGrant, options);
export default createGoogleOAuth2;

export {
    GoogleAccount,
    GoogleGrant
}