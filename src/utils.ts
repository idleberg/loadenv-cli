import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { OptionValues } from 'commander';
import { loadEnv } from 'vite';
import { logger } from './log.ts';

export async function getVersion(): Promise<string> {
	const manifestPath = resolve(import.meta.dirname, '../package.json');
	const fileContents = await readFile(manifestPath, 'utf8');
	const { version } = JSON.parse(fileContents);

	return version ?? 'development';
}

export function spawnProcess(command: string, args: string[] = [], options: OptionValues = {}) {
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
