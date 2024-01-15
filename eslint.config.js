const eslint = require("@eslint/js")
const globals = require("globals")
const jsdoc = require("eslint-plugin-jsdoc")
const pluginImport = require("eslint-plugin-import")
const pluginRequireSort = require("eslint-plugin-require-sort")
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
      "@stylistic": stylistic,
      import: pluginImport,
      jsdoc,
      "require-sort": pluginRequireSort
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
      "@stylistic/brace-style": [
        "warn",
        "1tbs"
      ],
      "@stylistic/comma-dangle": [
        "warn",
        "never"
      ],
      "@stylistic/comma-spacing": [
        "warn",
        {
          "after": true, "before": false
        }
      ],
      "@stylistic/comma-style": [
        "warn",
        "last"
      ],
      "@stylistic/eol-last": [
        "warn",
        "always"
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
          "ArrayExpression": "first",
          "CallExpression": {
            "arguments": "first"
          },
          "FunctionDeclaration": {
            "parameters": "first"
          },
          "FunctionExpression": {
            "parameters": "first"
          },
          "ImportDeclaration": "first",
          "ObjectExpression": "first",
          "VariableDeclarator": "first",
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
      "@stylistic/no-multiple-empty-lines": [
        "warn",
        { "max": 1 }
      ],
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
        { "anonymous": "always", "asyncArrow": "always", "named": "never" }
      ],
      "@stylistic/space-in-parens": [
        "warn",
        "never"
      ],
      "@stylistic/space-infix-ops": ["warn"],
      "arrow-parens": "warn",
      "curly": "warn",
      "eqeqeq": [
        "warn",
        "always"
      ],
      "import/exports-last": "warn",
      "import/first": "warn",
      "import/newline-after-import": "warn",
      "import/order": [
        "warn",
        {
          "groups": [
            "builtin",
            "external",
            [
              "parent",
              "sibling",
              "index"
            ]
          ]
        }
      ],
      "jsdoc/check-alignment": "warn",
      "jsdoc/check-line-alignment": "warn",
      "jsdoc/multiline-blocks": "warn",
      "jsdoc/require-returns": "warn",
      "no-plusplus": "warn",
      "no-unused-vars": [
        "warn",
        {
          "vars": "local"
        }
      ],
      "prefer-const": "warn",
      "require-sort/require-sort": [
        "warn",
        {
          "ignoreCase": true,
          "ignoreDeclarationSort": true
        }
      ],
      "sort-keys": "warn"
    }
  }
]
