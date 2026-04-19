import { createHmac, timingSafeEqual } from "crypto";
import { validateStr } from "./tools";


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
