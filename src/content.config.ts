import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Projetos editados pelo painel (/painel). Um arquivo JSON por projeto.
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

// Materiais: uma página por pedra, editada pelo painel. Um JSON por material.
const materiais = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/materiais' }),
  schema: ({ image }) =>
    z.object({
      nome: z.string(),
      frase: z.string(),
      pedra: image(),
      descricao: z.string(),
      pontosFortes: z.array(z.string()).optional().default([]),
      indicadoPara: z.array(z.string()).optional().default([]),
      cuidados: z.string().optional().default(''),
      variedades: z.array(z.string()).optional().default([]),
      ordem: z.number().optional().default(0),
    }),
});

export const collections = { projetos, materiais };
