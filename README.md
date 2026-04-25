# @randajan/oauth2-client

[![NPM](https://img.shields.io/npm/v/@randajan/oauth2-client.svg)](https://www.npmjs.com/package/@randajan/oauth2-client)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

Lightweight framework-agnostic Node.js library for redirect-based OAuth 2.0 flows across multiple providers, including Google, Facebook, Seznam and email magic-link authentication.

The runtime model is intentionally small:

- `Grant`: one configured provider instance
- `Client`: registry of configured grants
- `Account`: materialized view over credentials

Supported provider subpaths:

- `@randajan/oauth2-client/google`
- `@randajan/oauth2-client/facebook`
- `@randajan/oauth2-client/seznam`
- `@randajan/oauth2-client/magic`

## Installation

```bash
npm install @randajan/oauth2-client
```

## ESM and CommonJS

```js
// ESM
import { Client, createClient } from "@randajan/oauth2-client";
import createGoogleOAuth2 from "@randajan/oauth2-client/google";

// CommonJS
const { Client, createClient } = require("@randajan/oauth2-client");
const { default: createGoogleOAuth2 } = require("@randajan/oauth2-client/google");
```

## Quick Start

Single provider:

```js
import express from "express";
import createGoogleOAuth2 from "@randajan/oauth2-client/google";

const google = createGoogleOAuth2({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  initUri: "http://localhost:3999/oauth/google/init",
  exitUri: "http://localhost:3999/oauth/google/exit",
  failureUri: "http://localhost:3000/login/error",
  landingUri: "http://localhost:3000/login/ok",
  scopes: ["drive.file"],
  isOffline: true,
  onAuth: async (account, { options, landingUri, state }) => {
    const profile = await account.profile();
    console.log("authenticated", account.grant.key, profile, state, options.context);
    return landingUri;
  },
  onRenew: async (account) => {
    console.log("tokens renewed for", account.grant.key);
  },
  onError: (err, options) => {
    console.warn("oauth error", err.code, err.isKnown, err.message, options.context?.req?.ip);
  }
});

const app = express();

app.get("/oauth/google/init", async (req, res) => {
  const redirect = await google.getInitURL({
    landingUri: req.query.landingUri,
    state: { source: "login-form" }
  }, {
    context: { req, res }
  });

  res.redirect(redirect);
});

app.get("/oauth/google/exit", async (req, res) => {
  const redirect = await google.getExitURL(req.query, {
    context: { req, res }
  });

  res.redirect(redirect);
});

app.listen(3999);
```

Multiple providers:

```js
import express from "express";
import { Client } from "@randajan/oauth2-client";
import { GoogleGrant } from "@randajan/oauth2-client/google";
import { FacebookGrant } from "@randajan/oauth2-client/facebook";
import { MagicGrant } from "@randajan/oauth2-client/magic";

const oauth = new Client(
  [GoogleGrant, FacebookGrant, MagicGrant],
  (grantKey, grantName) => ({
    initUri: `http://localhost:3999/oauth/${grantKey}/init`,
    exitUri: `http://localhost:3999/oauth/${grantKey}/exit`,
    failureUri: `http://localhost:3000/${grantKey}/error`,
    landingUri: `http://localhost:3000/${grantKey}/ok`,
    pendingUri: `http://localhost:3000/${grantKey}/pending`,
    onAuth: async (account, meta) => {
      console.log("auth", grantKey, grantName, await account.profile(), meta.state);
    },
    onRenew: async (account) => {
      console.log("renew", grantKey, await account.tokens());
    },
    onError: (err) => {
      console.warn("oauth error", grantKey, err.code, err.message);
    },
    onMagic: async (confirmUrl, { userId }) => {
      console.log(`magic link for ${grantKey}/${userId}: ${confirmUrl}`);
    }
  })
);

oauth.add("google", {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  scopes: ["drive.file"]
});

oauth.add("facebook", {
  clientId: process.env.FACEBOOK_CLIENT_ID,
  clientSecret: process.env.FACEBOOK_CLIENT_SECRET
});

oauth.add("magic", {
  clientSecret: process.env.MAGIC_SECRET
});

const app = express();

oauth.setupRoutes((grant) => {
  app.get(grant.initPath, async (req, res) => {
    const redirect = await grant.getInitURL(req.query, {
      context: { req, res }
    });
    res.redirect(redirect);
  });

  app.get(grant.exitPath, async (req, res) => {
    const redirect = await grant.getExitURL(req.query, {
      context: { req, res }
    });
    res.redirect(redirect);
  });
});
```

## Public API

### Root exports

```js
import { Client, createClient, extendURL } from "@randajan/oauth2-client";
```

Root package exports:

- `Client`
- `createClient(grantProviders, optionsFactory)`
- all utilities from `src/tools.js`

### Provider subpaths

Each provider subpath exports:

- default factory returning a configured grant instance
- named `*Grant`
- named `*Account`

Example:

```js
import createGoogleOAuth2, { GoogleGrant, GoogleAccount } from "@randajan/oauth2-client/google";
```

## Grant API

Default provider factories return configured grant instances. The same grant instances are also stored inside `Client`.

Common grant methods:

- `grant.account(credentials)`
- `await grant.getInitURL(query, options)`
- `await grant.getExitURL(query, options)`

Common grant properties:

- `grant.name`: provider name
- `grant.key`: configured instance key, defaults to provider name
- `grant.client`: owning `Client` or `undefined`
- `grant.initUri`
- `grant.exitUri`
- `grant.initPath`
- `grant.exitPath`

### Grant options

All grants share the same base options. Scoped grants also accept `scopes`.

| Option | Type | Required | Description |
| --- | --- | --- | --- |
| `key` | `string` | no | Instance key. Defaults to provider name. |
| `clientId` | `string` | provider-specific | Required by Google, Facebook and Seznam. Not required by Magic. |
| `clientSecret` | `string` | yes | OAuth client secret or signing secret. Also used to sign `state`. |
| `initUri` | `string (absolute URL)` | yes | Backend entry endpoint for init flow. |
| `exitUri` | `string (absolute URL)` | yes | Backend exit endpoint that receives provider `code` and signed `state`. |
| `failureUri` | `string (absolute URL)` | yes | Front-end failure URL. The library appends `errorCode` and `errorMessage`. |
| `landingUri` | `string (absolute URL)` | conditional | Default success URL. Required unless you provide `landingUriValidator`. |
| `landingUriValidator` | `(landingUri, defaultLandingUri) => boolean` | conditional | Synchronous landing URI guard. Required when `landingUri` is not configured. It must return strict `true` to allow the URL. |
| `isOffline` | `boolean` | no | Requests offline access where the provider supports it. |
| `formatProfile` | `(profile) => any` | no | Final profile mapper used by `account.profile()`. |
| `onAuth` | `(account, { options, landingUri, state }) => string \| void \| Promise<string \| void>` | yes | Called after successful code exchange. Return a custom redirect URL or nothing to use `landingUri`. |
| `onRenew` | `(account) => void \| Promise<void>` | yes | Called when provider credentials are refreshed. |
| `onError` | `(err, options) => any` | no | Optional error hook called with wrapped `Error` (`err.cause` keeps the original error, `err.code` is redirect code, `err.isKnown` marks `RedirectError`). Errors thrown by this hook are swallowed. |
| `extra` | `object` | no | Provider-specific constructor extras. For example Google passes them into `google.auth.OAuth2(...)`. |
| `scopes` | `string \| string[]` | scoped grants only | Default extra scopes for Google, Facebook and Seznam. |

### `getInitURL(query, options)`

Public init `query`:

| Option | Type | Description |
| --- | --- | --- |
| `landingUri` | `string (absolute URL)` | Per-request landing URI. Must pass `landingUriValidator`. |
| `state` | any JSON-serializable value | Application state packed into signed `state` and returned back to `onAuth`. |
| `userId` | `string` | Required by Magic. |

Trusted init `options`:

| Option | Type | Description |
| --- | --- | --- |
| `context` | `any` | Arbitrary server-side metadata passed into hooks via `meta.options.context`. Typical value is `{ req, res }`. |
| `extra` | `object` | Provider-specific auth-request extras. This is intentionally server-side only. |
| `scopes` | `string \| string[]` | Extra scopes for scoped grants. This is intentionally server-side only. |
| `throwError` | `boolean` | If `true`, `getInitURL(...)` throws wrapped error instead of returning `failureUri`. |

This split is important:

- `query` is the public request payload and can be mapped from `req.query`
- `options` is trusted server-side input
- do not put user-controlled `scopes` or `extra` into `query`

### `getExitURL(query, options)`

Public exit `query`:

| Option | Type | Description |
| --- | --- | --- |
| `code` | `string` | Provider authorization code or Magic code. |
| `state` | `string` | Signed state returned by init flow. |

Trusted exit `options`:

| Option | Type | Description |
| --- | --- | --- |
| `context` | `any` | Arbitrary server-side metadata passed into hooks via `meta.options.context`. Typical value is `{ req, res }`. |
| `throwError` | `boolean` | If `true`, `getExitURL(...)` throws wrapped error instead of returning `failureUri`. |

Exit flow:

- validates signed `state`
- exchanges provider `code` for credentials
- materializes an account
- calls `onAuth(account, { options, landingUri, state })`
- returns either custom redirect URL from `onAuth` or resolved `landingUri`

### Error behavior

`grant.getInitURL(...)` and `grant.getExitURL(...)` return `failureUri` for normal redirect-flow errors, unless `options.throwError === true`.

Before redirect/throw, the original error is wrapped into a new `Error`:

- `err.message`: public message (`RedirectError.message` or `"Unknown error"`)
- `err.code`: three-digit redirect code
- `err.isKnown`: `true` when original error is `RedirectError`
- `err.cause`: original error object

When `throwError` is not enabled, returned `failureUri` has appended query parameters:

- `errorCode`
- `errorMessage`

If `onError` is configured, it is invoked with wrapped error before redirect/throw. The hook is best-effort only:

- sync errors inside `onError` are ignored
- async errors inside `onError` are ignored
- `onError` must not be used for flow control

Errors outside redirect flow can still throw normally. Example: `grant.account(credentials)`, `account.profile()`, `account.tokens()` or provider SDK calls you make yourself.

### Accessing `context`

`context` is not a separate argument. Put request metadata into `options.context`.

Example:

```js
const redirect = await grant.getInitURL(req.query, {
  context: { req, res }
});
```

Then inside hooks:

```js
onAuth: async (account, { options, landingUri, state }) => {
  const { req, res } = options.context || {};
  return landingUri;
},

onError: (err, options) => {
  const ip = options.context?.req?.ip;
  console.error(err.code, ip, err.message);
}
```

## Client API

`Client` is a registry of configured grants. It also provides a small routing sugar via `setupRoutes(callback)`, which simply iterates configured grants for you.

Constructor:

```js
const client = new Client(grantProviders, optionsFactory);
// or
const client = createClient(grantProviders, optionsFactory);
```

- `grantProviders`: non-empty array of grant classes such as `GoogleGrant`
- `optionsFactory(grantKey, grantName)`: shared configuration factory for every added grant

Methods:

- `client.add(grantName, options)`
- `client.has(grantKey)`
- `client.get(grantKey, throwError = false)`
- `client.account(grantKey, credentials)`
- `client.setupRoutes(callback)`

Properties:

- `client.grants`: read-only `Map` snapshot of configured grants

Notes:

- `grantName` must match the static provider name, for example `"google"` or `"magic"`
- `options.key` in `add(...)` is optional and defaults to `grantName`
- local `add(...)` options cannot override `client`, `onAuth`, `onRenew`, `onMagic` or `onError`
- shared hooks belong in `optionsFactory`
- `client.get(grantKey, true)` throws normal `Error` for unknown grant key

`client.setupRoutes(callback)` is equivalent to:

```js
client.grants.forEach(callback);
```

## Account API

Every `grant.account(credentials)` returns an account instance.

Common methods:

- `await account.profile(...)`
- `await account.tokens(...)`
- `await account.scopes(...)`

Common properties:

- `account.grant`
- `account.credentials`

`account.profile()` always runs through `grant.formatProfile(...)`.

### Google account

Additional Google members:

- `account.auth`: raw `google.auth.OAuth2` instance
- `account.oauth2()`: helper returning `google.oauth2({ auth, version: "v2" })`

## Landing URI policy and signed state

`state` is not plain base64. It is serialized and signed with HMAC SHA-256 using `clientSecret`.

That means:

- tampered `state` is rejected
- malformed or unsigned legacy `state` is rejected
- successful flow always ends on a validated landing URI

Landing URI rules:

- if `landingUri` is not configured, `landingUriValidator` is required
- if `landingUri` is configured and `landingUriValidator` is missing, a default validator is created automatically
- the default validator allows only exact match with configured `landingUri`
- if both `landingUri` and custom `landingUriValidator` are provided, the constructor verifies that configured `landingUri` is allowed
- `landingUriValidator` must be synchronous and must return strict `true`

Example whitelist:

```js
const google = createGoogleOAuth2({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  initUri: "http://localhost:3999/oauth/google/init",
  exitUri: "http://localhost:3999/oauth/google/exit",
  failureUri: "http://localhost:3000/login/error",
  landingUriValidator: (landingUri) => {
    return landingUri.startsWith("http://localhost:3000/");
  },
  onAuth: async (account, { landingUri }) => landingUri,
  onRenew: async () => {}
});
```

## Redirect error codes

Failure redirect URLs use three-digit codes:

- `1xx`: init flow
- `2xx`: exit flow
- `x0x`: common grant / OAuth flow error
- `x1x`: magic-link specific error
- `x20`: provider adapter HTTP/API error

Examples:

- `101`: init failed because `landingUri` was invalid
- `203`: exit failed because signed `state` could not be trusted
- `111`: magic init failed because `onMagic(...)` returned an invalid URL
- `219`: magic exit failed because the magic code was replayed

| Suffix | Full codes | Scope | Meaning |
| --- | --- | --- | --- |
| `00` | `100`, `200` | any grant | Unknown / unwrapped error. Usually thrown by provider SDK or application callback without `RedirectError`. |
| `01` | `101`, `201` | common grant | Invalid `landingUri`. |
| `02` | `202` | common grant | Signed `state` payload shape is invalid. |
| `03` | `203` | common grant | Signed `state` is untrusted: missing, unsigned, malformed or signature check failed. |
| `04` | `204` | common grant | Missing callback `code`. |
| `11` | `111` | magic | `onMagic(...)` returned an invalid URL. |
| `12` | `112` | magic | Missing `userId` for magic init flow. |
| `13` | `213` | magic | Missing magic token or access token input during exit flow. |
| `14` | `214` | magic | Invalid token format. |
| `15` | `215` | magic | Invalid token signature. |
| `16` | `216` | magic | Invalid token payload. |
| `17` | `217` | magic | Invalid token claims. |
| `18` | `218` | magic | Token expired. Message differs for magic code vs access token. |
| `19` | `219` | magic | Magic code was already used. |
| `20` | `220` | provider adapter | Provider HTTP/API request failed and the adapter returned provider response text. Currently used by Facebook and Seznam adapters. |

Notes:

- `100` / `200` are failure buckets for unexpected errors that were not wrapped into `RedirectError`
- Google provider SDK errors currently usually fall into `100` / `200`, because they are not remapped into provider-specific codes
- some `RedirectError` values can also appear outside redirect flow, for example from `MagicAccount.profile()`. In that case you will see raw suffix values such as `13` or `18`, not failure `2xx` redirect codes

## Provider notes

### Google

```js
import createGoogleOAuth2 from "@randajan/oauth2-client/google";
```

- scoped provider
- always requests the common identity scopes needed for profile access
- supports `isOffline`
- `account.tokens()` can trigger token refresh

### Facebook

```js
import createFacebookOAuth2 from "@randajan/oauth2-client/facebook";
```

- scoped provider
- `account.profile(fields)` supports custom field selection
- `account.scopes()` reads granted permissions from `/me/permissions`

### Seznam

```js
import createSeznamOAuth2 from "@randajan/oauth2-client/seznam";
```

- scoped provider
- always includes required `identity` scope
- supports `isOffline`

### Magic

```js
import createMagicOAuth2 from "@randajan/oauth2-client/magic";
```

Magic is not a third-party provider integration. It is an email-based flow built on the same `Grant` and `Account` model.

Magic-specific options:

| Option | Type | Required | Description |
| --- | --- | --- | --- |
| `pendingUri` | `string (absolute URL)` | no | Redirect used after init when `onMagic` returns nothing. Defaults to `landingUri`. |
| `magicTtlMs` | `number` | no | TTL for magic code and in-memory anti-replay window. Default `600000`. |
| `accessTokenTtlMs` | `number` | no | TTL for issued internal `access_token`. Default `86400000`. |
| `onMagic` | `(confirmUrl, meta) => string \| void \| Promise<string \| void>` | yes | Callback that receives the confirmation URL and decides what the browser should do next. |

Magic init flow:

1. call `magic.getInitURL({ userId, state, landingUri }, options)`
2. the grant creates a signed one-time `code`
3. `onMagic(confirmUrl, meta)` receives the confirmation URL
4. your application sends email or other out-of-band notification
5. `getInitURL(...)` returns:
   - the custom URL returned by `onMagic`, or
   - `pendingUri?userId=...` when `onMagic` returns nothing

`onMagic(confirmUrl, meta)` receives:

- `confirmUrl`
- `meta.ttl`
- `meta.pendingUri`
- `meta.userId`
- `meta.state`
- `meta.extra`

Magic example:

```js
import createMagicOAuth2 from "@randajan/oauth2-client/magic";

const magic = createMagicOAuth2({
  clientSecret: process.env.MAGIC_SECRET,
  initUri: "http://localhost:3999/oauth/magic/init",
  exitUri: "http://localhost:3999/oauth/magic/exit",
  failureUri: "http://localhost:3000/login/error",
  landingUri: "http://localhost:3000/login/ok",
  pendingUri: "http://localhost:3000/login/pending",
  onMagic: async (confirmUrl, { userId, ttl }) => {
    await sendMagicEmail(userId, confirmUrl, ttl);
    return "http://localhost:3000/login/pending?sent=1";
  },
  onAuth: async (account) => {
    console.log(await account.profile());
  },
  onRenew: async () => {}
});

const redirect = await magic.getInitURL({
  userId: "user-123",
  state: { source: "email-login" }
}, {
  context: { req, res }
});
```

Magic account behavior:

- `await account.profile()` returns `{ id }` by default
- `await account.tokens()` returns `{ access_token, expiry_date }`
- `await account.scopes()` returns `[]`

The magic `access_token` is an internal signed credential used by this library. It is not a third-party OAuth access token.

## Utilities

### `extendURL(url, query)`

```js
import { extendURL } from "@randajan/oauth2-client";

extendURL("https://example.com", { foo: 1, bar: 2 });
// "https://example.com/?foo=1&bar=2"
```

## License

MIT (c) [randajan](https://github.com/randajan)
