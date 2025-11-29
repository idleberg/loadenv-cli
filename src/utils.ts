import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import process from 'node:process';
import type { OptionValues } from 'commander';
import { loadEnv } from 'vite';
import { logger } from './log.ts';

/**
 * Loads version from package manifest.
 * @internal
 */
export async function getVersion(): Promise<string> {
	const module = 'Deno' in globalThis ? await loadJsrManifest() : await loadNpmManifest();

	return module.default.version ?? 'development';
}

/**
 * Spawns a process with environment variables loaded by `loadEnv`.
 * @internal
 */
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

function loadJsrManifest() {
	return import('../jsr.json', {
		with: { type: 'json' },
	});
}

function loadNpmManifest() {
	return import('../package.json', {
		with: { type: 'json' },
	});
}
