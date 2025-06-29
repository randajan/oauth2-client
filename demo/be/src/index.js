
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
    onAuth:async (account)=>{
        console.log(await account.getUID());
    },
    onRenew:(account)=>{

    },
    ...env
});

const app = express();
const PORT = 3999;


app.use(cors());


app.get("/oauth/init", (req, res)=>{
    const { query } = req;
    const url = oauth.getInitAuthURL(query.landingUri);
    res.redirect(url);
});


app.get("/oauth/exit", async (req, res)=> {
    const { query } = req;
    const redirect = await oauth.getExitAuthURL(query.code, query.state);
    res.redirect(redirect);
});

app.listen(PORT, () => {
    console.log(`Server běží na http://localhost:${PORT}`);
});
