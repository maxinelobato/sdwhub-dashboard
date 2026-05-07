#!/usr/bin/env node
/**
 * optimize-images.mjs
 *
 * Pre-build: gera versões WebP otimizadas de todos os PNG/JPG em /public/images.
 * Roda como passo de `build` para entregar Core Web Vitals de ponta.
 */

import { readdir, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'public', 'images');
const CACHE = path.join(SOURCE, '.optimized');

const SUPPORTED = new Set(['.png', '.jpg', '.jpeg']);

async function main() {
  if (!existsSync(SOURCE)) {
    console.log('[optimize-images] /public/images não existe — pulando.');
    return;
  }

  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.warn(
      '[optimize-images] sharp não instalado. Instale com `npm i -D sharp` para gerar WebP.',
    );
    return;
  }

  await mkdir(CACHE, { recursive: true });

  const files = await readdir(SOURCE);
  const candidates = files.filter((f) => SUPPORTED.has(path.extname(f).toLowerCase()));

  if (candidates.length === 0) {
    console.log('[optimize-images] Nenhuma imagem rasterizada encontrada.');
    return;
  }

  let created = 0;
  let skipped = 0;

  for (const file of candidates) {
    const src = path.join(SOURCE, file);
    const base = path.basename(file, path.extname(file));
    const out = path.join(SOURCE, `${base}.webp`);

    if (existsSync(out)) {
      const [srcStat, outStat] = await Promise.all([stat(src), stat(out)]);
      if (outStat.mtimeMs >= srcStat.mtimeMs) {
        skipped += 1;
        continue;
      }
    }

    await sharp(src)
      .webp({ quality: 82, effort: 5 })
      .toFile(out);
    created += 1;
    console.log(`[optimize-images] ${file} → ${base}.webp`);
  }

  console.log(`[optimize-images] OK — ${created} criados, ${skipped} já atualizados.`);
}

main().catch((err) => {
  console.error('[optimize-images] erro:', err);
  process.exit(1);
});
