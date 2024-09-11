import lastKnownGoodTsBlankSpace from "ts-blank-space-lkg";
import * as fs from "node:fs";
import { join } from "node:path";

const src = join(import.meta.dirname, "..", "src");
const out = join(import.meta.dirname, "..", "out");
fs.mkdirSync(out, { recursive: true });

/**
 * @param {string} filename
 */
function compile(filename) {
    const input = fs.readFileSync(join(src, filename), "utf-8");
    fs.writeFileSync(join(out, filename.replace(/\.ts$/, ".js")), lastKnownGoodTsBlankSpace(input));
}

for (const file of fs.readdirSync(src, "utf-8")) {
    if (file.endsWith(".ts")) {
        compile(file);
    }
}
