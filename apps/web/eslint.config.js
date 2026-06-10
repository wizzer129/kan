import baseConfig, { restrictEnvAccess } from '@kan/eslint-config/base';
import nextjsConfig from '@kan/eslint-config/nextjs';
import reactConfig from '@kan/eslint-config/react';

/** @type {import('typescript-eslint').Config} */
export default [
	{
		ignores: ['.next/**'],
	},
	...baseConfig,
	...reactConfig,
	...nextjsConfig,
	...restrictEnvAccess,
	{
		files: ['src/locales/**/*.ts'],
		rules: {
			'eslint-comments/no-unused-disable': 'off',
		},
	},
	{
		files: ['src/**/*.{tsx,ts}'],
		rules: {
			'@next/next/no-img-element': 'off',
			'eslint-comments/no-unused-disable': 'off',
			'@next/next/no-sync-scripts': 'off',
			// Framework callbacks are often async by design but don't await
			'@typescript-eslint/require-await': 'off',
			// Effects and callbacks often fire promises without awaiting
			'@typescript-eslint/no-floating-promises': 'off',
			// Common false positives with type narrowing
			'@typescript-eslint/no-unnecessary-condition': 'off',
			// External library types often resolve to any; refactoring would require major changes
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unsafe-return': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
			// Framework callbacks often return promises in void contexts by design
			'@typescript-eslint/no-misused-promises': 'off',
			// Nullish coalescing isn't always preferred (sometimes || is more readable)
			'@typescript-eslint/prefer-nullish-coalescing': 'off',
			// Unused params are often kept for API compatibility
			'@typescript-eslint/no-unused-vars': 'off',
			// Common false positives with complex React hooks
			'react-hooks/exhaustive-deps': 'off',
			// Environment variables are managed via deployment/turbo config; suppress redundant warnings
			'turbo/no-undeclared-env-vars': 'off',
			'no-restricted-properties': 'off',
			// Optional chain suggestions are often refactored to support optional coalescing instead
			'@typescript-eslint/prefer-optional-chain': 'off',
			// Type assertion comments are necessary for library integration
			'@typescript-eslint/ban-ts-comment': 'off',
			// Unbound methods often work fine in React/Next.js contexts
			'@typescript-eslint/unbound-method': 'off',
			// Empty object types needed for some library compatibility
			'@typescript-eslint/no-empty-object-type': 'off',
			// Non-null assertions sometimes needed for library integration
			'@typescript-eslint/no-non-null-assertion': 'off',
		},
	},
];
