import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import security from "eslint-plugin-security";
import noSecrets from "eslint-plugin-no-secrets";

export default [
    {
        files: ["**/*.ts"],
    },
    {
        plugins: {
            "@typescript-eslint": typescriptEslint,
            security: security,
            "no-secrets": noSecrets,
        },

        languageOptions: {
            parser: tsParser,
            ecmaVersion: 2022,
            sourceType: "module",
            parserOptions: {
                project: "./tsconfig.json",
            },
        },

        rules: {
            // SECURITY RULES
            "security/detect-object-injection": "warn",
            "security/detect-non-literal-regexp": "warn",
            "security/detect-unsafe-regex": "error",
            "security/detect-buffer-noassert": "error",
            "security/detect-child-process": "warn",
            "security/detect-disable-mustache-escape": "error",
            "security/detect-eval-with-expression": "error",
            "security/detect-no-csrf-before-method-override": "error",
            "security/detect-non-literal-fs-filename": "warn",
            "security/detect-non-literal-require": "warn",
            "security/detect-possible-timing-attacks": "warn",
            "security/detect-pseudoRandomBytes": "error",
            "no-secrets/no-secrets": ["error", { tolerance: 4.5 }],

            // TYPESCRIPT TYPE SAFETY RULES
            "@typescript-eslint/explicit-function-return-type": ["warn", {
                allowExpressions: true,
                allowTypedFunctionExpressions: true,
                allowHigherOrderFunctions: true,
            }],
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": ["warn", {
                argsIgnorePattern: "^_",
                varsIgnorePattern: "^_",
            }],
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/no-misused-promises": "error",
            "@typescript-eslint/await-thenable": "error",
            "@typescript-eslint/no-unnecessary-type-assertion": "warn",
            "@typescript-eslint/prefer-nullish-coalescing": "warn",
            // Disabled: conflicts with strict-boolean-expressions
            // "@typescript-eslint/prefer-optional-chain": "warn",
            "@typescript-eslint/strict-boolean-expressions": ["warn", {
                allowString: true,
                allowNumber: true,
                allowNullableObject: true,
            }],

            // CODE QUALITY RULES
            "@typescript-eslint/naming-convention": ["warn", {
                selector: "import",
                format: ["camelCase", "PascalCase"],
            }],
            curly: "warn",
            eqeqeq: "warn",
            "no-throw-literal": "warn",
            semi: "warn",
            "no-console": ["warn", { allow: ["warn", "error"] }],
            "prefer-const": "warn",
            "no-var": "error",

            // CODE COMPLEXITY RULES
            complexity: ["warn", 15],
            "max-lines-per-function": ["warn", {
                max: 80,
                skipBlankLines: true,
                skipComments: true,
            }],
            "max-depth": ["warn", 4],
            "max-nested-callbacks": ["warn", 3],
        },
    },

    // TEST FILES - Relaxed complexity rules
    {
        files: ["**/*.test.ts", "**/*.spec.ts", "**/test/**/*.ts"],
        rules: {
            "max-lines-per-function": "off",
            complexity: "off",
            "@typescript-eslint/no-explicit-any": "off",
        },
    },
];
