import * as Module from "node:module";
import { createRequire } from "node:module";

if (typeof Module.registerHooks === "function") {
    const require = createRequire(import.meta.url);
    const { resolveSync, loadSync } = require("./hooks.js");

    Module.registerHooks({ resolve: resolveSync, load: loadSync });
} else {
    // Fallback to worker thread for older Node.js
    Module.register("./hooks.js", import.meta.url);
}
