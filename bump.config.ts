import { defineConfig } from 'bumpp'

export default defineConfig({
  commit: 'release: v%s',
  tag: true,
  push: true,
  all: true, // commit all changes
  execute: 'npx changelogen --output CHANGELOG.md',
})
