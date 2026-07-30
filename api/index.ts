import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const serverBundle = require("./_server.cjs");

const app = serverBundle.default ?? serverBundle;

export default app;