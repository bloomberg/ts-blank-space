// @ts-check
const esbuild = require('esbuild');
const path = require('node:path');
const fs = require('node:fs');

const workerEntryPoints = [
	'vs/language/typescript/ts.worker.js',
	'vs/editor/editor.worker.js'
];

const dist = path.join(__dirname, "dist");
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist);

fs.copyFileSync(
	path.join(__dirname, "index.html"),
	path.join(dist, "index.html")
);

build({
	entryPoints: workerEntryPoints.map((entry) => `./node_modules/monaco-editor/esm/${entry}`),
	bundle: true,
	format: 'iife',
	outbase: './node_modules/monaco-editor/esm/',
	outdir: path.join(__dirname, 'dist'),
	minify: true,
});

build({
	entryPoints: ['index.js'],
	bundle: true,
	format: 'iife',
	outdir: path.join(__dirname, 'dist'),
	loader: {
		'.ttf': 'file'
	},
	minify: true,
});

/**
 * @param {import ('esbuild').BuildOptions} opts
 */
function build(opts) {
	esbuild.build(opts).then((result) => {
		if (result.errors.length > 0) {
			console.error(result.errors);
		}
		if (result.warnings.length > 0) {
			console.error(result.warnings);
		}
	});
}
