#!/usr/bin/env node

import process from 'node:process';

const exitCode = Number.parseInt(process.argv[2] || '0', 10);
process.exit(exitCode);
