const https = require('https');

function requestData(host, path) {
  return new Promise((resolve) => {
    const r = https.request({ host, path, method: 'GET', headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json'
    }}, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    r.on('error', e => resolve({ status: 0, body: String(e) }));
    r.setTimeout(8000, () => r.destroy(new Error('timeout')));
    r.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const sym = (req.query.symbol || 'BBRI').toUpperCase().replace('.JK', '');
  const code = sym + '.JK';

  try {
    const r1 = await requestData('api.stockbit.com', '/v1/trade/price/' + code);
    if (r1.body && !r1.body.startsWith('<')) {
      try {
        const raw = JSON.parse(r1.body);
        const item = raw && (raw.data || raw);
        if (item && (item.Close || item.Last)) {
          return res.status(200).json({
            ok: true, source: 'STOCKBIT', symbol: code,
            data: {
              StockCode: sym, Price: item.Close || item.Last,
              Open: item.Open, High: item.High, Low: item.Low,
              Change: item.Change || item.Pct || 0, Volume: item.Volume
            }
          });
        }
      } catch (e) {}
    }

    const r2 = await requestData('www.idx.co.id', '/primary/TradingSummary/GetStockSummary');
    if (r2.body && !r2.body.startsWith('<')) {
      try {
        const j = JSON.parse(r2.body);
        const arr = j.Data || j.data || j;
        if (Array.isArray(arr)) {
          const hit = arr.find(s => String(s.StockCode).toUpperCase() === sym);
          if (hit) return res.status(200).json({ ok: true, source: 'IDX', symbol: sym, data: [hit] });
        }
      } catch (e) {}
    }

    res.status(200).json({ ok: false, message: 'Data tidak ditemukan', symbol: code });
  } catch (e) {
    res.status(502).json({ error: String(e), source: 'stockbit+idx' });
  }
};
