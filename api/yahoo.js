const https = require('https');

function request(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      host: 'www.idx.co.id',
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://www.idx.co.id/'
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.setTimeout(9000, () => req.destroy(new Error('timeout')));
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const symbol = (req.query.symbol || 'BBRI').toUpperCase();

  try {
    // Ambil data lengkap semua saham IDX
    const r = await request('/primary/TradingSummary/GetStockSummary');

    // Parse JSON
    let data;
    try {
      data = JSON.parse(r.body);
    } catch (e) {
      // kadang terbungkus { Data : [...] }
      const parsed = JSON.parse(r.body);
      data = parsed.Data || parsed.data || parsed;
    }

    // Cari saham yang diminta (bisa 1 atau lebih)
    const wanted = symbol.split(',');
    const result = Array.isArray(data)
      ? data.filter(s => wanted.includes(String(s.StockCode).toUpperCase()))
      : [];

    if (result.length > 0) {
      res.status(200).json({
        ok: true,
        source: 'IDX',
        symbol: symbol,
        data: result
      });
    } else {
      res.status(200).json({ ok: false, message: 'Saham tidak ditemukan', symbol: symbol });
    }
  } catch (e) {
    res.status(502).json({ error: 'Gagal mengambil data IDX', detail: String(e) });
  }
};
