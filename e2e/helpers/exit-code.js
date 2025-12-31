#!/usr/bin/env node

import process from 'node:process';

// Helper script for E2E tests - exits with specified code
const exitCode = Number.parseInt(process.argv[2] || '0', 10);
process.exit(exitCode);
