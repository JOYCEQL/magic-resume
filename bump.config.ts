import { defineConfig } from 'bumpp'

export default defineConfig({
  execute: 'npx changelogen --output CHANGELOG.md',
  commit: true,
  tag: true,
  push: false,
  all: true,
})
