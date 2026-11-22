// Entrar (POST com o PIN) e sair (DELETE) do painel.
import type { APIRoute } from 'astro';
import { COOKIE, bloqueio, configurado, limparErros, novaSessao, pinConfere, registrarErro } from '../lib/auth';
import { origemOk, resposta } from '../lib/projeto';

export const prerender = false;

export const POST: APIRoute = async ({ request, url, cookies, clientAddress }) => {
  if (!origemOk(request, url)) return resposta({ erro: 'Origem não permitida' }, 403);
  if (!configurado()) return resposta({ erro: 'Painel sem PIN configurado. Rode npm run painel:pin.' }, 503);

  const ip = clientAddress || 'local';
  const min = bloqueio(ip);
  if (min) return resposta({ erro: `Muitas tentativas. Tente de novo em ${min} min.` }, 429);

  const { pin } = await request.json().catch(() => ({}));
  if (typeof pin !== 'string' || !/^\d{6}$/.test(pin) || !pinConfere(pin)) {
    const restam = registrarErro(ip);
    return resposta(
      { erro: restam ? `PIN incorreto. ${restam === 1 ? 'Resta 1 tentativa' : `Restam ${restam} tentativas`}.` : 'Muitas tentativas. Tente de novo em 15 min.' },
      restam ? 401 : 429,
    );
  }

  limparErros(ip);
  const s = novaSessao();
  cookies.set(COOKIE, s.valor, { path: '/', httpOnly: true, sameSite: 'strict', secure: import.meta.env.PROD, maxAge: s.maxAge });
  return resposta({ ok: true });
};

export const DELETE: APIRoute = async ({ request, url, cookies }) => {
  if (!origemOk(request, url)) return resposta({ erro: 'Origem não permitida' }, 403);
  cookies.delete(COOKIE, { path: '/' });
  return resposta({ ok: true });
};
