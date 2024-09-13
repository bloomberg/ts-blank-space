export async function parseTypeScriptAST(input, count) {
    const ts = (await import("typescript")).default;

    for (let i = 0; i < count; i++) {
        ts.createSourceFile("input.ts", input, ts.ScriptTarget.ESNext, /* setParentNodes: */ false, ts.ScriptKind.TS);
    }
}
