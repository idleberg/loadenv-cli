#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { program } from 'commander';
import { loadEnv } from 'vite';
import { logger } from './log.ts';
import { getVersion } from './utils.ts';

program
	.version(await getVersion())
	.configureOutput({
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

if (process.env.MODE === options.mode) {
	logger.info('Mode has been derived from environment.');
}

if (options.debug) {
	logger.debug('CLI', {
		command,
		args: commandArgs,
		options,
	});
}

spawnProcess(command as string, commandArgs);

function spawnProcess(command: string, args: string[] = []) {
	const resolvedEnvDir = resolve(options.envdir);
	const env = loadEnv(options.mode, resolvedEnvDir, options.prefix);

	if (options.debug) {
		logger.debug('Environment', env);
	}

	if (options.dryRun) {
		const fullCommand = args.length ? `${command} ${args.join(' ')}` : command;
		logger.info(`Dry run, not executing "${fullCommand}"`);
		return;
	}

	const child = spawn(command, args, { stdio: 'inherit', env });

	child.on('exit', (exitCode, signal: NodeJS.Signals) => {
		if (typeof exitCode === 'number') {
			if (options.debug) {
				logger.debug('Exit code', exitCode);
			}

			process.exit(exitCode);
		}

		logger.info(`Process terminated with ${signal}`);
		process.kill(process.pid, signal);
	});

	child.on('error', (error) => logger.error(error.message));

	for (const signal of [
		'SIGINT',
		'SIGTERM',
		'SIGPIPE',
		'SIGHUP',
		'SIGBREAK',
		'SIGWINCH',
		'SIGUSR1',
		'SIGUSR2',
	] as NodeJS.Signals[]) {
		process.on(signal, () => {
			child.kill(signal);
		});
	}
}
