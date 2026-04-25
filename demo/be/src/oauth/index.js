import { info, log } from "@randajan/simple-lib/node";

import { Client } from "../../../../dist/esm/index.mjs";
import { FacebookGrant } from "../../../../dist/esm/facebook/index.mjs";
import { GoogleGrant } from "../../../../dist/esm/google/index.mjs";
import { MagicGrant } from "../../../../dist/esm/magic/index.mjs";
import { SeznamGrant } from "../../../../dist/esm/seznam/index.mjs";
import { env } from "../env";

const beUrl = `http://localhost:${info.port}`;
const feUrl = `http://localhost:${info.ports.client}`;

const oauth = new Client(
    [FacebookGrant, GoogleGrant, MagicGrant, SeznamGrant],
    (grantKey, grantName)=>({
        initUri:`${beUrl}/oauth/${grantKey}/init`,
        exitUri:`${beUrl}/oauth/${grantKey}/exit`,
        landingUri: `${feUrl}/${grantKey}/ok`,
        pendingUri: `${feUrl}/${grantKey}/pending`,
        failureUri: `${feUrl}/${grantKey}/error`,
        onMagic: async (confirmUrl, { userId }) => {
            console.log(`${grantKey} link for ${userId}: ${confirmUrl}`);
        },
        onAuth: async (account, { state }) => {
            console.log(grantKey, state, await account.profile());
        },
        onRenew: async (account) => {

        },
        onError: async (err)=>{
            console.log("OAUTH ERROR", err.code);
        }
    })
);

oauth.add("google", {
    ...env.google,
    formatProfile:({email, name, picture})=>({
        id:`google:${email}`,
        email,
        name,
        avatar:picture
    })
});

oauth.add("seznam", {
    ...env.seznam,
    formatProfile:({email, firstname, lastname})=>({
        id:`seznam:${email}`,
        email,
        name:`${firstname} ${lastname}`,
    })
});

oauth.add("facebook", {
    ...env.facebook,
    formatProfile:(p)=>({
        id:`facebook:${p.email}`,
        ...p
    })
});

oauth.add("magic", {
    ...env.magic,
    formatProfile:(p)=>({
        id:`magic:${p.id}`,
        email:p.id
    })
});

export default oauth;
