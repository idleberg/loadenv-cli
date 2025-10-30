import { Command } from 'commander';
import { logger } from './log.ts';
import { getVersion } from './utils.ts';

export async function handleCli() {
	const program = new Command('loadenv');

	program
		.version(await getVersion())
		.configureOutput({
			writeOut: (message: string) => logger.log(message),
			writeErr: (message: string) => logger.error(message),
		})
		.arguments('<command> [args...]')
		.optionsGroup('loadEnv API')
		.requiredOption('-m, --mode <string>', 'a Vite mode to determine .env file', process.env.MODE)
		.option('-e, --envdir <string>', 'directory to load .env from', process.cwd())
		.option('-p, --prefix <string...>', 'filter environment variables by prefix', '')
		.optionsGroup('Advanced Options')
		.option('-D, --debug', 'print additional debug output')
		.option('-R, --dry-run', 'skip executing the spawned process')

		// This is required to pass on unknown options to the spawned process.
		.allowUnknownOption(true);

	program.parse();

	const [command, ...commandArgs] = program.args;
	const options = program.opts();

	return {
		command,
		commandArgs,
		options,
	};
}
