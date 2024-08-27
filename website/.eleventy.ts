import { EleventyHtmlBasePlugin } from "@11ty/eleventy";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import esbuildPlay from "./scripts/_esbuild.ts";

export default function (eleventyConfig) {
    eleventyConfig.addPassthroughCopy("./node_modules/prism-themes/themes/prism-vs.min.css");
    eleventyConfig.addPassthroughCopy("./node_modules/prism-themes/themes/prism-vsc-dark-plus.min.css");
    eleventyConfig.addPassthroughCopy("./assets");
    eleventyConfig.addPlugin(EleventyHtmlBasePlugin);
    eleventyConfig.addPlugin(esbuildPlay);
    eleventyConfig.addPlugin(syntaxHighlight);

    return {
        dir: {
            input: ".",
            output: "_site",
        },
    };
}
