// Typed text → song suggestions (iTunes Search, no key). A pasted Spotify / Apple Music / YouTube link → its title.
const pick = t => ({ title: t.trackName, artist: t.artistName, art: (t.artworkUrl100 || '').replace('100x100', '300x300'), preview: t.previewUrl || '', link: t.trackViewUrl || '' });

async function itunes(term, limit = 6) {
  const r = await fetch('https://itunes.apple.com/search?media=music&entity=song&limit=' + limit + '&term=' + encodeURIComponent(term));
  if (!r.ok) return [];
  const j = await r.json();
  return (j.results || []).map(pick);
}
async function fromLink(u) {
  const h = u.hostname;
  let o = null;
  if (h.endsWith('spotify.com')) o = await (await fetch('https://open.spotify.com/oembed?url=' + encodeURIComponent(u.href))).json().catch(() => null);
  else if (h.endsWith('youtube.com') || h === 'youtu.be') o = await (await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(u.href))).json().catch(() => null);
  else if (h.endsWith('apple.com')) {
    const id = u.searchParams.get('i') || (u.pathname.match(/\/(\d+)(?:\?|$)/) || [])[1];
    if (id) { const j = await (await fetch('https://itunes.apple.com/lookup?id=' + id)).json().catch(() => null); const t = j && j.results && j.results.find(x => x.trackName); if (t) return [{ ...pick(t), link: u.href }]; }
  }
  if (!o || !o.title) return [];
  // oEmbed titles are loose ("Song", "Artist - Song (Official Video)"); look them up to get artist + preview
  const clean = o.title.replace(/\((official|lyric|audio|music)[^)]*\)|\[[^\]]*\]/gi, '').trim();
  const hits = await itunes(clean + ' ' + (o.author_name && !/topic|vevo/i.test(o.author_name) ? o.author_name : ''), 3);
  return hits.length ? hits.map(x => ({ ...x, link: u.href })) : [{ title: clean, artist: o.author_name || '', art: o.thumbnail_url || '', preview: '', link: u.href }];
}

module.exports = async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 300);
  if (q.length < 2) return res.status(200).json({ results: [] });
  try {
    let u = null; try { u = new URL(q) } catch {}
    const results = u && /^https?:$/.test(u.protocol) ? await fromLink(u) : await itunes(q);
    res.setHeader('Cache-Control', 's-maxage=3600');
    return res.status(200).json({ results });
  } catch (e) { return res.status(200).json({ results: [] }); }
};
