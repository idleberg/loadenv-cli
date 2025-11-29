import { defineConfig } from 'tsdown';

export default defineConfig((options) => {
	const isProduction = options.watch !== true;

	return {
		target: 'node20',
		clean: isProduction,
		dts: isProduction,
		entry: 'src/node.ts',
		external: ['../jsr.json', '../package.json'],
		format: 'esm',
		minify: isProduction,
		outDir: 'bin',
	};
});
