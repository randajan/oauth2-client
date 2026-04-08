import { Client } from "../class/Client";
import { MagicAccount } from "./MagicAccount";
import { MagicGrant } from "./MagicGrant";


export class MagicClient extends Client {
    static Grant = MagicGrant;
}

export default (options = {}) => new MagicClient(options);

export {
    MagicAccount,
    MagicGrant
};
