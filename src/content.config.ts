import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Projetos editados pelo painel (/keystatic). Um arquivo JSON por projeto.
const projetos = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/projetos' }),
  schema: ({ image }) =>
    z.object({
      titulo: z.string(),
      materiais: z.string(),
      ambiente: z.string(),
      local: z.string().optional().default(''),
      capa: image(),
      capaAlt: z.string(),
      descricao: z.string().optional().default(''),
      galeria: z
        .array(z.object({ imagem: image(), alt: z.string().optional().default('') }))
        .optional()
        .default([]),
      prioridade: z.enum(['alta', 'normal', 'baixa']).optional().default('normal'),
    }),
});

export const collections = { projetos };
