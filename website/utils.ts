import * as ts from "typescript";
import * as monaco from "monaco-editor";

export function parseTS(text: string, tsxEnabled: boolean) {
    return ts.createSourceFile(
        "input.ts",
        text,
        {
            languageVersion: ts.ScriptTarget.ESNext,
        },
        /* setParentNodes:*/ true,
        tsxEnabled ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
}

export function createErrorMarker(ast: ts.SourceFile, errorNode: ts.Node): monaco.editor.IMarkerData {
    const start = ast.getLineAndCharacterOfPosition(errorNode.getStart(ast, false));
    const end = ast.getLineAndCharacterOfPosition(errorNode.getEnd());

    return {
        message: "[ts-blank-space] Unsupported syntax",
        startLineNumber: start.line + 1,
        startColumn: start.character + 1,
        endLineNumber: end.line + 1,
        endColumn: end.character + 1,
        severity: monaco.MarkerSeverity.Error,
    };
}

export function createGhostDecoration(line: number, text: string): monaco.editor.IModelDeltaDecoration[] {
    const retVal: ReturnType<typeof createGhostDecoration> = [];
    // Monaco breaks up the decorator into separate spans if they get too long.
    // So split the decoration up into chunks.
    const chunkSize = 10;
    for (let i = 0; i < text.length; i += chunkSize) {
        const chunk = text.slice(i, i + chunkSize);
        retVal.push({
            range: new monaco.Range(line, i + 1, line, i + 1 + chunk.length),
            options: {
                isWholeLine: false,
                shouldFillLineOnLineBreak: false,
                before: {
                    content: chunk,
                    inlineClassName: "tsbs-ghost",
                    inlineClassNameAffectsLetterSpacing: true,
                },
            },
        });
    }
    return retVal;
}

export function selectBooleanWrapper(id: string, enabled: string, disabled: string) {
    const elm = document.getElementById(id) as HTMLSelectElement;

    return {
        get enabled() {
            return elm.value === enabled;
        },
        set enabled(c: boolean) {
            elm.value = c ? enabled : disabled;
        },
        set onchange(cb: typeof elm.onchange) {
            elm.onchange = cb;
        },
    };
}
