import { info, log } from "@randajan/simple-lib/node";

import express from 'express';
import cors from "cors";
import facebook from "./oauth/facebook";
import google from "./oauth/google";
import seznam from "./oauth/seznam";

const oauthClients = {
    facebook,
    google,
    seznam
}

const app = express();
const PORT = 3999;

app.use(cors());

app.get("/oauth/:grant/init", (req, res)=>{
    const { query, params } = req;
    const oauth = oauthClients[params.grant];
    if (!oauth) { res.sendStatus(404); return; }
    const url = oauth.getInitAuthURL({ state:query.state });
    res.redirect(url);
});

app.get("/oauth/:grant/exit", async (req, res)=> {
    const { query, params } = req;
    const oauth = oauthClients[params.grant];
    if (!oauth) { res.sendStatus(404); return; }
    const redirect = await oauth.getExitAuthURL(query, { req, res });
    res.redirect(redirect);
});

app.listen(PORT, () => {
    console.log(`Server běží na http://localhost:${PORT}`);
});

process.on("beforeExit", _=>{
    console.log("a");
});
