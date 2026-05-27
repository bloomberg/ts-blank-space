// Copyright 2024 Bloomberg Finance L.P.
// Distributed under the terms of the Apache 2.0 license.
import tsBlankSpace from "../out/index.js";

const TS_EXTENSIONS = [".ts", ".mts"];
const FALLBACK_EXTENSIONS = [
    [".js", ".ts"],
    [".mjs", ".mts"],
];

function fallbackSpecifier(err) {
    const url = err?.url;
    if (typeof url !== "string") return null;
    for (const [fromExtension, toExtension] of FALLBACK_EXTENSIONS) {
        if (url.endsWith(fromExtension)) {
            return url.slice(0, -fromExtension.length) + toExtension;
        }
    }
    return null;
}

function transformLoadResult(sourceText, url) {
    return {
        format: "module",
        shortCircuit: true,
        source: tsBlankSpace(sourceText) + "\n//# sourceURL=" + url,
    };
}

export async function resolve(specifier, context, nextResolve) {
    try {
        return await nextResolve(specifier, context);
    } catch (err) {
        const fallback = fallbackSpecifier(err);
        if (fallback !== null) {
            return nextResolve(fallback, context);
        }
        throw err;
    }
}

export async function load(url, context, nextLoad) {
    if (!TS_EXTENSIONS.some((extension) => url.endsWith(extension))) {
        return nextLoad(url, context);
    }

    const result = await nextLoad(url, { ...context, format: "module" });
    return transformLoadResult(result.source.toString(), url);
}

export function resolveSync(specifier, context, nextResolve) {
    try {
        return nextResolve(specifier, context);
    } catch (err) {
        const fallback = fallbackSpecifier(err);
        if (fallback !== null) {
            return nextResolve(fallback, context);
        }
        throw err;
    }
}

export function loadSync(url, context, nextLoad) {
    if (!TS_EXTENSIONS.some((extension) => url.endsWith(extension))) {
        return nextLoad(url, context);
    }

    const result = nextLoad(url, { ...context, format: "module" });
    return transformLoadResult(result.source.toString(), url);
}
