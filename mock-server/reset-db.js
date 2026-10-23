#!/usr/bin/env node

/**
 * Copies db.seed.json to db.json so every mock-server run starts from known data.
 * db.json is gitignored because json-server rewrites it at runtime.
 */
const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, 'db.seed.json');
const dbPath = path.join(__dirname, 'db.json');

fs.copyFileSync(seedPath, dbPath);
console.log(`Mock DB reset from ${path.basename(seedPath)}`);
