


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