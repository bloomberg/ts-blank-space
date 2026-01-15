// Copyright 2024 Bloomberg Finance L.P.
// Distributed under the terms of the Apache 2.0 license.
import tsBlankSpace from "../out/index.js";

const TS_EXTENSIONS = [".ts", ".mts"];
const FALLBACK_EXTENSIONS = [
    [".js", ".ts"],
    [".mjs", ".mts"],
];

export async function resolve(specifier, context, nextResolve) {
    try {
        return await nextResolve(specifier, context);
    } catch (err) {
        const url = err?.url;
        if (typeof url === "string") {
            for (const [fromExtension, toExtension] of FALLBACK_EXTENSIONS) {
                if (url.endsWith(fromExtension)) {
                    return nextResolve(url.slice(0, -fromExtension.length) + toExtension, context);
                }
            }
        }
        throw err;
    }
}

export async function load(url, context, nextLoad) {
    if (!TS_EXTENSIONS.some((extension) => url.endsWith(extension))) {
        return nextLoad(url, context);
    }

    const format = "module";
    const result = await nextLoad(url, { ...context, format });
    const transformedSource = tsBlankSpace(result.source.toString());

    return {
        format,
        shortCircuit: true,
        source: transformedSource + "\n//# sourceURL=" + url,
    };
}
