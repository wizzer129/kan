import baseConfig from "../../tooling/eslint/base.js";

/** @type {import('typescript-eslint').Config} */
export default [
	{
		ignores: [".mintlify/**"],
	},
	...baseConfig,
];
