// Leitura direta dos arquivos de projeto para o painel.
// O painel não usa as coleções do Astro: assim mostra sempre o estado mais recente,
// mesmo logo depois de salvar ou excluir.
import { store } from './store';
import { jsonDe, lerHome } from './projeto';
import { PESO } from '../../lib/projetos';

export type ProjetoPainel = {
  id: string;
  titulo: string;
  materiais: string;
  ambiente: string;
  local: string;
  capa: string;
  capaAlt: string;
  descricao: string;
  galeria: { imagem: string; alt: string }[];
  prioridade: 'alta' | 'normal' | 'baixa';
};

export function lerProjeto(id: string): ProjetoPainel | null {
  try {
    const d = JSON.parse(store.ler(jsonDe(id)) || 'null');
    if (!d) return null;
    return {
      id,
      titulo: d.titulo ?? '',
      materiais: d.materiais ?? '',
      ambiente: d.ambiente ?? 'Outro',
      local: d.local ?? '',
      capa: d.capa ?? '',
      capaAlt: d.capaAlt ?? '',
      descricao: d.descricao ?? '',
      galeria: Array.isArray(d.galeria) ? d.galeria.map((g: any) => ({ imagem: g.imagem, alt: g.alt ?? '' })) : [],
      prioridade: d.prioridade in PESO ? d.prioridade : 'normal',
    };
  } catch {
    return null;
  }
}

export function listarProjetos(): ProjetoPainel[] {
  return store
    .listar('src/content/projetos')
    .filter((f) => f.endsWith('.json'))
    .map((f) => lerProjeto(f.slice(0, -5)))
    .filter((p): p is ProjetoPainel => Boolean(p))
    .sort((a, b) => PESO[a.prioridade] - PESO[b.prioridade] || a.titulo.localeCompare(b.titulo, 'pt-BR'));
}

export { lerHome };

/** URL da miniatura de uma foto do projeto (ref como gravada no JSON) */
export const miniatura = (ref: string, w = 240) =>
  `/api/painel/foto?p=${encodeURIComponent(ref.replace(/^\.\.\/\.\.\//, 'src/'))}&w=${w}`;
