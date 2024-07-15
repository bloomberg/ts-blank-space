/**
 * @param {string} input string containing TypeScript
 * @param {typeof onError} [onErrorArg] callback when unsupported syntax is encountered
 * @returns {string} containing JavaScript
 */
export default function tsBlankSpace(input: string, onErrorArg?: typeof onError): string;
/**
 * @param {ts.SourceFile} source containing TypeScript's AST
 * @param {typeof onError} [onErrorArg] callback when unsupported syntax is encountered
 * @returns {string} containing JavaScript
 */
export function blankSourceFile(source: ts.SourceFile, onErrorArg?: typeof onError): string;
/** @type {undefined | ((n: ts.Node) => void)} */
declare let onError: undefined | ((n: ts.Node) => void);
import ts from "typescript";
export {};
