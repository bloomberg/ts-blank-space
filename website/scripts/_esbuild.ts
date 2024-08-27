import esbuild from "esbuild";
import * as path from "node:path";

const workerEntryPoints = ["./vs/language/typescript/ts.worker.js", "./vs/editor/editor.worker.js"];
const root = path.join(import.meta.dirname, "..");
const play = path.join(root, "play");

export default function esbuildPlayground(eleventyConfig: any) {
    let thirdPartBuilt = false;
    eleventyConfig.addWatchTarget(play);
    eleventyConfig.on("eleventy.before", async (config) => {
        if (!thirdPartBuilt) {
            thirdPartBuilt = true;
            await build({
                entryPoints: workerEntryPoints.map((entry) =>
                    path.resolve(root, `./node_modules/monaco-editor/esm/`, entry),
                ),
                bundle: true,
                format: "iife",
                outbase: path.resolve(root, "./node_modules/monaco-editor/esm/"),
                outdir: config.directories.output,
                minify: true,
            });
        }
        await build({
            entryPoints: [path.join(play, "play.ts")],
            bundle: true,
            format: "iife",
            outdir: path.join(config.directories.output, "play"),
            loader: {
                ".ttf": "file",
            },
            minify: true,
        });
    });
}

/**
 * @param {import ('esbuild').BuildOptions} opts
 */
function build(opts) {
    return esbuild.build(opts).then((result) => {
        if (result.errors.length > 0) {
            console.error(result.errors);
        }
        if (result.warnings.length > 0) {
            console.error(result.warnings);
        }
    });
}
