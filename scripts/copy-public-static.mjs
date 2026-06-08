import fs from 'node:fs'
import path from 'node:path'

const publicDir = path.resolve('public')
const outDir = path.resolve('dist')

if (!fs.existsSync(outDir)) {
  console.error('[copy-public-static] dist/ missing — run vite build first')
  process.exit(1)
}

if (!fs.existsSync(publicDir)) {
  process.exit(0)
}

for (const entry of fs.readdirSync(publicDir)) {
  if (entry === 'data') continue
  const src = path.join(publicDir, entry)
  const dest = path.join(outDir, entry)
  fs.cpSync(src, dest, { recursive: true })
}
