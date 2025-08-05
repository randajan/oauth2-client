import facebookOAuth2 from "../../../../dist/esm/facebook/index.mjs";
import { env } from "../env";


export default facebookOAuth2({
    apiVersion:"v23.0",
    landingUri: "http://localhost:3000",
    fallbackUri: "http://localhost:3000",
    onAuth: async (account, { context, state }) => {
        const { req, res } = context;
        console.log(state, await account.profile());
    },
    onRenew: (account) => {

    },
    ...env.facebook
});