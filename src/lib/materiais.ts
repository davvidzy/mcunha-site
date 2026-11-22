import { getCollection, type CollectionEntry } from 'astro:content';
import type { Projeto } from './projetos';

export type Material = CollectionEntry<'materiais'>;

export async function getMateriais() {
  return (await getCollection('materiais')).sort((a, b) => a.data.ordem - b.data.ordem || a.data.nome.localeCompare(b.data.nome, 'pt-BR'));
}

const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Projetos cujo campo "Materiais" cita esta pedra ("Mármores" casa com "mármore branco") */
export function projetosDe(m: Material, projetos: Projeto[]) {
  const raiz = normalizar(m.data.nome).replace(/s$/, ''); // plural simples: "marmores" -> "marmore"
  return projetos.filter((p) => normalizar(p.data.materiais).includes(raiz));
}
