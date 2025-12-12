const fs = require('fs');
const path = require('path');

const pkgPath = path.join(process.cwd(), 'package.json');
let raw = fs.readFileSync(pkgPath);

// Strip UTF-8 BOM if any
if (raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf) {
  raw = raw.slice(3);
}

const pkg = JSON.parse(raw.toString('utf8'));

// Ensure webpack-friendly name
if (typeof pkg.name !== 'string' || /[^a-z0-9_.@/-]/i.test(pkg.name)) {
  pkg.name = String(pkg.name || 'app').replace(/[^a-z0-9_.@/-]/gi, '').toLowerCase() || 'app';
}

// Write back compact JSON without BOM
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', { encoding: 'utf8' });
console.log('✅ package.json normalized');











