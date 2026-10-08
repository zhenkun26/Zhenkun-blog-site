import rehypeKatex, {type Options} from "./probes/rehype-katex-new/lib/index.js";
import {mathHtml, type HtmlOptions} from "./probes/micromark-math-new/index.js";
const options: Options = {trust: context => context.command === "\\href", strict: "warn", maxExpand: 1000, macros: {"\\RR": "\\mathbb{R}"}};
rehypeKatex(options);
const htmlOptions: HtmlOptions = {...options, throwOnError: false};
mathHtml(htmlOptions);
// @ts-expect-error renderer options do not support an injected katex instance
const invalid: Options = {katex: {}};
void invalid;
