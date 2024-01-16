# Contribution

Before making or requesting any changes, please make sure to read the contribution recommendations. Thank you for taking the time to do so.

## Requirements

To continue with the development, it's necessary to install [NodeJS 18.18.2](https://nodejs.org) along with [pnpm 8.10.4](https://pnpm.io) as the package manager. With NodeJS 18 we're following [Zapier requirements](https://github.com/zapier/zapier-platform/blob/zapier-platform-schema%4015.5.0/packages/cli/README.md#requirements).

If you intend to run tests, you'll also need to install [Zapier CLI 15.5.0](https://github.com/zapier/zapier-platform/blob/zapier-platform-schema%4015.5.0/packages/cli/README.md) and request a DocSpace test environment from @LinneyS (available only for company employees) or register for a [production environment](https://www.onlyoffice.com/docspace-registration.aspx).

If you plan to upload the new version of the application, you'll also require Zapier CLI.

## Dependencies Installation

To start developing, you need to install the necessary dependencies. Do it with pnpm.

```sh
$ pnpm install
```

If you haven't installed Zapier CLI yet, you can do it now with pnpm. It'll automatically select the appropriate version of the CLI for the current application version and install it globally using pnpm.

```sh
$ pnpm install-zapier
```

We also suggest installing Git hooks. Just like the Zapier CLI, you can do this using pnpm.

```sh
$ pnpm install-lefthook
```

Once you've everything installed, you can run any script from [`package.json`](./package.json).

```sh
$ cat ./package.json | jq .scripts
{
  "all": "node ./makefile.js all",
  "build": "node ./makefile.js build",
  "check": "tsc",
  "install-lefthook": "node ./makefile.js install-lefthook",
  "install-zapier": "node ./makefile.js install-zapier",
  "lint": "eslint .",
  "promote": "node ./makefile.js promote",
  "release": "node ./makefile.js release",
  "setup-env": "node ./makefile.js setup-env",
  "test": "uvu app ^.*\\.test\\.js$",
  "tt": "node ./makefile.js tt",
  "upload": "node ./makefile.js upload"
}
```

However, you may notice that many of them're just aliases for ["Makefile"](./makefile.js). By opening this file, you can learn more about their commands.

```sh
$ ./makefile.js --help 

  Usage
    $ ./makefile.js <command> [options]

  Available Commands
    all                 Run an audit of the app and then build it
    build               Build the app
    install-lefthook    Install Lefthook locally using pnpm
    install-zapier      Install Zapier CLI globally using pnpm
    promote             Promote the current version of the app
    release             Release the current version of the app
    setup-env           Setup environment dot file
    tt                  Run validation with tests
    upload              Upload the current version of the app

  For more info, run any command with the `--help` flag
    $ ./makefile.js all --help
    $ ./makefile.js build --help

  Options
    -v, --version    Displays current version
    -h, --help       Displays this message

```

Depending on your plans, you may need to configure environment variables. Use the interactive `setup-env` command to do this.

```sh
$ pnpm setup-env
The base URL of DocSpace for testing purposes (DOC_SPACE_BASE_URL): ***
The username of DocSpace user for testing purposes (DOC_SPACE_USERNAME): ***
The password of DocSpace user for testing purposes (DOC_SPACE_PASSWORD): ***
The deploy key from developer.zapier.com for testing purposes (ZAPIER_DEPLOY_KEY): ***
```

## Project Structure

Instead of the project structure [recommended by the Zapier team](https://github.com/zapier/zapier-platform/blob/zapier-platform-schema%4015.5.0/packages/cli/README.md#local-project-structure), we use a different one that we find more convenient.

```sh
$ tree . --dirsfirst
.
├── app
│   ├── docspase
│   └── zapier
├── vendor
└── index.js
```

The entry point of the application is [`index.js`](./index.js).

The [`app`](./app) directory contains two modules: the [`docspace`](./app/docspase) module and the [`zapier`](./app/zapier) module. The `docspace` module is a wrapper for the DocSpace REST API, while the `zapier` module may contain [triggers, searches, creates, and other resources](https://github.com/zapier/zapier-platform/blob/zapier-platform-schema%4015.5.0/packages/cli/README.md#triggerssearchescreates) for building applications on the Zapier platform.

To provide sample data, we follow the naming pattern `module.samples.js`. In addition, there is a `module.test.js` file that contains test cases for the module, and a `module.fixture.js` file that contains shared resources for different test files, such as authentication hooks.

The [`vendor`](./vendor) directory is intended to store, for example, the [`zapier-platform-core`](./vendor/zapier-platform-core.d.ts) type definitions. In short, it's for anything that isn't related to us.

## Testing

The Zapier CLI reserves the `test` command in [`package.json`](./package.json). That's why we've the `tt` command, which allows us to run tests and load environment variables at the same time.

```sh
$ pnpm tt
```

Speaking of environment variables, if you haven't set them yet, now is the perfect time to do so using the `setup-env` command. These variables're required in order to run tests.

```sh
$ pnpm setup-env
```

## Deployment

Deploying this application doesn't differ in complexity. But there're a couple of points that're worth highlighting.

```text
┌─────────┐   ┌─────────┐   ┌───────────┐
│  Audit  ├─>─┤  Stage  ├─>─┤  Release  │
└─────────┘   └─────────┘   └───────────┘
```

First of all, it's recommended to run the [`audit`](./.github/workflows/audit.yml) action in order to validate and test the application.

```sh
$ gh workflow run audit.yml --ref develop
```

If everything is okay, we'll be able to [`stage`](./.github/workflows/stage.yml) the current version of the application. It'll build and upload the application to Zapier servers in private mode, allowing you to start manual testing, for example. If it's discovered that the current version of the application has already been uploaded and made public, an error will be thrown.

```sh
$ gh workflow run stage.yml --ref develop
```

Once we're prepared and have merged the `develop` with the `main` branch, an automatic [`release`](./.github/workflows/release.yml) action will be triggered. This action will rebuild the application, upload it to Zapier servers, and made it public. Similar to a `stage` action, if it's found that the current version of the application has already been uploaded and made public, an error will be thrown.

```sh
$ gh workflow run release.yml
```

## Resources

- [Zapier CLI Documentation](https://github.com/zapier/zapier-platform/blob/main/packages/cli/README.md)
- [Zapier Schemas Documentation](https://github.com/zapier/zapier-platform/blob/zapier-platform-schema%4015.5.0/packages/schema/docs/build/schema.md)
- [Best practices for working with AWS Lambda](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
