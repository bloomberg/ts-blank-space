import * as tsBlankSpace from "ts-blank-space";
import * as monaco from "monaco-editor";
import { createGhostDecoration, createErrorMarker, parseTS, selectBooleanWrapper } from "./play-utils";

const containers = {
    ts: document.getElementById("container-ts")!,
    js: document.getElementById("container-js")!,
    diff: document.getElementById("container-diff")!,
};

self.MonacoEnvironment = {
    getWorkerUrl: function (_moduleId, label) {
        if (label === "typescript" || label === "javascript") {
            return "../vs/language/typescript/ts.worker.js";
        }
        return "../vs/editor/editor.worker.js";
    },
};

// expose for devTools console usage
globalThis.tsBlankSpace = tsBlankSpace;

interface URLData {
    readonly text: string;
    readonly tsx: boolean;
}

function loadFromURL(): URLData {
    const defaultStr = `
interface HasField {
    field: string;
}

export class C<T> extends Array<T> implements HasField {
    public field!: string;

    method<T>(this: HasField, a?: string): void {
       this.field = a as string;
    }
}
`;
    const urlData = location.hash;
    if (!urlData) {
        return {
            text: defaultStr,
            tsx: false,
        };
    }
    try {
        let b64 = urlData.slice(1);
        b64 += Array(((4 - (b64.length % 4)) % 4) + 1).join("=");
        b64 = b64.replace(/\-/g, "+").replace(/\_/g, "/");
        return JSON.parse(atob(b64));
    } catch (_e) {
        console.error(_e);
        return {
            text: defaultStr,
            tsx: false,
        };
    }
}

let savedURL = false;
function saveURL() {
    const text = tsModel.getValue();
    const tsx = tsxConfig.enabled;
    try {
        let encoded = `${btoa(JSON.stringify({ tsx, text } satisfies URLData))}`;
        encoded = encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        window.history.replaceState(null, "", "#" + encoded);
    } catch (err) {
        console.error(err);
    }
}

const tsxConfig = selectBooleanWrapper("lang-select", "tsx", "ts");
const ghostCheckBox = document.getElementById("ghost-check") as HTMLInputElement;

function updateCompilerOptions() {
    const mts = monaco.languages.typescript;
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: mts.ScriptTarget.ESNext,
        jsx: tsxConfig.enabled ? mts.JsxEmit.Preserve : mts.JsxEmit.None,
    });
}

const tsModel = (() => {
    const start = loadFromURL();
    tsxConfig.enabled = !!start.tsx;
    updateCompilerOptions();

    const model = monaco.editor.createModel(start.text, "typescript");
    model.detectIndentation(true, 4);
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        onlyVisible: true,
        noSemanticValidation: true,
        noSyntaxValidation: false,
        noSuggestionDiagnostics: true,
    });

    return model;
})();

const jsModel = monaco.editor.createModel("", "javascript");
const jsViewer = createJsViewer(jsModel);
const jsDecorations = jsViewer.createDecorationsCollection();

function updateGhostDecorations() {
    const text = tsModel.getValue();
    if (ghostCheckBox.checked) {
        const decorations = text.split("\n").flatMap((l, i) => {
            return createGhostDecoration(i + 1, l);
        });
        jsDecorations.set(decorations);
    } else {
        jsDecorations.clear();
    }
}

function updateModel() {
    const text = tsModel.getValue();
    const tsxEnabled = tsxConfig.enabled;
    try {
        const markers: monaco.editor.IMarkerData[] = [];
        const ast = parseTS(text, tsxEnabled);
        const output = tsBlankSpace.blankSourceFile(ast, (errorNode) => {
            markers.push(createErrorMarker(ast, errorNode));
        });

        monaco.editor.setModelMarkers(tsModel, "ts-blank-space", markers);
        jsModel.setValue(output);

        updateGhostDecorations();
    } catch (err) {
        console.error(err);
        jsModel.setValue("Error");
    }
}

updateModel();
tsModel.onDidChangeContent((e) => {
    updateModel();
});
tsxConfig.onchange = function () {
    updateCompilerOptions();
    if (savedURL) {
        saveURL();
    }
    updateModel();
};
ghostCheckBox.onchange = updateGhostDecorations;
document.body.addEventListener(
    "blur",
    (e) => {
        if (e.relatedTarget === null && savedURL) {
            if (savedURL) {
                saveURL();
            }
        }
    },
    { capture: true },
);
document.getElementById("save-button")!.onclick = saveURL;

const tsEditor = monaco.editor.create(containers.ts, {
    model: tsModel,
    language: "typescript",
    codeLens: false,
    hover: {
        enabled: true,
    },
    minimap: {
        enabled: false,
    },
    renderLineHighlight: "none",
    contextmenu: false,
    wordWrap: "off",
    scrollbar: {
        handleMouseWheel: false,
    },
});

function createJsViewer(model: monaco.editor.ITextModel) {
    return monaco.editor.create(containers.js, {
        model,
        language: "javascript",
        readOnly: true,
        scrollbar: {
            handleMouseWheel: false,
        },
        codeLens: false,
        hover: {
            enabled: false,
        },
        minimap: {
            enabled: false,
        },
        lineNumbers: "on",
        renderWhitespace: "none",
        detectIndentation: false,
        wordWrap: "off",
        renderLineHighlight: "none",
        contextmenu: false,
        guides: {
            indentation: false,
        },
    });
}

tsEditor.onDidScrollChange((e) => {
    jsViewer.setScrollTop(e.scrollTop);
});

let diffEditor: monaco.editor.IDiffEditor;
function initDiffEditor() {
    if (diffEditor) {
        return diffEditor;
    }
    diffEditor = monaco.editor.createDiffEditor(containers.diff, {
        codeLens: false,
        hover: {
            enabled: false,
        },
        minimap: {
            enabled: false,
        },
        renderLineHighlight: "none",
        contextmenu: false,
        renderSideBySide: true,
        useInlineViewWhenSpaceIsLimited: false,
        readOnly: true,
        originalEditable: true,
        diffAlgorithm: "legacy",
        renderWhitespace: "all",
    });

    diffEditor.setModel({
        original: tsModel,
        modified: jsModel,
    });

    return diffEditor;
}

const diffCheck = document.getElementById("diff-check") as HTMLInputElement;
diffCheck.onchange = function () {
    if (diffCheck.checked) {
        containers.ts.style.display = "none";
        containers.js.style.display = "none";
        containers.diff.style.display = "";
        initDiffEditor().layout();
    } else {
        containers.ts.style.display = "";
        containers.js.style.display = "";
        containers.diff.style.display = "none";
    }
};
containers.diff.style.display = "none";

const mo = new ResizeObserver(() => {
    tsEditor.layout();
    jsViewer.layout();
});
mo.observe(containers.ts);
mo.observe(containers.js);

const darkMode = window.matchMedia("(prefers-color-scheme: dark)");
function themeUpdate() {
    if (darkMode.matches) {
        monaco.editor.setTheme("vs-dark");
    } else {
        monaco.editor.setTheme("vs-light");
    }
}
darkMode.addEventListener("change", themeUpdate);
themeUpdate();
