import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function getVersion(): Promise<string> {
	const manifestPath = resolve(import.meta.dirname, '../package.json');
	const fileContents = await readFile(manifestPath, 'utf8');
	const { version } = JSON.parse(fileContents);

	return version ?? 'development';
}
