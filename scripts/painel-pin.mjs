// Gera (ou troca) o PIN do painel e grava o hash em .env.
// Uso: npm run painel:pin            -> sorteia um PIN de 6 dígitos
//      npm run painel:pin -- 482913  -> usa o PIN informado
import { randomBytes, randomInt, scryptSync } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const pin = process.argv[2] ?? String(randomInt(0, 1e6)).padStart(6, '0');
if (!/^\d{6}$/.test(pin)) {
  console.error('O PIN precisa ter exatamente 6 números.');
  process.exit(1);
}

const sal = randomBytes(16).toString('hex');
const hash = `scrypt:${sal}:${scryptSync(pin, sal, 32).toString('hex')}`; // sem "$": o .env expandiria como variável

let env = existsSync('.env') ? readFileSync('.env', 'utf8') : '';
const definir = (k, v) => {
  const linha = `${k}=${v}`;
  env = new RegExp(`^${k}=.*$`, 'm').test(env) ? env.replace(new RegExp(`^${k}=.*$`, 'm'), linha) : `${env.trimEnd()}\n${linha}\n`.trimStart();
};
definir('PAINEL_PIN_HASH', hash);
// O segredo das sessões só é criado uma vez (trocar o PIN já derruba as sessões abertas)
if (!/^PAINEL_SEGREDO=.+$/m.test(env)) definir('PAINEL_SEGREDO', randomBytes(32).toString('base64url'));
writeFileSync('.env', env);

console.log(`PIN do painel: ${pin}`);
console.log('Gravado em .env (fora do Git). Reinicie o servidor de desenvolvimento para valer.');
console.log('Na publicação, copie PAINEL_PIN_HASH e PAINEL_SEGREDO para as variáveis de ambiente da Hostinger.');
