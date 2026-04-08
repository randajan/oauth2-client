import { OAuthHub } from "../../../../dist/esm/index.mjs";
import { FacebookClient } from "../../../../dist/esm/facebook/index.mjs";
import { GoogleClient } from "../../../../dist/esm/google/index.mjs";
import { MagicClient } from "../../../../dist/esm/magic/index.mjs";
import { SeznamClient } from "../../../../dist/esm/seznam/index.mjs";
import { env } from "../env";


const oauth = new OAuthHub({
    providers:[FacebookClient, GoogleClient, MagicClient, SeznamClient],
    fallbackUri: "http://localhost:3000/error",
    landingUri: "http://localhost:3000",
    onMagic: async (client, confirmUrl, { userId }) => {
        console.log(`${client.key} link for ${userId}: ${confirmUrl}`);
    },
    onAuth: async (client, account, { state }) => {
        console.log(client.key, state, await account.profile());
    },
    onRenew: async () => {},
    getCredentials: async (client) => {
        if (client.name === "google") { return env.google.tokens; }
    }
});

oauth.add("facebook", env.facebook);
oauth.add("google", env.google);
oauth.add("magic", env.magic);
oauth.add("seznam", env.seznam);

export default oauth;
