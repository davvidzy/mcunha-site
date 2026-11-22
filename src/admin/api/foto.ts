// Miniaturas das fotos para o painel (redimensionadas na hora).
import type { APIRoute } from 'astro';
import { existsSync, readFileSync } from 'node:fs';
import { join, normalize, sep } from 'node:path';
import sharp from 'sharp';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const rel = normalize(url.searchParams.get('p') || '').split(sep).join('/');
  const w = Math.min(1600, Math.max(64, parseInt(url.searchParams.get('w') || '240', 10) || 240));
  if (!/^src\/assets\/(projetos|materiais)\//.test(rel) || rel.includes('..')) return new Response('Não encontrado', { status: 404 });
  const f = join(process.cwd(), rel);
  if (!existsSync(f)) return new Response('Não encontrado', { status: 404 });
  const buf = await sharp(readFileSync(f)).resize({ width: w, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
  return new Response(new Uint8Array(buf), { headers: { 'content-type': 'image/webp', 'cache-control': 'private, max-age=300' } });
};
