import magicOAuth2 from "../../../../dist/esm/magic/index.mjs";
import { extendURL } from "../../../../src/tools";
import { env } from "../env";


export default magicOAuth2({
    uidKey: "id",
    magicUri: "http://localhost:3000/magicLobby",
    landingUri: "http://localhost:3000",
    fallbackUri: "http://localhost:3000",
    onMagic: async (confirmUrl, { magicUri, userId }) => {
        console.log(`magic link for ${userId}: ${confirmUrl}`);
    },
    onAuth: async (account, { context, state }) => {
        const { req, res } = context;
        console.log(state, await account.profile());
    },
    onRenew: (account) => {

    },
    ...env.magic
});
