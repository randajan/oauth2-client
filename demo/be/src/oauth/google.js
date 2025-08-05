import { GoogleClient } from "../../../../dist/esm/google/index.mjs";
import { FacebookClient } from "../../../../dist/esm/facebook/index.mjs";

import envJson from "../.env.json";
const env = JSON.parse(envJson);

export const oauthClients = {};

oauthClients.google = new GoogleClient({
    uidKey: "email",
    isOffline: true,
    landingUri: "http://localhost:3000",
    fallbackUri: "http://localhost:3000",
    scopes: [
        "drive"
    ],
    onAuth: async (account, { context, state }) => {
        const { req, res } = context;
        console.log(state, await account.uid());
    },
    onRenew: (account) => {

    },
    getCredentials: async () => {
        return env.google.tokens;
    },
    ...env.google
});

oauthClients.facebook = new FacebookClient({
    apiVersion:"v23.0",
    landingUri: "http://localhost:3000",
    fallbackUri: "http://localhost:3000",
    onAuth: async (account, { context, state }) => {
        const { req, res } = context;
        console.log(state, await account.uid());
    },
    onRenew: (account) => {

    },
    getCredentials: async () => {
        return env.google.tokens;
    },
    ...env.facebook
});