import tsBlankSpace from "ts-blank-space";
import * as monaco from "monaco-editor/esm/vs/editor/editor.main.js";

self.MonacoEnvironment = {
    getWorkerUrl: function (_moduleId, label) {
        if (label === "typescript" || label === "javascript") {
            return "./vs/language/typescript/ts.worker.js";
        }
        return "./vs/editor/editor.worker.js";
    },
};

// expose for devTools console usage
globalThis.tsBlankSpace = tsBlankSpace;

function loadFromURL() {
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
        return defaultStr;
    }
    try {
        let b64 = urlData.slice(1);
        b64 += Array(((4 - (b64.length % 4)) % 4) + 1).join("=");
        b64 = b64.replace(/\-/g, "+").replace(/\_/g, "/");
        return JSON.parse(atob(b64)).text;
    } catch (_e) {
        console.error(_e);
        return defaultStr;
    }
}

function saveToUrl(text) {
    try {
        let encoded = `${btoa(JSON.stringify({ text }))}`;
        encoded = encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        window.history.replaceState(null, "", "#" + encoded);
    } catch (err) {
        console.error(err);
    }
}

const tsModel = monaco.editor.createModel(loadFromURL(), "typescript");
const jsModel = monaco.editor.createModel(tsBlankSpace(tsModel.getValue()), "javascript");

tsModel.onDidChangeContent(() => {
    const text = tsModel.getValue();
    saveToUrl(text);
    jsModel.setValue(tsBlankSpace(text));
});

const containers = {
    ts: document.getElementById("container-ts")!,
    js: document.getElementById("container-js")!,
    diff: document.getElementById("container-diff")!,
};

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
});

const jsViewer = monaco.editor.create(containers.js, {
    model: jsModel,
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
    lineNumbers: "off",
    renderWhitespace: "all",
    renderLineHighlight: "none",
    contextmenu: false,
});

tsEditor.onDidScrollChange((e) => {
    jsViewer.setScrollTop(e.scrollTop);
});

let diffEditor;
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
