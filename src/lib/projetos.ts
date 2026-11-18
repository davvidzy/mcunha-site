import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getCollection, type CollectionEntry } from 'astro:content';

export type Projeto = CollectionEntry<'projetos'>;

export const PRIORIDADES = [
  { value: 'alta', label: 'Alta' },
  { value: 'normal', label: 'Normal' },
  { value: 'baixa', label: 'Baixa' },
] as const;
export const PESO: Record<string, number> = { alta: 0, normal: 1, baixa: 2 };

export const HOME_VAGAS = 3;
export const HOME_FILE = join(process.cwd(), 'src/content/home.json');

/** Ordem das listas: prioridade (alta → baixa), depois título */
export const porPrioridade = (a: Projeto, b: Projeto) =>
  (PESO[a.data.prioridade] ?? 1) - (PESO[b.data.prioridade] ?? 1) || a.data.titulo.localeCompare(b.data.titulo, 'pt-BR');

export async function getProjetos() {
  return (await getCollection('projetos')).sort(porPrioridade);
}

/** Slugs escolhidos para a página inicial, na ordem definida (arrastando no painel) */
export function getHomeSlugs(): string[] {
  try {
    const data = JSON.parse(readFileSync(HOME_FILE, 'utf8'));
    return Array.isArray(data.destaques) ? data.destaques.filter((s: unknown) => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

/** Projetos da home; se houver vaga, completa com os de maior prioridade */
export async function getHomeProjetos() {
  const todos = await getProjetos();
  const escolhidos = getHomeSlugs()
    .map((s) => todos.find((p) => p.id === s))
    .filter((p): p is Projeto => Boolean(p))
    .slice(0, HOME_VAGAS);
  const resto = todos.filter((p) => !escolhidos.includes(p));
  return [...escolhidos, ...resto].slice(0, HOME_VAGAS);
}
