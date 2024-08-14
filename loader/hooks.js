// Copyright 2024 Bloomberg Finance L.P.
// Distributed under the terms of the Apache 2.0 license.
import tsBlankSpace from "../out/index.js";

export async function load(url, context, nextLoad) {
    if (!url.endsWith(".ts")) {
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
