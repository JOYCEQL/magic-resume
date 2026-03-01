import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

console.log('Generating changelog...');
execSync('npx changelogen --output CHANGELOG.md', { stdio: 'inherit' });

const pkgPath = resolve(root, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const version = pkg.version;

const changelogPath = resolve(root, 'CHANGELOG.md');
let content = readFileSync(changelogPath, 'utf8');

const regex = /## v[\d.]+...main/g;
if (regex.test(content)) {
  console.log(`Fixing changelog header for v${version}...`);
  content = content.replace(regex, `## v${version}`);
  writeFileSync(changelogPath, content);
}

console.log('Post-bump script completed successfully.');
