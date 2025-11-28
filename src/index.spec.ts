import process from 'node:process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock all dependencies before importing the module under test
vi.mock('./cli.ts', () => ({
	handleCli: vi.fn(),
}));

vi.mock('./log.ts', () => ({
	logger: {
		info: vi.fn(),
		debug: vi.fn(),
		warn: vi.fn(),
	},
}));

vi.mock('./utils.ts', () => ({
	spawnProcess: vi.fn(),
}));

describe('index', () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it('should call handleCli and spawnProcess with parsed arguments', async () => {
		const mockCommand = 'npm';
		const mockArgs = ['run', 'build'];
		const mockOptions = { mode: 'production', debug: false };

		const { handleCli } = await import('./cli.ts');
		const { spawnProcess } = await import('./utils.ts');
		const { logger } = await import('./log.ts');

		vi.mocked(handleCli).mockResolvedValue({
			command: mockCommand,
			commandArgs: mockArgs,
			options: mockOptions,
		});

		await import('./index.ts');

		expect(handleCli).toHaveBeenCalledOnce();
		expect(spawnProcess).toHaveBeenCalledOnce();
		expect(spawnProcess).toHaveBeenCalledWith(mockCommand, mockArgs, mockOptions);
		expect(logger.info).not.toHaveBeenCalled();
		expect(logger.warn).not.toHaveBeenCalled();
		expect(logger.debug).not.toHaveBeenCalled();
	});

	it('should log info when MODE is derived from environment', async () => {
		process.env.MODE = 'staging';

		const mockOptions = { mode: 'staging', debug: false };

		const { handleCli } = await import('./cli.ts');
		const { logger } = await import('./log.ts');

		vi.mocked(handleCli).mockResolvedValue({
			command: 'echo',
			commandArgs: ['test'],
			options: mockOptions,
		});

		await import('./index.ts');

		expect(logger.info).toHaveBeenCalledWith('Mode "staging" has been derived from environment.');
	});

	it('should not log info when MODE differs from options.mode', async () => {
		process.env.MODE = 'development';

		const mockOptions = { mode: 'production', debug: false };

		const { handleCli } = await import('./cli.ts');
		const { logger } = await import('./log.ts');

		vi.mocked(handleCli).mockResolvedValue({
			command: 'echo',
			commandArgs: ['test'],
			options: mockOptions,
		});

		await import('./index.ts');

		expect(logger.info).not.toHaveBeenCalled();
	});

	it('should log warning when mode is empty string', async () => {
		const mockOptions = { mode: '', debug: false };

		const { handleCli } = await import('./cli.ts');
		const { logger } = await import('./log.ts');

		vi.mocked(handleCli).mockResolvedValue({
			command: 'echo',
			commandArgs: ['test'],
			options: mockOptions,
		});

		await import('./index.ts');

		expect(logger.warn).toHaveBeenCalledWith('The provided mode is empty, this might lead to unintentional behaviour.');
	});

	it('should log debug information when debug flag is enabled', async () => {
		const mockCommand = 'npm';
		const mockArgs = ['start'];
		const mockOptions = { mode: 'development', debug: true, envdir: '/path' };

		const { handleCli } = await import('./cli.ts');
		const { logger } = await import('./log.ts');

		vi.mocked(handleCli).mockResolvedValue({
			command: mockCommand,
			commandArgs: mockArgs,
			options: mockOptions,
		});

		await import('./index.ts');

		expect(logger.debug).toHaveBeenCalledWith('CLI', {
			command: mockCommand,
			args: mockArgs,
			options: mockOptions,
		});
	});

	it('should not log debug information when debug flag is disabled', async () => {
		const mockOptions = { mode: 'production', debug: false };

		const { handleCli } = await import('./cli.ts');
		const { logger } = await import('./log.ts');

		vi.mocked(handleCli).mockResolvedValue({
			command: 'echo',
			commandArgs: [],
			options: mockOptions,
		});

		await import('./index.ts');

		expect(logger.debug).not.toHaveBeenCalled();
	});

	it('should handle both MODE logging and debug logging together', async () => {
		process.env.MODE = 'test';

		const mockCommand = 'vitest';
		const mockArgs = ['run'];
		const mockOptions = { mode: 'test', debug: true };

		const { handleCli } = await import('./cli.ts');
		const { logger } = await import('./log.ts');

		vi.mocked(handleCli).mockResolvedValue({
			command: mockCommand,
			commandArgs: mockArgs,
			options: mockOptions,
		});

		await import('./index.ts');

		expect(logger.info).toHaveBeenCalledWith('Mode "test" has been derived from environment.');
		expect(logger.debug).toHaveBeenCalledWith('CLI', {
			command: mockCommand,
			args: mockArgs,
			options: mockOptions,
		});
	});

	it('should handle undefined command gracefully', async () => {
		const mockOptions = { mode: 'production', debug: false };

		const { handleCli } = await import('./cli.ts');
		const { spawnProcess } = await import('./utils.ts');

		vi.mocked(handleCli).mockResolvedValue({
			command: undefined,
			commandArgs: [],
			options: mockOptions,
		});

		await import('./index.ts');

		expect(spawnProcess).toHaveBeenCalledWith(undefined, [], mockOptions);
	});

	it('should handle empty command arguments', async () => {
		const mockCommand = 'node';
		const mockOptions = { mode: 'development', debug: false };

		const { handleCli } = await import('./cli.ts');
		const { spawnProcess } = await import('./utils.ts');

		vi.mocked(handleCli).mockResolvedValue({
			command: mockCommand,
			commandArgs: [],
			options: mockOptions,
		});

		await import('./index.ts');

		expect(spawnProcess).toHaveBeenCalledWith(mockCommand, [], mockOptions);
	});

	it('should preserve all options when passing to spawnProcess', async () => {
		const mockOptions = {
			mode: 'production',
			debug: true,
			dryRun: true,
			envdir: '/custom/path',
			prefix: ['VITE_', 'PUBLIC_'],
		};

		const { handleCli } = await import('./cli.ts');
		const { spawnProcess } = await import('./utils.ts');

		vi.mocked(handleCli).mockResolvedValue({
			command: 'echo',
			commandArgs: ['test'],
			options: mockOptions,
		});

		await import('./index.ts');

		expect(spawnProcess).toHaveBeenCalledWith('echo', ['test'], mockOptions);
	});
});
