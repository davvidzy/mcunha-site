// Onde o painel grava os arquivos do site.
// Prévia: direto no disco (local). Na publicação, uma implementação "github" com a mesma
// interface transforma cada lote em um único commit, e o GitHub Actions publica o site.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, normalize, sep } from 'node:path';

const ROOT = process.cwd();
// Só estas pastas podem ser escritas pelo painel
const PERMITIDO = ['src/content/', 'src/assets/projetos/'];

function caminho(rel: string) {
  const limpo = normalize(rel).split(sep).join('/');
  if (limpo.includes('..') || !PERMITIDO.some((p) => limpo.startsWith(p))) {
    throw new Error(`Caminho não permitido: ${rel}`);
  }
  return join(ROOT, limpo);
}

export interface Lote {
  gravar(rel: string, conteudo: string | Buffer): void;
  remover(rel: string): void;
  confirmar(mensagem: string): Promise<void>;
}

export const store = {
  ler(rel: string): string | null {
    const f = caminho(rel);
    return existsSync(f) ? readFileSync(f, 'utf8') : null;
  },
  existe(rel: string) {
    return existsSync(caminho(rel));
  },
  listar(relDir: string): string[] {
    const d = caminho(relDir.endsWith('/') ? relDir : relDir + '/');
    return existsSync(d) ? readdirSync(d) : [];
  },
  /** Agrupa gravações e remoções para aplicar de uma vez */
  lote(): Lote {
    const ops: (() => void)[] = [];
    return {
      gravar(rel, conteudo) {
        const f = caminho(rel);
        ops.push(() => {
          mkdirSync(dirname(f), { recursive: true });
          writeFileSync(f, conteudo);
        });
      },
      remover(rel) {
        const f = caminho(rel);
        ops.push(() => rmSync(f, { force: true, recursive: true }));
      },
      async confirmar() {
        ops.forEach((op) => op());
      },
    };
  },
};
