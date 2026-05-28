import { copyFile, cp, mkdir, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')
const distAppHtml = resolve(dist, 'app.html')
const distIndexHtml = resolve(dist, 'index.html')

await copyFile(distAppHtml, distIndexHtml)
await copyFile(distIndexHtml, resolve(root, 'index.html'))
await rm(resolve(root, 'assets'), { recursive: true, force: true })
await mkdir(resolve(root, 'assets'), { recursive: true })
await cp(resolve(dist, 'assets'), resolve(root, 'assets'), { recursive: true })
