# loadenv-cli

> Use Vite's `loadEnv` on the command-line.

[![License](https://img.shields.io/github/license/idleberg/loadenv-cli?color=blue&style=for-the-badge)](https://github.com/idleberg/loadenv-cli/blob/main/LICENSE)
[![Version: npm](https://img.shields.io/npm/v/loadenv-cli?style=for-the-badge)](https://www.npmjs.org/package/loadenv-cli)
![GitHub branch check runs](https://img.shields.io/github/check-runs/idleberg/loadenv-cli/main?style=for-the-badge)

## Description

This package utilizes Vite's [`loadEnv`](https://vite.dev/guide/api-javascript.html#loadenv) function to load environment variables from a `.env` file and spawn a child-process using these environment variables.

## Installation

```shell
npm install loadenv-cli
```

## Usage

> [!TIP]
> It's recommended to first get familiar with Vite's concept of [Environment Variables and Modes](https://vite.dev/guide/env-and-mode.html).

**Example**

```sh
# Use production .env with Playwright
loadenv --mode production playwright test

# Only pass prefixed environment variables
loadenv --mode production --prefix VITE_ playwright test

# Pass arguments to Playwright
loadenv --mode production --prefix VITE_ playwright test -- --ui
```

See `loadenv --help` for all available options.

## Related

[dotenv-cli](https://www.npmjs.com/package/dotenv-cli)

## License

This work is licensed under [The MIT License](LICENSE).
