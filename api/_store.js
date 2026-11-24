// Shared playlist storage. Uses Upstash Redis (Vercel Marketplace) when its env vars exist;
// otherwise keeps songs in memory, which resets whenever the function cold-starts.
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = 'ripple:songs';
const mem = globalThis.__rippleMem || (globalThis.__rippleMem = []);

async function redis(cmd) {
  const r = await fetch(URL_, { method: 'POST', headers: { Authorization: `Bearer ${TOK}` }, body: JSON.stringify(cmd) });
  if (!r.ok) throw new Error('redis ' + r.status);
  return (await r.json()).result;
}
exports.persistent = !!(URL_ && TOK);
exports.list = async () => {
  if (!exports.persistent) return mem.slice(0, 300);
  const rows = await redis(['LRANGE', KEY, '0', '299']);
  return rows.map(s => { try { return JSON.parse(s) } catch { return null } }).filter(Boolean);
};
exports.add = async (song) => {
  if (!exports.persistent) { mem.unshift(song); mem.length = Math.min(mem.length, 300); return; }
  await redis(['LPUSH', KEY, JSON.stringify(song)]);
  await redis(['LTRIM', KEY, '0', '499']);
};
