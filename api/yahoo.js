const https = require('https');

// Host cadangan
const HOSTS = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com'];
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function request(host, path, raw) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      host: host,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': UA,
        'Accept': raw ? 'application/json, text/plain, */*' : '*/*',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(new Error('timeout')); });
    req.end();
  });
}

// Ambil crumb dari endpoint konsumsi
async function getCrumb() {
  try {
    const r = await request(HOSTS[0], '/v1/test/getcrumb');
    return r.body && r.body.length < 200 ? r.body : '';
  } catch (e) { return ''; }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const symbol = (req.query.symbol || 'BBRI.JK').toUpperCase();
  const type = req.query.type || 'quote';

  try {
    let result = null;

    if (type === 'price') {
      // Coba semua host sampai ada yang berhasil (v8 chart)
      for (const host of HOSTS) {
        result = await request(host, '/v8/finance/chart/' + symbol + '?interval=1d&range=1d', true);
        if (result.status === 200) break;
      }
      res.status(200).send(result.body);
    } else {
      // Coba v7 quote + crumb
      const crumb = await getCrumb();
      const crumbPart = crumb ? '&crumb=' + encodeURIComponent(crumb) : '';
      for (const host of HOSTS) {
        result = await request(host, '/v7/finance/quote?symbols=' + symbol + crumbPart, true);
        if (result.status === 200) break;
      }
      res.status(200).send(result.body);
    }
  } catch (e) {
    res.status(502).json({ error: 'Gagal mengambil data', detail: String(e) });
  }
};
