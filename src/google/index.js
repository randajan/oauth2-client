import { GoogleAccount } from "./GoogleAccount";
import { GoogleGrant } from "./GoogleGrant";

export default (options={})=>new GoogleGrant(options);

export {
    GoogleAccount,
    GoogleGrant
}
