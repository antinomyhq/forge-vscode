import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import security from "eslint-plugin-security";
import noSecrets from "eslint-plugin-no-secrets";

export default [
    {
        files: ["**/*.ts"],
    },
    {
        files: ["**/*.test.ts"],
        rules: {
            "max-lines-per-function": "off",
        },
    },
    {
        files: ["**/*.ts"],
        plugins: {
            "@typescript-eslint": typescriptEslint,
            security,
            "no-secrets": noSecrets,
        },

        languageOptions: {
            parser: tsParser,
            ecmaVersion: 2022,
            sourceType: "module",
            parserOptions: {
                project: "./tsconfig.json",
                tsconfigRootDir: process.cwd(),
            },
        },

        rules: {
            // TypeScript recommended rules
            ...typescriptEslint.configs.recommended.rules,

            // Code complexity and size
            complexity: ["error", { max: 15 }],
            "max-lines-per-function": ["error", { max: 80, skipBlankLines: true, skipComments: true }],

            // Type safety
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/explicit-function-return-type": "warn",
            "@typescript-eslint/no-unused-vars": "error",

            // Naming conventions
            "@typescript-eslint/naming-convention": ["warn", {
                selector: "import",
                format: ["camelCase", "PascalCase"],
            }],

            // Code quality
            curly: "warn",
            eqeqeq: "warn",
            "no-throw-literal": "warn",
            semi: "warn",
            "prefer-const": "error",
            "no-var": "error",

            // Security rules
            "security/detect-child-process": "warn",
            "security/detect-non-literal-require": "error",
            "no-secrets/no-secrets": "error",
        },
    },
];