# loadenv-cli

> Use Vite's `loadEnv` on the command-line.

[![License](https://img.shields.io/github/license/idleberg/loadenv-cli?color=blue&style=for-the-badge)](https://github.com/idleberg/loadenv-cli/blob/main/LICENSE)
[![Version: npm](https://img.shields.io/npm/v/loadenv-cli?style=for-the-badge)](https://www.npmjs.org/package/loadenv-cli)
![GitHub branch check runs](https://img.shields.io/github/check-runs/idleberg/loadenv-cli/main?style=for-the-badge)

Utilizing Vite's [`loadEnv`](https://vite.dev/guide/api-javascript.html#loadenv) function, this CLI tool loads `.env` files and spawns a child-process with those environment variables. This is useful when you want to adopt Vite's mode handling with other tools.

**Features**

- loads `.env` relevant to mode
- filters prefixed environment variables, e.g. `VITE_`
- expands environment variables
- optionally isolates host environment

## Installation 💿

```shell
npm install loadenv-cli
```

## Usage 🚀

> [!NOTE]
> Before you read on, make sure you have a basic understanding of Vite's concept of [Environment Variables and Modes](https://vite.dev/guide/env-and-mode.html).

**Example**

```sh
# Use production .env with Playwright
npx loadenv --mode production playwright test

# Only pass prefixed environment variables
npx loadenv --mode production --prefix VITE_ playwright test

# Pass arguments to Playwright
npx loadenv --mode production --prefix VITE_ playwright test -- --ui
```

See `loadenv --help` for all available options.

## Related 👫

- [dotenv-cli](https://www.npmjs.com/package/dotenv-cli) - Brother from another mother

## License ©️

This work is licensed under [The MIT License](LICENSE).
