# loadenv-cli

> Use Vite's `loadEnv` on the command-line.

[![License](https://img.shields.io/github/license/idleberg/loadenv-cli?color=blue&style=for-the-badge)](https://github.com/idleberg/loadenv-cli/blob/main/LICENSE)
[![Version: npm](https://img.shields.io/npm/v/loadenv-cli?style=for-the-badge)](https://www.npmjs.org/package/loadenv-cli)
[![Version: jsr](https://img.shields.io/jsr/v/@idleberg/loadenv-cli?style=for-the-badge)](https://jsr.io/@idleberg/loadenv-cli)
![GitHub branch check runs](https://img.shields.io/github/check-runs/idleberg/loadenv-cli/main?style=for-the-badge)

Utilizing Vite's [`loadEnv`](https://vite.dev/guide/api-javascript.html#loadenv) function, this CLI tool loads `.env` files and spawns a child process with access to the exposed environment variables. This is useful when you want to adopt Vite's mode handling with other tools.

**Features**

- loads `.env` matching the specified mode
- filters prefixed environment variables, e.g. `VITE_`
- expands environment variables

## Installation 💿

```shell
# npm
npm install loadenv-cli

# JSR
deno add jsr:@idleberg/loadenv-cli
```

## Usage 🚀

> [!NOTE]
> 
> Before you read on, make sure you have a basic understanding of Vite's concept of [Environment Variables and Modes](https://vite.dev/guide/env-and-mode.html).

### Node.js

**Examples**

```sh
# Use production .env with Playwright
npx loadenv --mode production -- playwright test

# Only pass prefixed environment variables
npx loadenv --mode production --prefix VITE_ -- playwright test
```

See `loadenv --help` for all available options.

### Bun

All of the Node.js examples are valid as long as you substitute `npx` with `bunx`.

### Deno

For ease of use, it's recommended to create tasks in your `deno.json` file:

> [!WARNING]
> 
> The following example is simplified for brevity. You likely want to define fine-grained permissions according to your needs.

**Example**

```json
{
	"tasks": {
		"test": "deno run -A jsr:@idleberg/loadenv-cli --mode production -- npm:playwright test"
	}
}
```

## Related 👫

If this project is not for you, maybe these alternatives suit you better:

- [dotenv-cli](https://www.npmjs.com/package/dotenv-cli)

## License ©️

This work is licensed under [The MIT License](LICENSE).
