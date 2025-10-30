#!/usr/bin/env node

import process from 'node:process';
import { handleCli } from './cli.ts';
import { logger } from './log.ts';
import { spawnProcess } from './utils.ts';

const { command, commandArgs, options } = await handleCli();

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

spawnProcess(command as string, commandArgs, options);
