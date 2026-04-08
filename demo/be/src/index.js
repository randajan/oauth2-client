import express from 'express';
import cors from "cors";
import oauth from "./oauth/index.js";

const app = express();
const PORT = 3999;

app.use(cors());

app.get("/oauth/:grant/init", async (req, res)=>{
    const { query, params } = req;
    const grant = oauth.get(params.grant);
    if (!grant) { res.sendStatus(404); return; }
    const redirect = await grant.getInitAuthURL({
        state:query.state,
        userId:query.userId
    });
    res.redirect(redirect);
});

app.get("/oauth/:grant/exit", async (req, res)=> {
    const { query, params } = req;
    const grant = oauth.get(params.grant);
    if (!grant) { res.sendStatus(404); return; }
    const redirect = await grant.getExitAuthURL(query, { req, res });
    res.redirect(redirect);
});

app.listen(PORT, () => {
    console.log(`Server běží na http://localhost:${PORT}`);
});