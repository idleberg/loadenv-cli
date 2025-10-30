import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from './log.ts';

vi.mock('./log.ts', () => ({
	logger: {
		log: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock('./utils.ts', () => ({
	getVersion: vi.fn().mockResolvedValue('1.0.0'),
}));

describe('handleCli', () => {
	const originalArgv = process.argv;
	const originalEnv = process.env;

	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
		process.argv = ['node', 'loadenv'];
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.argv = originalArgv;
		process.env = originalEnv;
		vi.restoreAllMocks();
	});

	it('should parse command and arguments', async () => {
		process.argv = ['node', 'loadenv', '-m', 'production', 'npm', 'run', 'build'];

		const { handleCli } = await import('./cli.ts');
		const result = await handleCli();

		expect(result.command).toBe('npm');
		expect(result.commandArgs).toEqual(['run', 'build']);
		expect(result.options.mode).toBe('production');
	});

	it('should use default envdir as process.cwd()', async () => {
		process.argv = ['node', 'loadenv', '-m', 'test', 'echo', 'hello'];

		const { handleCli } = await import('./cli.ts');
		const result = await handleCli();

		expect(result.options.envdir).toBe(process.cwd());
	});

	it('should accept custom envdir', async () => {
		process.argv = ['node', 'loadenv', '-m', 'test', '-e', '/custom/path', 'echo'];

		const { handleCli } = await import('./cli.ts');
		const result = await handleCli();

		expect(result.options.envdir).toBe('/custom/path');
	});

	it('should accept prefix option', async () => {
		process.argv = ['node', 'loadenv', '-m', 'test', '-p', 'VITE_', 'PUBLIC_', '--', 'echo'];

		const { handleCli } = await import('./cli.ts');
		const result = await handleCli();

		expect(result.options.prefix).toEqual(['VITE_', 'PUBLIC_']);
	});

	it('should use default prefix as empty string', async () => {
		process.argv = ['node', 'loadenv', '-m', 'test', 'echo'];

		const { handleCli } = await import('./cli.ts');
		const result = await handleCli();

		expect(result.options.prefix).toBe('');
	});

	it('should parse debug flag', async () => {
		process.argv = ['node', 'loadenv', '-m', 'test', '-D', 'echo'];

		const { handleCli } = await import('./cli.ts');
		const result = await handleCli();

		expect(result.options.debug).toBe(true);
	});

	it('should parse dry-run flag', async () => {
		process.argv = ['node', 'loadenv', '-m', 'test', '-R', 'echo'];

		const { handleCli } = await import('./cli.ts');
		const result = await handleCli();

		expect(result.options.dryRun).toBe(true);
	});

	it('should use MODE from environment as default mode', async () => {
		process.env.MODE = 'staging';
		process.argv = ['node', 'loadenv', 'echo'];

		const { handleCli } = await import('./cli.ts');
		const result = await handleCli();

		expect(result.options.mode).toBe('staging');
	});

	it('should allow unknown options to be passed through', async () => {
		process.argv = ['node', 'loadenv', '-m', 'test', 'echo', '--unknown-flag', 'value'];

		const { handleCli } = await import('./cli.ts');
		const result = await handleCli();

		expect(result.command).toBe('echo');
		expect(result.commandArgs).toContain('--unknown-flag');
		expect(result.commandArgs).toContain('value');
	});

	it('should handle command without arguments', async () => {
		process.argv = ['node', 'loadenv', '-m', 'test', 'node'];

		const { handleCli } = await import('./cli.ts');
		const result = await handleCli();

		expect(result.command).toBe('node');
		expect(result.commandArgs).toEqual([]);
	});

	it('should use logger.log for help output', async () => {
		process.argv = ['node', 'loadenv', '--help'];
		const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

		const { handleCli } = await import('./cli.ts');

		try {
			await handleCli();
		} catch {
			// Commander calls process.exit after --help
		}

		expect(logger.log).toHaveBeenCalled();
		expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
		exitSpy.mockRestore();
	});

	it('should use logger.error for error messages', async () => {
		process.argv = ['node', 'loadenv']; // Missing required command
		const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

		const { handleCli } = await import('./cli.ts');

		try {
			await handleCli();
		} catch {
			// Commander calls process.exit on error
		}

		expect(logger.error).toHaveBeenCalled();
		exitSpy.mockRestore();
	});
});
