import { Client } from "../class/Client";
import { GoogleAccount } from "./GoogleAccount";
import { GoogleGrant } from "./GoogleGrant";


export const createGoogleOAuth2 = (options={})=>new Client(GoogleGrant, options);
export default createGoogleOAuth2;

export {
    GoogleAccount,
    GoogleGrant
}