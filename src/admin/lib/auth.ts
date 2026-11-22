// Acesso ao painel: PIN de 6 dígitos + sessão em cookie assinado.
// O PIN fica só como hash (scrypt) na variável PAINEL_PIN_HASH; gere com `npm run painel:pin`.
import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto';

const env = (k: string): string => process.env[k] ?? (import.meta.env as any)[k] ?? '';
export const COOKIE = 'mc_painel';
const DIAS = 30;

export const configurado = () => Boolean(env('PAINEL_PIN_HASH') && env('PAINEL_SEGREDO'));

export function pinConfere(pin: string) {
  const [alg, sal, hash] = env('PAINEL_PIN_HASH').split(':');
  if (alg !== 'scrypt' || !sal || !hash) return false;
  const esperado = Buffer.from(hash, 'hex');
  const calculado = scryptSync(pin, sal, esperado.length);
  return timingSafeEqual(esperado, calculado);
}

// A assinatura inclui o hash do PIN: trocar o PIN derruba todas as sessões abertas
const assinar = (exp: string) => createHmac('sha256', env('PAINEL_SEGREDO')).update(`${exp}.${env('PAINEL_PIN_HASH')}`).digest('base64url');

export function novaSessao() {
  const exp = String(Date.now() + DIAS * 864e5);
  return { valor: `${exp}.${assinar(exp)}`, maxAge: DIAS * 86400 };
}

export function sessaoValida(valor?: string) {
  if (!valor || !configurado()) return false;
  const [exp, sig] = valor.split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(assinar(exp));
  return a.length === b.length && timingSafeEqual(a, b);
}

// Limite de tentativas. PIN de 6 dígitos = 1 milhão de combinações; com estes limites,
// adivinhar levaria décadas.
// shortcut: contadores em memória, zeram se o servidor reiniciar; trocar por arquivo/BD se o painel rodar em várias instâncias.
const POR_IP = 5; // erros antes de bloquear aquele aparelho
const BLOQUEIO_MS = 15 * 60e3;
const GLOBAL_DIA = 50; // erros somando todos os aparelhos, por dia
const tentativas = new Map<string, { erros: number; ate: number }>();
let global = { erros: 0, dia: new Date().toDateString() };

export function bloqueio(ip: string): number {
  if (global.dia !== new Date().toDateString()) global = { erros: 0, dia: new Date().toDateString() };
  if (global.erros >= GLOBAL_DIA) return 60; // minutos
  const t = tentativas.get(ip);
  return t && t.ate > Date.now() ? Math.ceil((t.ate - Date.now()) / 60e3) : 0;
}

/** Registra um erro e diz quantas tentativas restam para este aparelho */
export function registrarErro(ip: string): number {
  global.erros++;
  const t = tentativas.get(ip) ?? { erros: 0, ate: 0 };
  t.erros++;
  if (t.erros >= POR_IP) Object.assign(t, { erros: 0, ate: Date.now() + BLOQUEIO_MS });
  tentativas.set(ip, t);
  return t.ate > Date.now() ? 0 : POR_IP - t.erros;
}

export const limparErros = (ip: string) => tentativas.delete(ip);
