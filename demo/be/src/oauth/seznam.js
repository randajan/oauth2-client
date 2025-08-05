import seznamOAuth2 from "../../../../dist/esm/seznam/index.mjs";
import { env } from "../env";


export default seznamOAuth2({
    uidKey: "id",
    landingUri: "http://localhost:3000",
    fallbackUri: "http://localhost:3000",
    onAuth: async (account, { context, state }) => {
        const { req, res } = context;
        console.log(state, await account.profile());
    },
    onRenew: (account) => {

    },
    ...env.seznam
});