import { FacebookAccount } from "./FacebookAccount";
import { FacebookGrant } from "./FacebookGrant";

export default (options={})=>new FacebookGrant(options);

export {
    FacebookAccount,
    FacebookGrant
}