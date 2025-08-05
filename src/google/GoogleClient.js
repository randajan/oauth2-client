import { OAuth2Client } from "../class/OAuth2Client";
import { GoogleAccount } from "./GoogleAccount";
import { GoogleGrant } from "./GoogleGrant";


export class GoogleClient extends OAuth2Client {

    static Grant = GoogleGrant;
    static Account = GoogleAccount;
}