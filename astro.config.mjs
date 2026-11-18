// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Painel MCunha (/painel): na prévia só roda no `astro dev`, salvando direto nos arquivos.
// O build do site continua 100% estático e não inclui o painel.
const isDev = process.argv.includes('dev');

/** @type {import('astro').AstroIntegration} */
const painel = {
  name: 'mcunha-painel',
  hooks: {
    'astro:config:setup': ({ injectRoute }) => {
      const rota = (pattern, entrypoint) => injectRoute({ pattern, entrypoint, prerender: false });
      rota('/painel', './src/admin/pages/index.astro');
      rota('/painel/novo', './src/admin/pages/editar.astro');
      rota('/painel/projetos/[id]', './src/admin/pages/editar.astro');
      rota('/api/painel', './src/admin/api/acoes.ts');
      rota('/api/painel/projeto', './src/admin/api/projeto.ts');
      rota('/api/painel/foto', './src/admin/api/foto.ts');
    },
  },
};

// https://astro.build/config
export default defineConfig({
  site: 'https://mcunhamarmoraria.com.br',
  integrations: isDev ? [painel] : [],
  vite: {
    plugins: [tailwindcss()],
  },
  image: {
    responsiveStyles: true,
  },
});
