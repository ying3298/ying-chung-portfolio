const store = require('./_store');
const OK = ['play', 'menu', 'pick', 'songs', 'silence', 'mic', 'leave'];
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') return res.status(200).json(await store.counts());
    let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b) } catch { b = {} } }
    const f = b && OK.includes(b.b) ? b.b : null;
    if (f) await store.incr('m:' + f);
    return res.status(204).end();
  } catch { return res.status(204).end() }
};
