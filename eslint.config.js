const eslint = require("@eslint/js")
const globals = require("globals")
const stylistic = require("@stylistic/eslint-plugin-js")

module.exports = [
  eslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es6,
        ...globals.commonjs
      },
      parserOptions: {
        sourceType: "commonjs"
      }

    },
    plugins: {
      "@stylistic": stylistic
    },
    rules: {
      "@stylistic/array-bracket-newline": [
        "warn",
        "consistent"
      ],
      "@stylistic/array-bracket-spacing": [
        "warn",
        "never"
      ],
      "@stylistic/array-element-newline": [
        "warn",
        "always"
      ],
      "@stylistic/arrow-spacing": "warn",
      "@stylistic/block-spacing": "warn",
      "@stylistic/brace-style": "warn",
      "@stylistic/comma-dangle": [
        "warn",
        "never"
      ],
      "@stylistic/comma-spacing": [
        "warn",
        {
          "before": false, "after": true
        }
      ],
      "@stylistic/comma-style": [
        "warn",
        "last"
      ],
      "@stylistic/function-call-argument-newline": [
        "warn",
        "consistent"
      ],
      "@stylistic/function-call-spacing": [
        "warn",
        "never"
      ],
      "@stylistic/function-paren-newline": [
        "warn",
        "multiline"
      ],
      "@stylistic/implicit-arrow-linebreak": [
        "warn",
        "beside"
      ],
      "@stylistic/indent": [
        "warn",
        2,
        {
          "VariableDeclarator": "first",
          "FunctionDeclaration": {
            "parameters": "first"
          },
          "FunctionExpression": {
            "parameters": "first"
          },
          "CallExpression": {
            "arguments": "first"
          },
          "ArrayExpression": "first",
          "ObjectExpression": "first",
          "ImportDeclaration": "first",
          "flatTernaryExpressions": true
        }
      ],
      "@stylistic/key-spacing": [
        "warn",
        {
          "beforeColon": false, "mode": "strict"
        }
      ],
      "@stylistic/keyword-spacing": [
        "warn",
        {
          "before": true
        }
      ],
      "@stylistic/lines-between-class-members": [
        "warn",
        "always"
      ],
      "@stylistic/max-len": [
        "warn",
        {
          "code": 120, "ignoreComments": true, "ignoreUrls": true
        }
      ],
      "@stylistic/multiline-ternary": [
        "warn",
        "never"
      ],
      "@stylistic/new-parens": "warn",
      "@stylistic/no-extra-semi": "warn",
      "@stylistic/no-mixed-spaces-and-tabs": "warn",
      "@stylistic/no-multi-spaces": "warn",
      "@stylistic/no-multiple-empty-lines": "warn",
      "@stylistic/no-tabs": "warn",
      "@stylistic/no-trailing-spaces": "warn",
      "@stylistic/no-whitespace-before-property": "warn",
      "@stylistic/nonblock-statement-body-position": [
        "warn",
        "beside"
      ],
      "@stylistic/object-curly-newline": [
        "warn",
        {
          "consistent": true
        }
      ],
      "@stylistic/object-curly-spacing": [
        "warn",
        "always"
      ],
      "@stylistic/object-property-newline": [
        "warn",
        {
          "allowAllPropertiesOnSameLine": true
        }
      ],
      "@stylistic/padded-blocks": [
        "warn",
        "never"
      ],
      "@stylistic/quotes": [
        "warn",
        "double"
      ],
      "@stylistic/semi": [
        "warn",
        "never"
      ],
      "@stylistic/semi-spacing": "warn",
      "@stylistic/space-before-blocks": "warn",
      "@stylistic/space-before-function-paren": [
        "warn",
        { "anonymous": "always", "named": "never", "asyncArrow": "always" }
      ],
      "@stylistic/space-in-parens": [
        "warn",
        "never"
      ],
      "no-unused-vars": [
        "warn",
        {
          "vars": "local"
        }
      ],
      "@stylistic/eol-last": [
        "warn",
        "always"
      ],
      "eqeqeq": [
        "warn",
        "always"
      ],
      "prefer-const": "warn"
    }
  }
]
