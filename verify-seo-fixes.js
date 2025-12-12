#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function assert(condition, msg) {
  if (!condition) {
    console.error('✗', msg);
    process.exitCode = 1;
  } else {
    console.log('✓', msg);
  }
}

const appJs = fs.readFileSync(path.join(__dirname, 'src', 'App.js'), 'utf8');
assert(appJs.includes('/ride/:id'), 'App routes include /ride/:id');
assert(appJs.includes('/report/:id'), 'Modal routes include /report/:id');

const vercel = JSON.parse(fs.readFileSync(path.join(__dirname, 'vercel.json'), 'utf8'));
assert(Array.isArray(vercel.rewrites) && vercel.rewrites.length > 0, 'Vercel rewrites configured');
assert(vercel.rewrites.some(r => r.destination === '/index.html'), 'Vercel rewrites to /index.html');

console.log('All verifications completed.');