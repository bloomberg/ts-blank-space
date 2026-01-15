import { test } from "node:test";
import assert from "node:assert";
import { fork } from "node:child_process";
import { join, resolve } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { text } from "node:stream/consumers";

async function runFixture(fixtureFile: string): Promise<string> {
    const packageRoot = join(import.meta.dirname, "..", "package.json");
    const packageJson = JSON.parse(readFileSync(packageRoot, "utf-8"));
    const loaderPath = resolve(packageRoot, "..", packageJson.exports["./register"]);

    assert(existsSync(loaderPath), "exported loader should exist");

    const fixturePath = join(import.meta.dirname, "fixture", fixtureFile);
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
    return result.trim();
}

test("exports correctly working loader hooks", async (t) => {
    const result = await runFixture("hello.ts");
    assert.equal(result, "hello world");
});

test("loads .mts files with the loader", async (t) => {
    const result = await runFixture("hello.mts");
    assert.equal(result, "hello world");
});
