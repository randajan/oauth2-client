import { info, log } from "@randajan/simple-lib/node";

import { Client } from "../../../../dist/esm/index.mjs";
import { FacebookGrant } from "../../../../dist/esm/facebook/index.mjs";
import { GoogleGrant } from "../../../../dist/esm/google/index.mjs";
import { MagicGrant } from "../../../../dist/esm/magic/index.mjs";
import { SeznamGrant } from "../../../../dist/esm/seznam/index.mjs";
import { env } from "../env";

const beUrl = `http://localhost:${info.port}`;
const feUrl = `http://localhost:${info.ports.client}`;

const oauth = new Client(
    [FacebookGrant, GoogleGrant, MagicGrant, SeznamGrant],
    (grantKey, grantName)=>({
        redirectUri:`${beUrl}/oauth/${grantKey}/exit`,
        fallbackUri: `${feUrl}/${grantKey}/error`,
        landingUri: `${feUrl}/${grantKey}/ok`,
        magicUri:`${feUrl}/${grantKey}/pending`,
        onMagic: async (confirmUrl, { userId }) => {
            console.log(`${grantKey} link for ${userId}: ${confirmUrl}`);
        },
        onAuth: async (account, { state }) => {
            console.log(grantKey, state, await account.uid(), await account.profile());
        },
        onRenew: async (grantKey, account) => {

        }
    })
);

oauth.add("google", env.google);
oauth.add("seznam", env.seznam);
oauth.add("facebook", env.facebook);
oauth.add("magic", env.magic);

export default oauth;
