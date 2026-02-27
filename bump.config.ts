import { defineConfig } from 'bumpp'

export default defineConfig({
  execute: 'npx changelogen --output CHANGELOG.md',
  commit: false,
  tag: false,
  push: false,
})
