// Protege o painel: sem sessão válida, páginas vão para o login e a API responde 401.
import { defineMiddleware } from 'astro:middleware';
import { COOKIE, sessaoValida } from './admin/lib/auth';

const LIVRE = ['/painel/entrar', '/api/painel/sessao'];

export const onRequest = defineMiddleware((ctx, next) => {
  const { pathname } = ctx.url;
  const doPainel = pathname === '/painel' || pathname.startsWith('/painel/') || pathname.startsWith('/api/painel');
  if (!doPainel || LIVRE.includes(pathname.replace(/\/$/, ''))) return next();
  if (sessaoValida(ctx.cookies.get(COOKIE)?.value)) return next();

  if (pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ erro: 'Sessão expirada. Entre de novo.' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }
  return ctx.redirect(`/painel/entrar?volta=${encodeURIComponent(pathname)}`);
});
