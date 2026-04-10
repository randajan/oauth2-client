import { info, log } from "@randajan/simple-lib/node";

import express from 'express';
import cors from "cors";
import oauth from "./oauth/index.js";

const app = express();

app.use(cors());

app.get("/oauth", async (req, res)=>{
    res.json([...oauth.grants.values()].map(({ key, initUri })=>({ key, initUri })));
});

oauth.setupRoutes(grant=>{

    app.get(grant.initPath, async (req, res)=>{
        const { query } = req;
        const redirect = await grant.getInitURL(query, { context:{ req, res } });
        res.redirect(redirect);
    });

    app.get(grant.exitPath, async (req, res)=> {
        const { query } = req;
        const redirect = await grant.getExitURL(query, { context:{ req, res } });
        res.redirect(redirect);
    });

});

const server = app.listen(info.port, () => {
    console.log(`Server běží na http://localhost:${info.port}`);
});
