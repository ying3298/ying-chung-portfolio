// Streams an Apple Music 30-second preview from our own domain, so the page's audio analyser can read it (CORS).
module.exports = async (req, res) => {
  let u; try { u = new URL(String(req.query.u || '')) } catch { return res.status(400).end() }
  if (u.protocol !== 'https:' || !/(^|\.)(apple\.com|mzstatic\.com)$/.test(u.hostname)) return res.status(400).end();
  try {
    const r = await fetch(u.href);
    if (!r.ok) return res.status(502).end();
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 4e6) return res.status(413).end();
    res.setHeader('Content-Type', r.headers.get('content-type') || 'audio/mp4');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, max-age=86400');
    return res.status(200).send(buf);
  } catch { return res.status(502).end() }
};
