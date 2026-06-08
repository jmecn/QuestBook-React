import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const localesDir = path.join(root, 'public/locales')
const languagePath = path.join(root, 'public/language.json')

if (!fs.existsSync(localesDir)) {
  fs.mkdirSync(localesDir, { recursive: true })
}

const enUsPath = path.join(localesDir, 'en_us.json')
if (!fs.existsSync(enUsPath)) {
  console.error('[sync-locale-manifest] missing public/locales/en_us.json')
  process.exit(1)
}

const enUs = fs.readFileSync(enUsPath, 'utf8')
let enabled = ['en_us']

if (fs.existsSync(languagePath)) {
  const cfg = JSON.parse(fs.readFileSync(languagePath, 'utf8'))
  if (Array.isArray(cfg.enabledLocales) && cfg.enabledLocales.length > 0) {
    enabled = cfg.enabledLocales.map((code) =>
      String(code || '').trim().toLowerCase().replace(/-/g, '_'),
    ).filter(Boolean)
  }
}

for (const locale of enabled) {
  const filePath = path.join(localesDir, `${locale}.json`)
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, enUs)
    console.log(`[sync-locale-manifest] created ${locale}.json from en_us`)
  }
}

const locales = fs
  .readdirSync(localesDir)
  .filter((name) => name.endsWith('.json') && name !== 'manifest.json')
  .map((name) => name.slice(0, -'.json'.length))
  .sort()

fs.writeFileSync(path.join(localesDir, 'manifest.json'), `${JSON.stringify(locales, null, 2)}\n`)
console.log(`[sync-locale-manifest] ${locales.join(', ')}`)
