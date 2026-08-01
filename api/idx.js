const https = require('https');

function requestData(host, path) {
  return new Promise((resolve) => {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.idx.co.id/',
      'Origin': 'https://www.idx.co.id',
      'Connection': 'keep-alive'
    };
    const r = https.request({ host, path, method: 'GET', headers }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    r.on('error', e => resolve({ status: 0, body: String(e) }));
    r.setTimeout(9000, () => r.destroy(new Error('timeout')));
    r.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const sym = String(req.query.symbol || 'BBRI').toUpperCase().replace('.JK', '');

  try {
    const r = await requestData('www.idx.co.id', '/primary/TradingSummary/GetStockSummary');
    let parsed;
    try { parsed = JSON.parse(r.body); } catch (e) {
      return res.status(200).json({ ok: false, directHTML: r.body.startsWith('<'), body: r.body.slice(0, 200) });
    }
    const arr = parsed.Data || parsed.data || parsed;
    if (Array.isArray(arr)) {
      const hit = arr.find(s => String(s.StockCode).toUpperCase() === sym);
      if (hit) return res.status(200).json({ ok: true, source: 'IDX', symbol: sym, data: [hit] });
    }
    res.status(200).json({ ok: false, message: 'Tidak ditemukan di hasil IDX', symbol: sym });
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
};
