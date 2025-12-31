#!/usr/bin/env node

// Helper script for E2E tests - prints specific env vars as JSON
const envVars = {
	VITE_API_URL: process.env.VITE_API_URL,
	VITE_MODE: process.env.VITE_MODE,
	VITE_FOO: process.env.VITE_FOO,
	VITE_BASE: process.env.VITE_BASE,
	VITE_OVERRIDE: process.env.VITE_OVERRIDE,
	VITE_CUSTOM: process.env.VITE_CUSTOM,
	PUBLIC_BAZ: process.env.PUBLIC_BAZ,
	SECRET: process.env.SECRET,
	EXPANDED_PORT: process.env.EXPANDED_PORT,
	BASE_PORT: process.env.BASE_PORT,
};

console.log(JSON.stringify(envVars));
