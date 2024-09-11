import { test } from "node:test";
import assert from "node:assert";
import { fork } from "node:child_process";
import { join, resolve } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { text } from "node:stream/consumers";

test("exports correctly working loader hooks", async (t) => {
    const packageRoot = join(import.meta.dirname, "..", "package.json");
    const packageJson = JSON.parse(readFileSync(packageRoot, "utf-8"));
    const loaderPath = resolve(packageRoot, "..", packageJson.exports["./register"]);

    assert(existsSync(loaderPath), "exported loader should exist");

    const fixturePath = join(import.meta.dirname, "fixture", "hello.ts");
    assert(existsSync(fixturePath), "fixture should exist");

    const child = fork(fixturePath, /* args: */ [], {
        execArgv: ["--import", loaderPath],
        cwd: import.meta.dirname,
        stdio: "pipe",
    });

    const result = await new Promise<Error | string>((resolve) => {
        child.on("exit", (code) => {
            if (code) {
                resolve(new Error(`code: ${code}`));
            }
            resolve(text(child.stdout!));
        });
    });

    assert(typeof result === "string", `result: ${result}`);
    assert.equal(result.trim(), "hello world");
});
