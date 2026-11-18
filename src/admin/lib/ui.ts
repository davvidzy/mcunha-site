// Utilitários de interface do painel (lado do navegador)
let timer: number | undefined;

export function toast(msg: string, kind: 'ok' | 'erro' = 'ok') {
  const el = document.querySelector<HTMLElement>('[data-toast]');
  if (!el) return;
  el.textContent = msg;
  el.dataset.kind = kind;
  el.setAttribute('data-show', '');
  clearTimeout(timer);
  timer = window.setTimeout(() => el.removeAttribute('data-show'), kind === 'erro' ? 5000 : 2400);
}

export async function acao(body: object): Promise<boolean> {
  try {
    const r = await fetch('/api/painel', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.erro || 'Não foi possível salvar');
    return true;
  } catch (e) {
    toast(`${(e as Error).message}. Tente de novo.`, 'erro');
    return false;
  }
}

/** Abre um diálogo de confirmação e resolve com a escolha */
export function confirmar(dialog: HTMLDialogElement): Promise<boolean> {
  return new Promise((resolve) => {
    dialog.showModal();
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'sim'), { once: true });
  });
}
