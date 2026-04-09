import { info, log } from "@randajan/simple-lib/node";

import express from 'express';
import cors from "cors";
import oauth from "./oauth/index.js";

const app = express();

app.use(cors());

app.get("/oauth", async (req, res)=>{
    res.json([...oauth.grants.keys()]);
});

oauth.grants.forEach(grant=>{

    app.get(`/oauth/${grant.key}/init`, async (req, res)=>{
        const { query } = req;
        const redirect = await grant.getInitAuthURL({
            state:query.state,
            userId:query.userId
        });
        res.redirect(redirect);
    });

    app.get(`/oauth/${grant.key}/exit`, async (req, res)=> {
        const { query } = req;
        const redirect = await grant.getExitAuthURL(query, { req, res });
        res.redirect(redirect);
    });

});

const server = app.listen(info.port, () => {
    console.log(`Server běží na http://localhost:${info.port}`);
});