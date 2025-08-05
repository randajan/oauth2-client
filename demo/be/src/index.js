import express from 'express';
import cors from "cors";

import { oauthClients } from "./oauth/google";

const app = express();
const PORT = 3999;

app.use(cors());

app.get("/oauth/:grant/init", (req, res)=>{
    const { query, params } = req;
    const oauth = oauthClients[params.grant];
    if (!oauth) { res.status = 404; return; }
    const url = oauth.getInitAuthURL({ state:query.state });
    res.redirect(url);
});

app.get("/oauth/:grant/exit", async (req, res)=> {
    const { query, params } = req;
    const oauth = oauthClients[params.grant];
    if (!oauth) { res.status = 404; return; }
    const redirect = await oauth.getExitAuthURL(query, { req, res });
    res.redirect(redirect);
});

app.listen(PORT, () => {
    console.log(`Server běží na http://localhost:${PORT}`);
});
