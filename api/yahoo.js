const https = require('https');

const YAHOO_HOST = 'query1.finance.yahoo.com';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const COOKIE = 'A3=d=AQABBJR7nGgCEBUZ9o4pP4e0xSJ7BwN2j2EFEgEBAQHhbo0V3F1xZxYV3gDv2WzC97JzY0U2jYzzyykYqNqbJP2bNn4H9lPRCC_kJQHBYyQYkLhnVdMCnQ7NUV6BCN5HUJ1Qx_l3VBO0SfXONo0NsR1yTU3sO3OjSlxNRB%3d%3d; gpp=DBAA; guce_consent=default';

function doRequest(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      host: YAHOO_HOST,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': COOKIE
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const symbol = (req.query.symbol || 'BBRI.JK').toUpperCase();
  const type = req.query.type || 'quote';

  try {
    if (type === 'price') {
      const result = await doRequest('/v8/finance/chart/' + symbol + '?interval=1d&range=1d');
      res.status(200).send(result.body);
    } else {
      const result = await doRequest('/v7/finance/quote?symbols=' + symbol);
      res.status(200).send(result.body);
    }
  } catch (e) {
    res.status(502).json({ error: 'Gagal mengambil data', detail: String(e) });
  }
};
