// Test fixture for 'loader.test.ts'
import { hello } from "./hello2.js"; // .js extension should resolve to ".ts"

const world: string = "world"; // some TypeScript syntax

console.log(`${hello} ${world}`);
