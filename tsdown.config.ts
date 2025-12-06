import { defineConfig } from 'tsdown';

export default defineConfig((options) => {
	const isProduction = options.watch !== true;

	return {
		target: 'node20',
		clean: isProduction,
		dts: isProduction,
		entry: 'src/index.node.ts',
		external: [
			// ensure we always read the current version from the manifests
			'../jsr.json',
			'../package.json',
		],
		format: 'esm',
		minify: isProduction,
		outDir: 'bin',
	};
});
