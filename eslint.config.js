import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

export default ts.config(
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		},
		rules: {
			'no-undef': 'off',
			// ESLint 10 recommended adds no-useless-assignment; keep prior behavior until refactored.
			'no-useless-assignment': 'off',
			// Svelte 5 $props() patterns trigger false-positive state_referenced_locally warnings.
			'svelte/valid-compile': 'off',
			// New in eslint-plugin-svelte v3 recommended — off until SvelteKit resolve() migration.
			'svelte/no-navigation-without-resolve': 'off',
			'svelte/require-each-key': 'off',
			'svelte/prefer-writable-derived': 'off',
			'svelte/prefer-svelte-reactivity': 'off',
			'svelte/no-useless-mustaches': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser,
				projectService: true,
				extraFileExtensions: ['.svelte'],
				svelteConfig
			}
		}
	},
	{
		ignores: [
			'build/',
			'.svelte-kit/',
			'drizzle/',
			'node_modules/',
			'node_modules.*/',
			'scripts/'
		]
	}
);
