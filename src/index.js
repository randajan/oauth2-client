import { Client } from "./class/Client";

export * from "./errors";
export * from "./tools";
export * from "./crypto";
export * from "./class/Client";

export const createClient = (grantProviders=[], optionsFactory=(grantKey, grantName)=>({})) => new Client(grantProviders, optionsFactory);
