import { defineConfig } from 'bumpp'

export default defineConfig({
  execute: 'npx changelogen --output CHANGELOG.md && node -e "const fs=require(\'fs\'); const pkg=require(\'./package.json\'); let c=fs.readFileSync(\'CHANGELOG.md\',\'utf8\'); c=c.replace(/## v[\\d.]+...main/g, \'## v\' + pkg.version); fs.writeFileSync(\'CHANGELOG.md\', c);"',
  commit: true,
  tag: true,
  push: false,
  all: true,
})
