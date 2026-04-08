import { Client } from "../class/Client";
import { GoogleAccount } from "./GoogleAccount";
import { GoogleGrant } from "./GoogleGrant";


export class GoogleClient extends Client {
    static Grant = GoogleGrant;
}

export default (options={})=>new GoogleClient(options);

export {
    GoogleAccount,
    GoogleGrant
}
