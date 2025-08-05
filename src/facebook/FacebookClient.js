import { OAuth2Client } from "../class/OAuth2Client";
import { FacebookAccount } from "./FacebookAccount";
import { FacebookGrant } from "./FacebookGrant";


export class FacebookClient extends OAuth2Client {

    static Grant = FacebookGrant;
    static Account = FacebookAccount;
}