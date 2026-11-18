import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- Smooth scroll ---------------- */
export let lenis: Lenis | null = null;

if (!reduce) {
  lenis = new Lenis({ lerp: 0.1, anchors: { offset: -80 } });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  (window as any).__lenis = lenis;
}

/* ---------------- Split de texto em palavras mascaradas ---------------- */
function splitWords(el: HTMLElement) {
  if (el.dataset.splitDone) return el.querySelectorAll<HTMLElement>('.w-in');
  const walk = (node: Node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        (child.textContent || '').split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.append(document.createTextNode(part));
          } else {
            const outer = document.createElement('span');
            outer.className = 'w-out';
            outer.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:top;padding:0.18em 0 0.08em;margin:-0.18em 0 -0.08em';
            const inner = document.createElement('span');
            inner.className = 'w-in';
            inner.style.display = 'inline-block';
            inner.textContent = part;
            outer.append(inner);
            frag.append(outer);
          }
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && (child as Element).tagName !== 'BR') {
        walk(child);
      }
    });
  };
  walk(el);
  el.dataset.splitDone = '1';
  return el.querySelectorAll<HTMLElement>('.w-in');
}

/* ---------------- Animações ---------------- */
if (!reduce) {
  // Hero: entrada orquestrada
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (hero) {
    const title = hero.querySelector<HTMLElement>('[data-hero-title]')!;
    const words = splitWords(title);
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.1 });
    tl.set(title, { opacity: 1 })
      .from(words, { yPercent: 110, duration: 1.3, stagger: 0.07 })
      .to('[data-hero-fade]', { opacity: 1, y: 0, duration: 1.1, stagger: 0.1 }, '-=0.9')
      .fromTo(
        '[data-hero-main]',
        { clipPath: 'inset(100% 0% 0% 0% round 25px)', scale: 1.08 },
        { clipPath: 'inset(0% 0% 0% 0% round 25px)', scale: 1, opacity: 1, duration: 1.6 },
        0.15,
      )
      .fromTo(
        '[data-hero-small]',
        { opacity: 0, y: 60, rotate: -6 },
        { opacity: 1, y: 0, rotate: 2.7, duration: 1.4 },
        0.7,
      );
    gsap.set('[data-hero-fade]', { y: 24 });

    // Parallax suave das imagens ao rolar
    gsap.to('[data-hero-main-img]', {
      yPercent: 8,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    });
  }

  // Reveals genéricos
  gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
    const type = el.dataset.reveal;
    const delay = parseFloat(el.dataset.delay || '0');
    const st = { trigger: el, start: 'top 88%', once: true };

    if (type === 'split') {
      const words = splitWords(el);
      gsap.set(el, { opacity: 1 });
      gsap.from(words, { yPercent: 110, duration: 1.1, stagger: 0.05, ease: 'expo.out', delay, scrollTrigger: st });
    } else if (type === 'stagger') {
      gsap.set(el, { opacity: 1 });
      gsap.from(el.children, {
        opacity: 0,
        y: 50,
        duration: 1.1,
        stagger: 0.12,
        ease: 'expo.out',
        delay,
        scrollTrigger: st,
      });
    } else if (type === 'clip') {
      gsap.fromTo(
        el,
        { opacity: 1, clipPath: 'inset(12% 12% 12% 12% round 25px)' },
        { clipPath: 'inset(0% 0% 0% 0% round 25px)', duration: 1.4, ease: 'expo.out', delay, scrollTrigger: st },
      );
    } else {
      gsap.fromTo(
        el,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', delay, scrollTrigger: st },
      );
    }
  });

  // Parallax interno de imagens
  gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
    const amount = parseFloat(el.dataset.parallax || '10');
    gsap.fromTo(
      el,
      { yPercent: -amount },
      {
        yPercent: amount,
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });

  // Elementos decorativos (monograma) flutuando
  gsap.utils.toArray<HTMLElement>('[data-float]').forEach((el) => {
    gsap.to(el, {
      y: parseFloat(el.dataset.float || '-80'),
      rotate: '+=6',
      ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: 1 },
    });
  });

  // Contadores
  gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
    const target = parseInt(el.dataset.count || '0', 10);
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: 2,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 95%', once: true },
      onUpdate: () => (el.textContent = Math.round(obj.v).toString()),
    });
  });

  // Garantias: cartões empilhados (só desktop). O card que chega fica intacto;
  // apenas o de trás encolhe e recebe um véu escuro (opacity, sem filter, para não piscar).
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1024px)', () => {
    const cards = gsap.utils.toArray<HTMLElement>('[data-stack-card]');
    cards.forEach((card, i) => {
      const next = cards[i + 1];
      if (!next) return;
      // Termina exatamente quando o próximo cartão encosta no topo fixo
      const st = {
        trigger: next,
        start: 'top bottom',
        end: () => `top ${parseFloat(getComputedStyle(next).top) || 0}px`,
        scrub: true,
        invalidateOnRefresh: true,
      };
      gsap.to(card.querySelector('[data-stack-inner]'), { scale: 0.94, ease: 'none', scrollTrigger: st });
      gsap.to(card.querySelector('[data-stack-veil]'), { opacity: 0.55, ease: 'none', scrollTrigger: st });
    });
  });

  // Palavra gigante do rodapé
  const big = document.querySelector<HTMLElement>('[data-bigword]');
  if (big) {
    const letters = big.querySelectorAll('span');
    gsap.from(letters, {
      yPercent: 100,
      ease: 'expo.out',
      duration: 1.4,
      stagger: 0.06,
      scrollTrigger: { trigger: big, start: 'top 95%', once: true },
    });
  }
} else {
  document.querySelectorAll<HTMLElement>('[data-hero-fade],[data-hero-main],[data-hero-small]').forEach((el) => {
    el.style.opacity = '1';
  });
}

// Recalcula após imagens/fontes carregarem
window.addEventListener('load', () => ScrollTrigger.refresh());
document.fonts?.ready.then(() => ScrollTrigger.refresh());
