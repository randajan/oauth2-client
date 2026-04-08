import slib, { argv } from "@randajan/simple-lib";

const { isServer, isBuild } = argv;

slib(
    isBuild,
    {
        rebuildBuffer:isServer ? 1000 : 100,
        mode:isServer ? "node" : "web",
        demo:{
            dir: isServer ? "demo/be" : "demo/fe",
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
