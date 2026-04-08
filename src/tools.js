
export const sliceMap = (arr, size, callback) => {
    size = Math.max(1, size) || 1;
    const r = [];
    if (!Array.isArray(arr)) { return r; }
    for (let k = 0; k < arr.length; k += size) {
        r.push(callback(arr.slice(k, k + size), r.length, size, arr.length));
    }
    return r;
}

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
    if (!url && !required) { return; }
    if (isValidURL(url)) { return url; }
    throw new Error(`${errProp} is not a valid URL`);
}

export const validateFn = (required, fn, errProp) => {
    if (!fn && !required) { return; }
    if (typeof fn === "function") { return fn; }
    throw new Error(`${errProp} is not a valid function`);
}

export const validateStr = (required, str, errProp) => {
    if (!str && !required) { return; }
    if (typeof str === "string") { return str; }
    throw new Error(`${errProp} is not a valid string`);
}


export const formatCredentials = (credentials={}) => {
    const c = {...credentials};

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

export const objToBase64 = obj => strToBase64(JSON.stringify(obj));
export const objFromBase64 = objEncoded => JSON.parse(strFromBase64(objEncoded));
