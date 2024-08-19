import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./hooks.js", pathToFileURL(import.meta.filename));
