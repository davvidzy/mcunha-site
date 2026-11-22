// Ações rápidas do painel: ordem da home, prioridade e exclusão.
import type { APIRoute } from 'astro';
import { store } from '../lib/store';
import { HOME, PRIORIDADES, SLUG, jsonDe, lerHome, matJsonDe, matPastaDe, origemOk, pastaDe, resposta } from '../lib/projeto';

export const prerender = false;
const HOME_VAGAS = 3;
const existe = (id: unknown): id is string => typeof id === 'string' && SLUG.test(id) && store.existe(jsonDe(id));

export const POST: APIRoute = async ({ request, url }) => {
  if (!origemOk(request, url)) return resposta({ erro: 'Origem não permitida' }, 403);
  let body: any;
  try {
    body = await request.json();
  } catch {
    return resposta({ erro: 'Pedido inválido' }, 400);
  }
  const lote = store.lote();

  switch (body?.acao) {
    case 'home': {
      const ids = body.destaques;
      if (!Array.isArray(ids) || ids.length > HOME_VAGAS || new Set(ids).size !== ids.length || !ids.every(existe)) {
        return resposta({ erro: `Escolha até ${HOME_VAGAS} projetos diferentes` }, 400);
      }
      lote.gravar(HOME, JSON.stringify({ destaques: ids }, null, 2) + '\n');
      await lote.confirmar('Painel: ordem da página inicial');
      return resposta({ ok: true });
    }

    case 'prioridade': {
      if (!existe(body.id)) return resposta({ erro: 'Projeto não encontrado' }, 404);
      if (!PRIORIDADES.includes(body.prioridade)) return resposta({ erro: 'Prioridade inválida' }, 400);
      const data = JSON.parse(store.ler(jsonDe(body.id))!);
      data.prioridade = body.prioridade;
      lote.gravar(jsonDe(body.id), JSON.stringify(data, null, 2) + '\n');
      await lote.confirmar(`Painel: prioridade de ${data.titulo}`);
      return resposta({ ok: true });
    }

    case 'excluir': {
      if (!existe(body.id)) return resposta({ erro: 'Projeto não encontrado' }, 404);
      const titulo = JSON.parse(store.ler(jsonDe(body.id))!).titulo;
      lote.remover(jsonDe(body.id));
      lote.remover(pastaDe(body.id));
      const home = lerHome();
      if (home.includes(body.id)) {
        lote.gravar(HOME, JSON.stringify({ destaques: home.filter((x) => x !== body.id) }, null, 2) + '\n');
      }
      await lote.confirmar(`Painel: exclui ${titulo}`);
      return resposta({ ok: true });
    }

    case 'ordemMateriais': {
      const ids = body.ids;
      const ok = (id: unknown): id is string => typeof id === 'string' && SLUG.test(id) && store.existe(matJsonDe(id));
      if (!Array.isArray(ids) || !ids.every(ok)) return resposta({ erro: 'Lista de materiais inválida' }, 400);
      ids.forEach((id, i) => {
        const data = JSON.parse(store.ler(matJsonDe(id))!);
        data.ordem = i;
        lote.gravar(matJsonDe(id), JSON.stringify(data, null, 2) + '\n');
      });
      await lote.confirmar('Painel: ordem dos materiais');
      return resposta({ ok: true });
    }

    case 'excluirMaterial': {
      if (typeof body.id !== 'string' || !SLUG.test(body.id) || !store.existe(matJsonDe(body.id))) {
        return resposta({ erro: 'Material não encontrado' }, 404);
      }
      const nome = JSON.parse(store.ler(matJsonDe(body.id))!).nome;
      lote.remover(matJsonDe(body.id));
      lote.remover(matPastaDe(body.id));
      await lote.confirmar(`Painel: exclui material ${nome}`);
      return resposta({ ok: true });
    }
  }
  return resposta({ erro: 'Ação desconhecida' }, 400);
};
