import { execFile } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

/**
 * Helper to parse JSON from stdout, handling potential log messages
 */
function parseJsonOutput(stdout: string): unknown {
	const lines = stdout.trim().split('\n');

	// Get the last non-empty line which should be the JSON output
	const jsonLine = lines.filter((line) => line.trim()).pop() || '';

	return JSON.parse(jsonLine);
}

describe('CLI Usage', () => {
	const helpersDir = join(__dirname, 'helpers');
	const testEnvDir = join(helpersDir, 'env');
	const cliPath = join(__dirname, '../bin/cli.mjs');
	const printEnvScript = join(helpersDir, 'print-env.ts');
	const exitCodeScript = join(helpersDir, 'exit-code.ts');
	const echoArgsScript = join(helpersDir, 'echo-args.ts');
	const nodePath = process.execPath;

	beforeAll(async () => {
		await mkdir(testEnvDir, { recursive: true });

		await writeFile(join(testEnvDir, '.env.production'), 'VITE_API_URL=https://prod.api.com\nVITE_MODE=production\n');

		await writeFile(join(testEnvDir, '.env.development'), 'VITE_API_URL=https://dev.api.com\nVITE_MODE=development\n');

		await writeFile(join(testEnvDir, '.env.test'), 'VITE_FOO=bar\nPUBLIC_BAZ=qux\nSECRET=hidden\n');

		// biome-ignore lint/suspicious/noTemplateCurlyInString: dotenv expansion test
		await writeFile(join(testEnvDir, '.env.staging'), 'BASE_PORT=3000\nEXPANDED_PORT=http://localhost:${BASE_PORT}\n');

		await writeFile(join(testEnvDir, '.env'), 'VITE_BASE=always-loaded\n');

		await writeFile(join(testEnvDir, '.env.cascade'), 'VITE_API_URL=from-cascade\nVITE_OVERRIDE=from-mode\n');
	});

	afterAll(async () => {
		await rm(testEnvDir, { recursive: true, force: true });
	});

	describe('Basic env loading', () => {
		it('should load production env vars', async () => {
			const { stdout } = await execFileAsync('node', [
				cliPath,
				'--mode',
				'production',
				'--envdir',
				testEnvDir,
				'--',
				'node',
				printEnvScript,
			]);

			const result = parseJsonOutput(stdout) as Record<string, string>;
			expect(result.VITE_API_URL).toBe('https://prod.api.com');
			expect(result.VITE_MODE).toBe('production');
		});

		it('should load development env vars', async () => {
			const { stdout } = await execFileAsync('node', [
				cliPath,
				'--mode',
				'development',
				'--envdir',
				testEnvDir,
				'--',
				'node',
				printEnvScript,
			]);

			const result = parseJsonOutput(stdout) as Record<string, string>;
			expect(result.VITE_API_URL).toBe('https://dev.api.com');
			expect(result.VITE_MODE).toBe('development');
		});

		it('should handle mode-specific env files', async () => {
			const { stdout } = await execFileAsync('node', [
				cliPath,
				'--mode',
				'test',
				'--envdir',
				testEnvDir,
				'--',
				'node',
				printEnvScript,
			]);

			const result = parseJsonOutput(stdout) as Record<string, string>;
			expect(result.VITE_FOO).toBe('bar');
			expect(result.PUBLIC_BAZ).toBe('qux');
			expect(result.SECRET).toBe('hidden');
		});
	});

	describe('Prefix filtering', () => {
		it('should filter by single prefix', async () => {
			const { stdout } = await execFileAsync('node', [
				cliPath,
				'--mode',
				'test',
				'--envdir',
				testEnvDir,
				'--prefix',
				'VITE_',
				'--',
				nodePath, // Use absolute path since PATH won't be in filtered env
				printEnvScript,
			]);

			const result = parseJsonOutput(stdout) as Record<string, string>;
			expect(result.VITE_FOO).toBe('bar');
			expect(result.PUBLIC_BAZ).toBeUndefined();
			expect(result.SECRET).toBeUndefined();
		});

		it('should filter by multiple prefixes', async () => {
			const { stdout } = await execFileAsync('node', [
				cliPath,
				'--mode',
				'test',
				'--envdir',
				testEnvDir,
				'--prefix',
				'VITE_',
				'PUBLIC_',
				'--',
				nodePath, // Use absolute path since PATH won't be in filtered env
				printEnvScript,
			]);

			const result = parseJsonOutput(stdout) as Record<string, string>;
			expect(result.VITE_FOO).toBe('bar');
			expect(result.PUBLIC_BAZ).toBe('qux');
			expect(result.SECRET).toBeUndefined();
		});

		it('should load all vars when no prefix is specified', async () => {
			const { stdout } = await execFileAsync('node', [
				cliPath,
				'--mode',
				'test',
				'--envdir',
				testEnvDir,
				'--',
				'node',
				printEnvScript,
			]);

			const result = parseJsonOutput(stdout) as Record<string, string>;
			expect(result.VITE_FOO).toBe('bar');
			expect(result.PUBLIC_BAZ).toBe('qux');
			expect(result.SECRET).toBe('hidden');
		});
	});

	describe('Environment variable expansion', () => {
		it('should expand environment variables', async () => {
			const { stdout } = await execFileAsync('node', [
				cliPath,
				'--mode',
				'staging',
				'--envdir',
				testEnvDir,
				'--',
				'node',
				printEnvScript,
			]);

			const result = parseJsonOutput(stdout) as Record<string, string>;
			expect(result.BASE_PORT).toBe('3000');
			expect(result.EXPANDED_PORT).toBe('http://localhost:3000');
		});
	});

	describe('Exit code propagation', () => {
		it('should propagate exit code 0', async () => {
			const { stdout } = await execFileAsync('node', [
				cliPath,
				'--mode',
				'test',
				'--envdir',
				testEnvDir,
				'--',
				'node',
				exitCodeScript,
				'0',
			]);

			expect(stdout).toBeDefined();
		});

		it('should propagate non-zero exit codes', async () => {
			await expect(
				execFileAsync('node', [cliPath, '--mode', 'test', '--envdir', testEnvDir, '--', 'node', exitCodeScript, '42']),
			).rejects.toMatchObject({
				code: 42,
			});
		});

		it('should propagate exit code 1', async () => {
			await expect(
				execFileAsync('node', [cliPath, '--mode', 'test', '--envdir', testEnvDir, '--', 'node', exitCodeScript, '1']),
			).rejects.toMatchObject({
				code: 1,
			});
		});
	});

	describe('Command and arguments', () => {
		it('should pass arguments to spawned process', async () => {
			const { stdout } = await execFileAsync('node', [
				cliPath,
				'--mode',
				'test',
				'--envdir',
				testEnvDir,
				'--',
				'node',
				echoArgsScript,
				'arg1',
				'arg2',
				'--flag',
			]);

			const result = parseJsonOutput(stdout) as string[];
			expect(result).toEqual(['arg1', 'arg2', '--flag']);
		});

		it('should handle command without arguments', async () => {
			const { stdout } = await execFileAsync('node', [
				cliPath,
				'--mode',
				'test',
				'--envdir',
				testEnvDir,
				'--',
				'node',
				echoArgsScript,
			]);

			const result = parseJsonOutput(stdout) as string[];
			expect(result).toEqual([]);
		});

		it('should allow unknown options to be passed to spawned process', async () => {
			const { stdout } = await execFileAsync('node', [
				cliPath,
				'--mode',
				'test',
				'--envdir',
				testEnvDir,
				'--',
				'node',
				echoArgsScript,
				'--unknown-flag',
				'value',
			]);

			const result = parseJsonOutput(stdout) as string[];
			expect(result).toEqual(['--unknown-flag', 'value']);
		});
	});

	describe('Error handling', () => {
		it('should handle non-existent command', async () => {
			const { stderr } = await execFileAsync('node', [
				cliPath,
				'--mode',
				'test',
				'--envdir',
				testEnvDir,
				'--',
				'this-command-does-not-exist-xyz123',
			]);

			// CLI logs the error to stderr but doesn't exit with non-zero code
			expect(stderr).toContain('ENOENT');
		});

		it('should handle missing mode directory gracefully', async () => {
			// When .env.nonexistent doesn't exist, it should still run
			// but just won't load any mode-specific vars
			const { stdout } = await execFileAsync('node', [
				cliPath,
				'--mode',
				'nonexistent',
				'--envdir',
				testEnvDir,
				'--',
				'node',
				printEnvScript,
			]);

			const result = parseJsonOutput(stdout);

			expect(result).toBeDefined();
		});
	});

	describe('Cascading and priority', () => {
		it('should load env vars from mode-specific file', async () => {
			const { stdout } = await execFileAsync('node', [
				cliPath,
				'--mode',
				'cascade',
				'--envdir',
				testEnvDir,
				'--',
				'node',
				printEnvScript,
			]);

			const result = parseJsonOutput(stdout) as Record<string, string>;
			expect(result.VITE_API_URL).toBe('from-cascade');
			expect(result.VITE_OVERRIDE).toBe('from-mode');
		});
	});

	describe('Custom envdir', () => {
		it('should load env from custom directory', async () => {
			const customEnvDir = join(helpersDir, 'custom-env');
			await mkdir(customEnvDir, { recursive: true });

			await writeFile(join(customEnvDir, '.env.custom'), 'VITE_CUSTOM=custom-value\n');

			try {
				const { stdout } = await execFileAsync('node', [
					cliPath,
					'--mode',
					'custom',
					'--envdir',
					customEnvDir,
					'--',
					'node',
					printEnvScript,
				]);

				const result = parseJsonOutput(stdout) as Record<string, string>;
				expect(result.VITE_CUSTOM).toBe('custom-value');
			} finally {
				await rm(customEnvDir, { recursive: true, force: true });
			}
		});

		it('should use process.cwd() when envdir is not specified', async () => {
			// This test verifies the default behavior
			// We can't easily test process.cwd() in isolation, but we can verify
			// the CLI runs without --envdir (it will just use cwd which may not have .env files)
			const { stdout } = await execFileAsync('node', [cliPath, '--mode', 'test', '--', 'node', printEnvScript], {
				cwd: testEnvDir, // Set cwd to our test env dir
			});

			const result = parseJsonOutput(stdout) as Record<string, string>;
			expect(result.VITE_FOO).toBe('bar');
		});
	});
});
