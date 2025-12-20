#!/usr/bin/env node

/**
 * Basic validation script for the advertising system
 * Checks that all required files exist and are properly structured
 */

const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'types/ad.ts',
  'app/skapa-annons/page.tsx',
  'app/ad/[id]/page.tsx',
  'components/ad/AdCard.tsx',
  'ADVERTISING_SYSTEM.md'
];

const requiredExports = {
  'components/ad/AdCard.tsx': ['export default function AdCard'],
  'types/ad.ts': ['export interface Ad', 'export interface AdService']
};

console.log('🔍 Validating advertising system files...\n');

let allValid = true;

// Check required files exist
console.log('📁 Checking required files:');
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - NOT FOUND`);
    allValid = false;
  }
});

console.log('\n📦 Checking exports:');
Object.entries(requiredExports).forEach(([file, exports]) => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    exports.forEach(exp => {
      if (content.includes(exp)) {
        console.log(`  ✅ ${file} exports ${exp.split(' ').slice(-1)[0]}`);
      } else {
        console.log(`  ❌ ${file} missing ${exp}`);
        allValid = false;
      }
    });
  }
});

console.log('\n📝 Checking home page integration:');
const homePagePath = path.join(__dirname, 'app/page.tsx');
if (fs.existsSync(homePagePath)) {
  const content = fs.readFileSync(homePagePath, 'utf8');
  const checks = [
    ['AdCard import', 'import AdCard'],
    ['Ads fetching', "collection(db, 'ads')"],
    ['Ads section', '📢 Senaste annonserna']
  ];
  
  checks.forEach(([name, text]) => {
    if (content.includes(text)) {
      console.log(`  ✅ ${name}`);
    } else {
      console.log(`  ❌ ${name} - NOT FOUND`);
      allValid = false;
    }
  });
}

console.log('\n' + '='.repeat(50));
if (allValid) {
  console.log('✅ All validations passed!');
  process.exit(0);
} else {
  console.log('❌ Some validations failed!');
  process.exit(1);
}
