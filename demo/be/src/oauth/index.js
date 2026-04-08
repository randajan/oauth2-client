import { Client } from "../../../../dist/esm/index.mjs";
import { FacebookGrant } from "../../../../dist/esm/facebook/index.mjs";
import { GoogleGrant } from "../../../../dist/esm/google/index.mjs";
import { MagicGrant } from "../../../../dist/esm/magic/index.mjs";
import { SeznamGrant } from "../../../../dist/esm/seznam/index.mjs";
import { env } from "../env";


const oauth = new Client({
    providers:[FacebookGrant, GoogleGrant, MagicGrant, SeznamGrant],
    fallbackUri: "http://localhost:3000/error",
    landingUri: "http://localhost:3000",
    onMagic: async (grant, confirmUrl, { userId }) => {
        console.log(`${grant.key} link for ${userId}: ${confirmUrl}`);
    },
    onAuth: async (grant, account, { state }) => {
        console.log(grant.key, state, await account.profile());
    },
    onRenew: async () => {}
});

oauth.add("facebook", env.facebook);
oauth.add("google", env.google);
oauth.add("magic", env.magic);
oauth.add("seznam", env.seznam);

console.log(oauth.grants.keys());

export default oauth;
