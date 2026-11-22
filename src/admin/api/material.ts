// Criar / salvar um material (pedra).
import type { APIRoute } from 'astro';
import { store } from '../lib/store';
import { SLUG, matJsonDe, matPastaDe, matRefDe, nomeNovo, origemOk, otimizar, resposta, slugLivre } from '../lib/projeto';
import { listarMateriais } from '../lib/dados';

export const prerender = false;

const texto = (v: unknown, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
// "Um item por linha" -> lista sem linhas vazias
const linhas = (v: unknown) =>
  texto(v, 3000)
    .split('\n')
    .map((l) => l.trim().slice(0, 120))
    .filter(Boolean)
    .slice(0, 12);

export const POST: APIRoute = async ({ request, url }) => {
  if (!origemOk(request, url)) return resposta({ erro: 'Origem não permitida' }, 403);

  let form: FormData, d: any;
  try {
    form = await request.formData();
    d = JSON.parse(String(form.get('dados')));
  } catch {
    return resposta({ erro: 'Pedido inválido' }, 400);
  }

  const erros: Record<string, string> = {};
  const nome = texto(d.nome, 60);
  const frase = texto(d.frase, 60);
  const descricao = texto(d.descricao, 1200);
  if (!nome) erros.nome = 'Dê um nome ao material';
  if (!frase) erros.frase = 'Escreva uma frase curta';
  if (!descricao) erros.descricao = 'Escreva uma descrição';

  const editando = typeof d.id === 'string' && d.id !== '';
  if (editando && (!SLUG.test(d.id) || !store.existe(matJsonDe(d.id)))) return resposta({ erro: 'Material não encontrado' }, 404);
  const id: string = editando ? d.id : slugLivre(nome, (s) => store.existe(matJsonDe(s)));
  const anterior = editando ? JSON.parse(store.ler(matJsonDe(id))!) : null;

  const nova = form.get('pedra');
  const temNova = nova instanceof File && nova.size > 0;
  if (!temNova && !anterior?.pedra) erros.pedra = 'Escolha a foto da pedra';
  if (Object.keys(erros).length) return resposta({ erro: 'Revise os campos destacados', erros }, 422);

  const lote = store.lote();
  try {
    let pedra: string = anterior?.pedra;
    if (temNova) {
      const arquivo = nomeNovo('pedra');
      lote.gravar(`${matPastaDe(id)}/${arquivo}`, await otimizar(nova as File));
      // a foto antiga sai junto
      store.listar(matPastaDe(id)).forEach((f) => lote.remover(`${matPastaDe(id)}/${f}`));
      pedra = matRefDe(id, arquivo);
    }
    const dados = {
      nome,
      frase,
      pedra,
      descricao,
      pontosFortes: linhas(d.pontosFortes),
      indicadoPara: linhas(d.indicadoPara),
      cuidados: texto(d.cuidados, 1200),
      variedades: linhas(d.variedades),
      ordem: anterior?.ordem ?? listarMateriais().length,
    };
    lote.gravar(matJsonDe(id), JSON.stringify(dados, null, 2) + '\n');
    await lote.confirmar(`Painel: ${editando ? 'atualiza' : 'cria'} material ${nome}`);
    return resposta({ ok: true, id });
  } catch (e) {
    return resposta({ erro: (e as Error).message || 'Não foi possível salvar' }, 400);
  }
};
