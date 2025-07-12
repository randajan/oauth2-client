import { URL } from "url";

export const sliceMap = (arr, size, callback) => {
    size = Math.max(1, size) || 1;
    const r = [];
    if (!Array.isArray(arr)) { return r; }
    for (let k = 0; k < arr.length; k += size) {
        r.push(callback(arr.slice(k, k + size), r.length, size, arr.length));
    }
    return r;
}

export const extendURL = (url, query={})=>{
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

export const validateURL = (required, url, errProp)=>{
    if (!url && !required) { return; }
    if (isValidURL(url)) { return url; }
    throw new Error(`${errProp} is not a valid URL`);
}

export const validateFn = (required, fn, errProp)=>{
    if (!fn && !required) { return; }
    if (typeof fn === "function") { return fn; }
    throw new Error(`${errProp} is not a valid function`);
}


export const strToBase64 = str=>Buffer.from(str, 'utf8').toString('base64');
export const strFromBase64 = strEncoded=>Buffer.from(strEncoded, 'base64').toString('utf8');

export const objToBase64 = obj=>strToBase64(JSON.stringify(obj));
export const objFromBase64 = objEncoded=>JSON.parse(strFromBase64(objEncoded));