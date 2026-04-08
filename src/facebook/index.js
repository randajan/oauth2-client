import { Client } from "../class/Client";
import { FacebookAccount } from "./FacebookAccount";
import { FacebookGrant } from "./FacebookGrant";


export class FacebookClient extends Client {
    static Grant = FacebookGrant;
}

export default (options={})=>new FacebookClient(options);

export {
    FacebookAccount,
    FacebookGrant
}