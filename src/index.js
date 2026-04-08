import { Client } from "./class/Client";

export * from "./tools";
export * from "./class/Client";

export const createClient = (options={}) => new Client(options);
