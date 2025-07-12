
import { info, log } from "@randajan/simple-lib/node";
import { GoogleOAuth2 } from "../../../dist/esm/google/index.mjs";
import express from 'express';

import cors from "cors";

import envJson from "./.env.json";

const env = JSON.parse(envJson);

const oauth = new GoogleOAuth2({
    isOffline:true,
    landingUri:"http://localhost:3000",
    fallbackUri:"http://localhost:3000",
    scopes:[
        "drive"
    ],
    onAuth:async (account, { context, state })=>{
        const { req, res } = context;
        console.log(state, await account.uid());
    },
    onRenew:(account)=>{

    },
    getCredentials:async ()=>{
        return env.tokens;
    },
    ...env
});

const app = express();
const PORT = 3999;


app.use(cors());


app.get("/oauth/init", (req, res)=>{
    const { query } = req;
    const url = oauth.getInitAuthURL({ state:query.state });
    res.redirect(url);
});


app.get("/oauth/exit", async (req, res)=> {
    const { query } = req;
    const redirect = await oauth.getExitAuthURL(query, { req, res });
    res.redirect(redirect);
});

app.listen(PORT, () => {
    console.log(`Server běží na http://localhost:${PORT}`);
});
