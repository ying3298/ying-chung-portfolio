// Audio clip (base64) → song, via AudD. Needs AUDD_API_TOKEN in Vercel env vars.
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  const token = process.env.AUDD_API_TOKEN;
  if (!token) return res.status(200).json({ status: 'off' });
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const buf = Buffer.from(String(b.audio || ''), 'base64');
    if (buf.length < 2000 || buf.length > 3e6) return res.status(400).json({ status: 'bad' });
    const fd = new FormData();
    fd.append('api_token', token);
    fd.append('return', 'apple_music,spotify');
    fd.append('file', new Blob([buf], { type: String(b.type || 'audio/webm') }), 'clip');
    const j = await (await fetch('https://api.audd.io/', { method: 'POST', body: fd })).json();
    const r = j && j.result;
    if (!r) return res.status(200).json({ status: 'none' });
    const am = r.apple_music || {}, sp = r.spotify || {};
    return res.status(200).json({ status: 'match', song: {
      title: r.title, artist: r.artist,
      art: (am.artwork && am.artwork.url ? am.artwork.url.replace('{w}', '300').replace('{h}', '300') : (sp.album && sp.album.images && sp.album.images[0] ? sp.album.images[0].url : '')),
      preview: am.previews && am.previews[0] ? am.previews[0].url : '',
      link: am.url || (sp.external_urls && sp.external_urls.spotify) || r.song_link || ''
    } });
  } catch (e) { return res.status(200).json({ status: 'error' }); }
};
