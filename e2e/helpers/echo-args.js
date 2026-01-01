#!/usr/bin/env node

import process from 'node:process';

// Helper script for E2E tests - echoes arguments passed to it
console.log(JSON.stringify(process.argv.slice(2)));
