import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['e2e/*.spec.ts', 'src/*.spec.ts'],
		testTimeout: 10_000,
		coverage: {
			exclude: ['src/index.*.ts', 'e2e/*.ts'],
			include: ['src/*.ts'],
		},
	},
});
