import { Client } from "./class/Client";

export * from "./tools";
export * from "./class/Client";

export const createClient = (grantProviders=[], optionsFactory=(grantKey, grantName)=>({})) => new Client(grantProviders, optionsFactory);
