
import { info, log } from "@randajan/simple-lib/web";
import "./styles.css";

const beUrl = `http://localhost:${info.ports.server}`;

(async ()=>{
    const resp = await fetch(`${beUrl}/oauth`);
    if (!resp.ok) { console.log("FETCH ERROR"); }
    const list = await resp.json();

    const root = document.getElementById("root");

    for (const { key, initUri } of list) {
        const el = document.createElement("a");
        el.innerText = `Log me via ${key[0].toUpperCase()}${key.slice(1)}`;
        el.href = `${initUri}?state=foo&userId=jan.randa%40itcan.cz`;
        root.appendChild(el);
    }

})();
