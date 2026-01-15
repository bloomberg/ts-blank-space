// Test fixture for 'loader.test.ts'
import { hello } from "./hello2.mjs"; // .mjs extension should resolve to ".mts"

const world: string = "world"; // some TypeScript syntax

console.log(`${hello} ${world}`);
