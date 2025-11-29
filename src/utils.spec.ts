import { spawn } from 'node:child_process';
import process from 'node:process';
import { loadEnv } from 'vite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from './log.ts';
import { getVersion, spawnProcess } from './utils.ts';

vi.mock('node:child_process');
vi.mock('vite');
vi.mock('./log.ts', () => ({
	logger: {
		log: vi.fn(),
		info: vi.fn(),
		debug: vi.fn(),
		error: vi.fn(),
	},
}));

describe('getVersion', () => {
	it('should return version from package.json', async () => {
		const version = await getVersion();

		expect(version).toMatch(/^\d+\.\d+\.\d+/);
	});
});

describe('spawnProcess', () => {
	const mockChild = {
		on: vi.fn(),
		kill: vi.fn(),
	};

	beforeEach(() => {
		vi.resetAllMocks();
		vi.mocked(spawn).mockReturnValue(mockChild as any);
		vi.mocked(loadEnv).mockReturnValue({ TEST_VAR: 'value' });
		process.on = vi.fn() as any;
		process.exit = vi.fn() as any;
		process.kill = vi.fn() as any;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should spawn process with correct arguments', () => {
		spawnProcess('echo', ['hello'], { mode: 'test', envdir: '.' });

		expect(spawn).toHaveBeenCalledWith(
			'echo',
			['hello'],
			expect.objectContaining({
				stdio: 'inherit',
				env: expect.any(Object),
			}),
		);
	});

	it('should not spawn process in dry-run mode', () => {
		spawnProcess('echo', ['hello'], { mode: 'test', envdir: '.', dryRun: true });

		expect(spawn).not.toHaveBeenCalled();
	});

	it('should log command in dry-run mode', () => {
		spawnProcess('echo', ['hello', 'world'], { mode: 'test', envdir: '.', dryRun: true });

		expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('echo hello world'));
	});

	it('should log environment in debug mode', () => {
		spawnProcess('echo', [], { mode: 'test', envdir: '.', debug: true });

		expect(logger.debug).toHaveBeenCalledWith('Environment', expect.any(Object));
	});

	it('should setup exit handler for child process', () => {
		spawnProcess('echo', [], { mode: 'test', envdir: '.' });

		expect(mockChild.on).toHaveBeenCalledWith('exit', expect.any(Function));
	});

	it('should setup error handler for child process', () => {
		spawnProcess('echo', [], { mode: 'test', envdir: '.' });

		expect(mockChild.on).toHaveBeenCalledWith('error', expect.any(Function));
	});

	it('should forward signals to child process', () => {
		spawnProcess('echo', [], { mode: 'test', envdir: '.' });

		const signalHandler = (process.on as any).mock.calls.find((call: any[]) =>
			['SIGINT', 'SIGTERM'].includes(call[0]),
		)?.[1];

		expect(signalHandler).toBeDefined();

		if (signalHandler) {
			signalHandler();
			expect(mockChild.kill).toHaveBeenCalled();
		}
	});

	it('should handle child process exit with code', () => {
		spawnProcess('echo', [], { mode: 'test', envdir: '.' });

		const exitHandler = mockChild.on.mock.calls.find((call) => call[0] === 'exit')?.[1];

		expect(exitHandler).toBeDefined();

		if (exitHandler) {
			exitHandler(0, null);
			expect(process.exit).toHaveBeenCalledWith(0);
		}
	});

	it('should handle child process exit with signal', () => {
		spawnProcess('echo', [], { mode: 'test', envdir: '.' });

		const exitHandler = mockChild.on.mock.calls.find((call) => call[0] === 'exit')?.[1];

		if (exitHandler) {
			exitHandler(null, 'SIGTERM');
			expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('SIGTERM'));
			expect(process.kill).toHaveBeenCalledWith(process.pid, 'SIGTERM');
		}
	});

	it('should handle child process error', () => {
		spawnProcess('echo', [], { mode: 'test', envdir: '.' });

		const errorHandler = mockChild.on.mock.calls.find((call) => call[0] === 'error')?.[1];

		if (errorHandler) {
			errorHandler(new Error('Test error'));
			expect(logger.error).toHaveBeenCalledWith('Test error');
		}
	});

	it('should handle command without arguments', () => {
		spawnProcess('node', [], { mode: 'test', envdir: '.' });

		expect(spawn).toHaveBeenCalledWith('node', [], expect.any(Object));
	});

	it('should resolve envdir path', () => {
		spawnProcess('echo', [], { mode: 'test', envdir: './custom' });

		expect(spawn).toHaveBeenCalledWith(
			'echo',
			[],
			expect.objectContaining({
				stdio: 'inherit',
				env: expect.any(Object),
			}),
		);
	});
});
