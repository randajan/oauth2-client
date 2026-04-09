
import { info, log } from "@randajan/simple-lib/web";
import "./styles.css";

const beUrl = `http://localhost:${info.ports.server}`;

(async ()=>{
    const resp = await fetch(`${beUrl}/oauth`);
    if (!resp.ok) { console.log("FETCH ERROR"); }
    const list = await resp.json();

    const root = document.getElementById("root");

    for (const grantKey of list) {
        const el = document.createElement("a");
        el.innerText = `Log me via ${grantKey[0].toUpperCase()}${grantKey.slice(1)}`;
        el.href = `${beUrl}/oauth/${grantKey}/init?state=foo&userId=jan.randa%40itcan.cz`;
        root.appendChild(el);
    }

})();
