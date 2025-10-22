import { readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getVersion } from './utils.ts';

vi.mock('node:fs/promises');

describe('getVersion', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it.each([
		{ packageJson: { version: '1.2.3' }, expected: '1.2.3', description: 'valid version' },
		{ packageJson: { version: '0.0.1' }, expected: '0.0.1', description: 'initial version' },
		{ packageJson: { version: '10.20.30' }, expected: '10.20.30', description: 'multi-digit version' },
		{ packageJson: { version: '2.3.4-beta.1' }, expected: '2.3.4-beta.1', description: 'prerelease version' },
		{
			packageJson: { version: '3.0.0-rc.1+build.123' },
			expected: '3.0.0-rc.1+build.123',
			description: 'version with metadata',
		},
		{ packageJson: {}, expected: 'development', description: 'missing version' },
		{ packageJson: { version: null }, expected: 'development', description: 'null version' },
		{ packageJson: { version: undefined }, expected: 'development', description: 'undefined version' },
	])('should return $expected when $description', async ({ packageJson, expected }) => {
		vi.mocked(readFile).mockResolvedValue(JSON.stringify(packageJson));

		const version = await getVersion();

		expect(version).toBe(expected);
	});

	it('should read from correct package.json path', async () => {
		vi.mocked(readFile).mockResolvedValue(JSON.stringify({ version: '1.0.0' }));

		await getVersion();

		expect(readFile).toHaveBeenCalledWith(expect.stringContaining('package.json'), 'utf8');
	});
});
