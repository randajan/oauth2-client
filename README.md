# @randajan/oauth2-client

[![NPM](https://img.shields.io/npm/v/@randajan/oauth2-client.svg)](https://www.npmjs.com/package/@randajan/oauth2-client)Â 
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

---

## Overview

**@randajan/oauth2-client** is a lightweight wrapper that streamlines OAuthÂ 2.0 and serviceâ€‘account authentication for GoogleÂ APIs.  
It hides the boilerplate around `google-auth-library`, keeps tokens fresh and lets you focus on writing business logic instead of wiring endpoint plumbing.

This library meticulously supervises the entire redirect flow, intercepts every error, and relays it to the front-end, ensuring the browser is never stranded on a raw JSON API endpoint as can happen with other solutions.

### ESM **&** CommonJS ready

The package ships dual builds so you can **import** or **require** according to your toolâ€‘chain:

```js
// ESM
import { createGoogleOAuth2 } from "@randajan/oauth2-client/google";

// CommonJS
const { createGoogleOAuth2 } = require("@randajan/oauth2-client/google");
```

---

## QuickÂ startÂ â€” minimal Express example

```js
import express from "express";
import { createGoogleOAuth2 } from "@randajan/oauth2-client/google";

const google = createGoogleOAuth2({
  clientId:          process.env.GOOGLE_CLIENT_ID,
  clientSecret:      process.env.GOOGLE_CLIENT_SECRET,
  redirectUri:       "http://localhost:3999/oauth/exit",     // common backend route
  landingUri:        "http://localhost:3000",                // frontâ€‘end OK screen (default)
  fallbackUri:       "http://localhost:3000/login/error",    // frontâ€‘end error screen
  scopes:            ["drive"],                              // extra scopes
  isOffline:         true,                                   // ask for refresh_token
  onAuth: async (account, context) => {
    // first time we see this user
    console.log("new account", await account.uid());
    // store tokens somewhere safe â€¦
  },
  onRenew: async account => {
    // Google issued fresh tokens
    console.log("tokens renewed for", account);
  },
  extra:{
    //will be passed to new google.auth.OAuth2(...)
  }
});

const app = express();

app.get("/oauth/init", async (req, res) => {
  const redirect = await google.getInitAuthURL({ landingUri:req.query.landingUri });
  res.redirect(redirect);
});

app.get("/oauth/exit", async (req, res) => {
  const redirect = await google.getExitAuthURL(req.query, { req, res });
  res.redirect(redirect);           // back to frontâ€‘end
});

app.listen(3999);
```

---

## Shared `options`

Every concrete OAuth2 client (Google, MicrosoftÂ â€¦â€‹) accepts the same constructor options so you can swap providers without refactoring:

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `clientId` | `string` | âś”ď¸Ž | OAuthÂ client ID issued by the provider |
| `clientSecret` | `string` | âś”ď¸Ž | OAuthÂ client secret |
| `redirectUri` | `string (URL)` | âś”ď¸Ž | Backâ€‘end endpoint that receives `code` from the provider |
| `fallbackUri` | `string (URL)` | âś”ď¸Ž | Where to send the user when *anything* goes wrong. Error errorCode & errorMessage are appended as query params |
| `landingUri` | `string (URL)` | Â  | Default frontâ€‘end page after successful login (may be overridden per request) |
| `scopes` | `stringÂ \|Â string[]` | Â  | Extra scopes. Google is always invoked with `openidÂ userinfo.profileÂ userinfo.email` |
| `isOffline` | `boolean` | Â  | When `true` requests `access_type=offline` so a `refresh_token` is issued |
| `onAuth` | `(account, { context, state, landingUri })Â => Promise<string[]Â \|Â void>` | âś”ď¸Ž | Called once after new account is created. Return uri (string) for custom redirect |
| `onRenew` | `(account)Â => void` | âś”ď¸Ž | Called whenever the accessâ€‘token is automatically refreshed |
| `getCredentials` | `(userId)`=>object | Promise<object> | | Called inside oauth.account(...), all arguments will be passed. If this trait returns Promise oauth.account(...) will also return Promise.
| `extra` | `object` | Â  | Arbitrary options forwarded to the underlying SDK |

---

## Google client

### Import path

```js
import { createGoogleOAuth2 } from "@randajan/oauth2-client/google";
```

### Factory **`createGoogleOAuth2`**

| Member | Returns | Description |
|--------|---------|-------------|
| `createGoogleOAuth2(options)` | `Client` | Creates a new client. See **options** above |
| `getInitAuthURL({ landingUri?, scopes?, state?, extra? })` | `Promise<string>` | Generates the consentâ€‘screen URL. Parameters override the defaults from the constructor |
| `getExitAuthURL({code, state}, context)` | `Promise<string>` | Exchanges `code` for tokens, triggers `onAuth`, then returns a redirect URL (either `landingUri` or a new **init** URL if more scopes are needed). Context will be passed as second argument to `onAuth` trait |
| `account(credentials, ...args)` | `GoogleAccount` | Converts raw token `credentials` into a handy account object. getCredentials(credentials, ...args) trait will be used if was provided into the options |

### Class **`GoogleAccount`**

| Member | Returns | Description |
|--------|---------|-------------|
| **Property** `auth` | `google.auth.OAuth2` | *Raw* `google-auth-library` instance. Use it with any `googleapis` service |
| `uid()` | `Promise<string>` | Returns a stable userâ€‘id (`google:{userId}`) |
| `profile()` | `Promise<google.oauth2#Userinfo>` | Shorthand for `GET /oauth2/v2/userinfo` |
| `tokens()` | `Promise<{ access_token, refresh_token, expiry_date, â€¦ }>` | Current token set (autoâ€‘refreshes if needed) |
| `scopes()` | `Promise<string[]>` | Scopes granted to the current access_token |

---

## Magic link client

### Import path

```js
import createMagicOAuth2 from "@randajan/oauth2-client/magic";
```

### Basic flow

```js
const magic = createMagicOAuth2({
  magicSecret: process.env.MAGIC_SECRET,
  redirectUri: "http://localhost:3999/oauth/magic/exit",
  magicUri: "http://localhost:3000/magic-lobby",
  landingUri: "http://localhost:3000",
  fallbackUri: "http://localhost:3000/login/error",
  onMagic: async (confirmUrl, { userId, magicUri }) => {
    await sendMagicEmail(userId, confirmUrl);
    return `${magicUri}?emailSent=1&userId=${encodeURIComponent(userId)}`;
    // return null; // fallback -> magicUri?userId=...
  },
  onAuth: async (account) => {
    console.log(await account.profile()); // { id: "..." }
  },
  onRenew: async () => {}
});

const redirectUrl = await magic.getInitAuthURL({
  userId: "user-123",
  state: { from: "email-login" }
});
// redirectUrl was returned from onMagic
```

### Magic options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `magicSecret` | `string` | yes | HMAC secret used to sign and verify magic tokens |
| `magicUri` | `string (URL)` | no | URL used after init flow when `onMagic` returns `null`/`undefined` |
| `magicTtlMs` | `number` | no | TTL for magic `code` and anti-replay memory (default `600000`) |
| `accessTokenTtlMs` | `number` | no | TTL for issued `access_token` credentials (default `86400000`) |
| `onMagic` | `(confirmUrl, meta) => Promise<string \| void> \| string \| void` | yes | Callback that receives generated confirmation URL and returns final redirect URL (or nothing for `magicUri` fallback) |

### Init options

`getInitAuthURL` requires top-level `userId` for magic flow.
If `onMagic` returns a URL, it must be a valid absolute URL.
If `onMagic` returns `null`/`undefined`, fallback URL is `magicUri` with appended `userId` query.

---


## Utility tool

### `extendURL(url, query): string`

```js
import { extendURL } from "@randajan/oauth2-client";
extendURL("https://example.com", { foo: 1, bar: 2 });
// â†’ "https://example.com/?foo=1&bar=2"
```

A tiny helper that appends query parameters while keeping the rest of the URL intact.

---

## License

MIT Â©Â [randajan](https://github.com/randajan)

