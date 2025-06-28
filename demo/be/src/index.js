
import { info, log } from "@randajan/simple-lib/node";
import oauthClient from "../../../dist/esm/index.mjs";
import { GoogleDriveSync } from "../../../dist/esm/drive/Sync.mjs";
import path from "path";
import express from 'express';

import cors from "cors";

import envJson from "./.env.json";

const env = JSON.parse(envJson);

const oauth = oauthClient({
    isOffline:true,
    landingUri:"http://localhost:3000",
    fallbackUri:"http://localhost:3000",
    scopes:[
        "drive"
    ],
    onAuth:async (account)=>{
        console.log(await account.tokens());
    },
    onRenew:(account)=>{

    },
    ...env
});

const account = oauth.account({access_token:env.token});
const driveSync = new GoogleDriveSync(account.auth, "1nbEGQgjKVel7BH5g4vBZJ8-NCSQY8JrI", path.join(info.dir.root, info.dir.dist, "../drive"));

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

app.get("/drive", async (req, res)=>{
    await driveSync.push("/Logo/test.txt");

    res.send("xxx");

    // const f = await drive.createFile("/Logo/test.txt", "very nice");
    // const file = await drive.readFileById(f.id);

    // res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
    // // res.setHeader(
    // //   "Content-Disposition",
    // //   `attachment; filename="${file.name}"`
    // // );

    // file.content.pipe(res);              // nebo await pipeline(fileStream, res);
});

app.listen(PORT, () => {
    console.log(`Server běží na http://localhost:${PORT}`);
});
