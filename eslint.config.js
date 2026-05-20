import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import importX from 'eslint-plugin-import-x';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  { ignores: ['legacy/**', 'build/**', 'src/shared/api/schema.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    plugins: { 'react-hooks': reactHooks, 'import-x': importX },
    settings: {
      // Tell import-x which file extensions to traverse when building the
      // dependency graph for rules like no-cycle. Without this, only .js/
      // .mjs/.cjs are traversed and TypeScript files are silently skipped.
      'import-x/extensions': ['.ts', '.tsx', '.js', '.jsx'],
      // The tsconfig option is required so the underlying unrs-resolver reads
      // compilerOptions.paths from tsconfig.json and resolves the '@/*' alias
      // to './src/*'. Without it, createNodeResolver only does bare Node
      // resolution and silently fails to find any '@/'-prefixed import, making
      // import-x/no-cycle inert for all inter-module imports in this project.
      'import-x/resolver-next': [
        importX.createNodeResolver({
          extensions: ['.ts', '.tsx', '.js', '.jsx'],
          tsconfig: { configFile: path.join(__dirname, 'tsconfig.json') },
        }),
      ],
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/exhaustive-deps': 'error',
      'import-x/no-cycle': 'error',
      // React Compiler is not used in this project (Vite + SWC); this advisory rule is noise.
      'react-hooks/incompatible-library': 'off',
    },
  },
  prettierRecommended,
);
