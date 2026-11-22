// Regras de leitura/gravação de projetos usadas pela API do painel.
import { randomBytes } from 'node:crypto';
import sharp from 'sharp';
import { store } from './store';
import { PRIORIDADES as OPCOES } from '../../lib/projetos';

export const AMBIENTES = ['Cozinha', 'Sala', 'Banheiro', 'Área gourmet', 'Escada', 'Fachada', 'Corporativo', 'Outro'];
export const PRIORIDADES: string[] = OPCOES.map((o) => o.value);
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MAX_MB = 20;

export const jsonDe = (id: string) => `src/content/projetos/${id}.json`;
export const pastaDe = (id: string) => `src/assets/projetos/${id}`;
// Caminho gravado no JSON (relativo ao arquivo do projeto, como o Astro espera)
export const refDe = (id: string, arquivo: string) => `../../assets/projetos/${id}/${arquivo}`;
export const HOME = 'src/content/home.json';

export function slugify(t: string) {
  return t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function slugLivre(base: string, ocupado = (s: string) => store.existe(jsonDe(s))) {
  const b = slugify(base) || 'item';
  let s = b;
  for (let i = 2; ocupado(s); i++) s = `${b}-${i}`;
  return s;
}

// Materiais (uma página por pedra)
export const matJsonDe = (id: string) => `src/content/materiais/${id}.json`;
export const matPastaDe = (id: string) => `src/assets/materiais/${id}`;
export const matRefDe = (id: string, arquivo: string) => `../../assets/materiais/${id}/${arquivo}`;

/** Converte qualquer foto enviada em WebP otimizado (até 2400px, orientação corrigida) */
export async function otimizar(arquivo: File) {
  if (!arquivo.type.startsWith('image/')) throw new Error(`"${arquivo.name}" não é uma imagem`);
  if (arquivo.size > MAX_MB * 1024 * 1024) throw new Error(`"${arquivo.name}" passa de ${MAX_MB} MB`);
  const buf = Buffer.from(await arquivo.arrayBuffer());
  return sharp(buf)
    .rotate()
    .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}

export const nomeNovo = (prefixo: string) => `${prefixo}-${randomBytes(4).toString('hex')}.webp`;

export function lerHome(): string[] {
  try {
    const d = JSON.parse(store.ler(HOME) || '{}');
    return Array.isArray(d.destaques) ? d.destaques : [];
  } catch {
    return [];
  }
}

export const resposta = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/** Só aceita chamadas feitas pela própria página do painel */
export const origemOk = (request: Request, url: URL) => {
  const o = request.headers.get('origin');
  return !o || o === url.origin;
};
