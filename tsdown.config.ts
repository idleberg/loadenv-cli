import { defineConfig } from 'tsdown';

export default defineConfig((options) => {
	const isProduction = options.watch !== true;

	return {
		target: 'node22',
		clean: isProduction,
		deps: {
			neverBundle: [
				// ensure we always read the current version from the manifests
				'../jsr.json',
				'../package.json',
			],
		},
		dts: isProduction,
		entry: {
			cli: 'src/index.node.ts',
		},
		format: 'esm',
		minify: isProduction,
		outDir: 'bin',
	};
});
