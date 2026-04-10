
import { createHmac, timingSafeEqual } from "crypto";

export const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);


export const extendURL = (url, query = {}) => {
    const u = new URL(url);
    for (let i in query) {
        if (query[i] != null) { u.searchParams.append(i, query[i]); }
    }
    return u.toString();
}


export const isValidURL = str => {
    try { new URL(str); } catch (e) { return false; }
    return true;
}

export const validateURL = (required, url, errProp) => {
    if (url == null && !required) { return; }
    if (isValidURL(url)) { return url; }
    throw new Error(`${errProp} is not a valid URL`);
}

export const wrapValidatorURL = (validator)=>{
    return (u, ...a)=>isValidURL(u) && (true === validator(u, ...a));
}


const assertDeny = (list, obj, errProp) => {
    if (!Array.isArray(list) || !list.length) { return obj; }
    const denied = list.filter(item=>hasOwn(obj, item));
    if (!denied.length) { return obj; }
    throw new Error(`${errProp} contains denied keys: [${denied.join(",")}]`);
}

const assertAllow = (list, obj, errProp) => {
    if (!Array.isArray(list) || !list.length) { return obj; }
    const denied = new Set(Object.keys(obj));
    for (const item of list) { denied.delete(item); }
    if (!denied.size) { return obj; }
    throw new Error(`${errProp} contains denied keys: [${[...denied].join(",")}]`);
}

export const validateArr = (required, arr, errProp)=>{
    if (arr == null && !required) { return; }
    if (Array.isArray(arr) && arr.length > 0) { return arr; }
    throw new Error(`${errProp} is not a valid array`);
}

export const validateObj = (required, obj, errProp) => {
    if (obj == null && !required) { return; }
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
        throw new Error(`${errProp} must be an object`);
    }
    return obj;
}

export const blacklistObj = (blacklist, required, obj, errProp)=>{
    return assertDeny(blacklist, validateObj(required, obj, errProp), errProp);
}

export const whitelistObj = (whitelist, required, obj, errProp)=>{
    return assertAllow(whitelist, validateObj(required, obj, errProp), errProp);
}

export const validateFn = (required, fn, errProp) => {
    if (fn == null && !required) { return; }
    if (typeof fn === "function") { return fn; }
    throw new Error(`${errProp} is not a valid function`);
}

export const validateStr = (required, str, errProp) => {
    const isStr = typeof str === "string";
    if (isStr) { str = str.trim(); }

    if ((str == null || str === "") && !required) { return; }
    if (isStr && str) { return str; }

    throw new Error(`${errProp} is not a valid string`);
}

export const validateTtl = (required, ttl, errProp) => {
    if ((ttl == null || ttl === 0) && !required) { return; }
    if (typeof ttl === "number" && Number.isFinite(ttl) && ttl > 0) { return Math.floor(ttl); }
    throw new Error(`${errProp} must be a positive number`);
}

export const formatCredentials = (credentials={}) => {
    const c = {...validateObj(true, credentials, "credentials")};

    if (c.expires_in && !c.expiry_date) {
        c.expiry_date = Date.now() + c.expires_in * 1000;
    }

    if (c.refresh_token && !c.expiry_date) {
        throw new Error(`OAuth2 credentials 'refresh_token' must be provided with 'expiry_date'`);
    }

    if (!c.access_token && !c.refresh_token) {
        throw new Error(`OAuth2 credentials 'access_token' of 'refresh_token' must be provided`);
    }

    return c;
}


export const strToBase64 = str => Buffer.from(str, 'utf8').toString('base64');
export const strFromBase64 = strEncoded => Buffer.from(strEncoded, 'base64').toString('utf8');

export const base64ToBase64Url = str => String(str || "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

export const base64UrlToBase64 = str => {
    const b64 = String(str || "").replace(/-/g, "+").replace(/_/g, "/");
    const padding = (4 - (b64.length % 4)) % 4;
    return `${b64}${"=".repeat(padding)}`;
}

export const strToBase64Url = str => base64ToBase64Url(strToBase64(str));
export const strFromBase64Url = strEncoded => strFromBase64(base64UrlToBase64(strEncoded));

export const signBase64Url = (payloadEncoded, secret) => {
    const digest = createHmac("sha256", validateStr(true, secret, "secret"))
        .update(validateStr(true, payloadEncoded, "payloadEncoded"))
        .digest();

    return base64ToBase64Url(digest.toString("base64"));
}

export const objToSignedBase64Url = (obj, secret) => {
    const payloadEncoded = strToBase64Url(JSON.stringify(obj));
    const signature = signBase64Url(payloadEncoded, secret);
    return `${payloadEncoded}.${signature}`;
}

export const objFromSignedBase64Url = (token, secret) => {
    if (!token || typeof token !== "string") {
        throw new Error("Invalid signed payload format");
    }

    const parts = token.split(".");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
        throw new Error("Invalid signed payload format");
    }

    const [ payloadEncoded, signature ] = parts;
    const signatureExpected = signBase64Url(payloadEncoded, secret);

    const given = Buffer.from(signature, "utf8");
    const expected = Buffer.from(signatureExpected, "utf8");

    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
        throw new Error("Invalid signed payload signature");
    }

    try {
        return JSON.parse(strFromBase64Url(payloadEncoded));
    } catch (err) {
        throw new Error("Invalid signed payload");
    }
}
