import slib, { argv } from "@randajan/simple-lib";

const { isServer, isBuild } = argv;

const ports = {
    server:3999,
    client:3000
}

slib(
    isBuild,
    {
        port: isServer ? ports.server : ports.client,
        rebuildBuffer:isServer ? 1000 : 100,
        mode:isServer ? "node" : "web",
        demo:{
            dir: isServer ? "demo/be" : "demo/fe",
            info:{ ports },
            loader:{
                ".json":"text"
            }
        },
        lib:{
            entries:[
                "index.js",
                "google/index.js",
                "facebook/index.js",
                "seznam/index.js",
                "magic/index.js"
            ]
        },
    }
);
