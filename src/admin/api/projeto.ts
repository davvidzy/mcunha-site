// Criar / salvar um projeto (formulário com fotos).
import type { APIRoute } from 'astro';
import { store } from '../lib/store';
import {
  AMBIENTES,
  PRIORIDADES,
  SLUG,
  jsonDe,
  nomeNovo,
  origemOk,
  otimizar,
  pastaDe,
  refDe,
  resposta,
  slugLivre,
} from '../lib/projeto';

export const prerender = false;

type ItemGaleria = { src?: string; arquivo?: string; alt?: string };

const texto = (v: unknown, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const arquivoDe = (ref: string) => ref.split('/').pop() || '';

export const POST: APIRoute = async ({ request, url }) => {
  if (!origemOk(request, url)) return resposta({ erro: 'Origem não permitida' }, 403);

  let form: FormData, d: any;
  try {
    form = await request.formData();
    d = JSON.parse(String(form.get('dados')));
  } catch {
    return resposta({ erro: 'Pedido inválido' }, 400);
  }

  // Validação dos campos (mensagens por campo, para mostrar ao lado de cada um)
  const erros: Record<string, string> = {};
  const titulo = texto(d.titulo, 120);
  const materiais = texto(d.materiais, 120);
  const capaAlt = texto(d.capaAlt, 200);
  if (!titulo) erros.titulo = 'Dê um título ao projeto';
  if (!materiais) erros.materiais = 'Informe os materiais usados';
  if (!capaAlt) erros.capaAlt = 'Descreva a foto de capa em uma frase';
  const ambiente = AMBIENTES.includes(d.ambiente) ? d.ambiente : 'Outro';
  const prioridade = PRIORIDADES.includes(d.prioridade) ? d.prioridade : 'normal';

  // Projeto existente ou novo
  const editando = typeof d.id === 'string' && d.id !== '';
  if (editando && (!SLUG.test(d.id) || !store.existe(jsonDe(d.id)))) return resposta({ erro: 'Projeto não encontrado' }, 404);
  const id: string = editando ? d.id : slugLivre(titulo);
  const anterior = editando ? JSON.parse(store.ler(jsonDe(id))!) : null;
  const prefixo = refDe(id, '');
  const daPasta = (ref: unknown): ref is string => typeof ref === 'string' && ref.startsWith(prefixo) && !ref.slice(prefixo.length).includes('/');

  const capaNova = form.get('capa');
  if (!(capaNova instanceof File && capaNova.size) && !daPasta(anterior?.capa)) erros.capa = 'Escolha uma foto de capa';
  if (Object.keys(erros).length) return resposta({ erro: 'Revise os campos destacados', erros }, 422);

  const lote = store.lote();
  try {
    // Capa
    let capa: string = anterior?.capa;
    if (capaNova instanceof File && capaNova.size) {
      const nome = nomeNovo('capa');
      lote.gravar(`${pastaDe(id)}/${nome}`, await otimizar(capaNova));
      capa = refDe(id, nome);
    }

    // Galeria, na ordem enviada
    const itens: ItemGaleria[] = Array.isArray(d.galeria) ? d.galeria.slice(0, 60) : [];
    const galeria: { imagem: string; alt: string }[] = [];
    for (const it of itens) {
      const alt = texto(it.alt, 200);
      if (it.arquivo) {
        const f = form.get(it.arquivo);
        if (!(f instanceof File) || !f.size) continue;
        const nome = nomeNovo('foto');
        lote.gravar(`${pastaDe(id)}/${nome}`, await otimizar(f));
        galeria.push({ imagem: refDe(id, nome), alt });
      } else if (daPasta(it.src)) {
        galeria.push({ imagem: it.src, alt });
      }
    }

    // Remove fotos que saíram do projeto
    const usados = new Set([capa, ...galeria.map((g) => g.imagem)].map(arquivoDe));
    store.listar(pastaDe(id)).forEach((f) => !usados.has(f) && lote.remover(`${pastaDe(id)}/${f}`));

    const dados = {
      titulo,
      materiais,
      ambiente,
      local: texto(d.local, 120),
      capa,
      capaAlt,
      descricao: texto(d.descricao, 6000),
      galeria,
      prioridade,
    };
    lote.gravar(jsonDe(id), JSON.stringify(dados, null, 2) + '\n');
    await lote.confirmar(`Painel: ${editando ? 'atualiza' : 'cria'} ${titulo}`);
    return resposta({ ok: true, id });
  } catch (e) {
    return resposta({ erro: (e as Error).message || 'Não foi possível salvar' }, 400);
  }
};
