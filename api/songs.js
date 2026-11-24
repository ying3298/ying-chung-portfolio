const store = require('./_store');
const clip = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n);
const okUrl = (u, hosts) => { try { const x = new URL(u); return x.protocol === 'https:' && hosts.some(h => x.hostname === h || x.hostname.endsWith('.' + h)) ? x.href : '' } catch { return '' } };

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') return res.status(200).json({ persistent: store.persistent, songs: await store.list() });
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const title = clip(b.title, 120), artist = clip(b.artist, 120);
    if (!title) return res.status(400).json({ error: 'title' });
    const song = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title, artist,
      from: clip(b.from, 28),
      via: ['type', 'link', 'listen'].includes(b.via) ? b.via : 'type',
      art: okUrl(b.art, ['mzstatic.com', 'scdn.co', 'spotifycdn.com']),
      preview: okUrl(b.preview, ['apple.com', 'mzstatic.com']),
      link: okUrl(b.link, ['apple.com', 'spotify.com', 'youtube.com', 'youtu.be', 'soundcloud.com']),
      x: +(0.12 + Math.random() * 0.76).toFixed(3),
      y: +(0.18 + Math.random() * 0.64).toFixed(3),
      t: Date.now()
    };
    await store.add(song);
    return res.status(200).json({ persistent: store.persistent, song });
  } catch (e) { return res.status(500).json({ error: 'server' }); }
};
