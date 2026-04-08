import { Client } from "../class/Client";
import { MagicAccount } from "./MagicAccount";
import { MagicGrant } from "./MagicGrant";


export const createMagicOAuth2 = (options = {}) => new Client(MagicGrant, options);
export default createMagicOAuth2;

export {
    MagicAccount,
    MagicGrant
};
