
const _scopePrefix = "https://www.googleapis.com/auth/";
const effaceScope = (scope, full=false)=>{
    scope = String(scope).replace(/[\s\n\r]+/g, " ").trim().toLowerCase();
    if (scope === "openid") { return scope; }
    const sw = scope.startsWith(_scopePrefix);
    return sw === full ? scope : full ? _scopePrefix+scope : scope.substring(_scopePrefix.length);
}

export const effaceScopes = (scopes, full=false, ensureScopes=[])=>{
    if (typeof scopes === "string") { scopes = scopes.split(" "); }
    if (!Array.isArray(scopes)) { scopes = ensureScopes; }
    else { scopes = scopes.concat(ensureScopes); }

    const r = new Set();
    for (let scope of scopes) {
        if (scope) { scope = effaceScope(scope, full); }
        if (scope) { r.add(scope); }
    }
    return [...r];
}