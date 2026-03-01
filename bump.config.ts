import { defineConfig } from 'bumpp'

export default defineConfig({
  execute: 'node scripts/post-bump.mjs',
  commit: true,
  tag: true,
  push: false,
  all: true,
})
