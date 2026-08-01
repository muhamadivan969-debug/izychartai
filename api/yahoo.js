const https = require('https');

const YAHOO_HOST = 'query1.finance.yahoo.com';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const ACCEPT = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9';
const ACCEPT_LANG = 'en-US,en;q=0.9';
const COOKIE = 'A3=d=AQABBJR7nGgCEBUZ9o4pP4e0xSJ7BwN2j2EFEgEBAQHhbo0V3F1xZxYV3gDv2WzC97JzY0U2jYzzyykYqNqbJP2bNn4H9lPRCC_kJQHBYyQYkLhnVdMCnQ7NUV6BCN5HUJ1Qx_l3VBO0SfXONo0NsR1yTU3sO3OjSlxNRB%3d%3d';

function doRequest(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      host: YAHOO_HOST,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': ACCEPT,
        'Accept-Language': ACCEPT_LANG,
        'Cookie': COOKIE,
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    });
    req.on('error', reject);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const symbol = (req.query.symbol || 'BBRI.JK').toUpperCase();
  const type = req.query.type || 'quote';

  try {
    if (type === 'price') {
      const r = await doRequest('/v8/finance/chart/' + symbol + '?interval=1d&range=1d');
      res.status(200).send(r);
    } else {
      const r = await doRequest('/v7/finance/quote?symbols=' + symbol + '&crumb=');
      res.status(200).send(r);
    }
  } catch (e) {
    res.status(502).json({ error: 'Gagal mengambil data', detail: String(e) });
  }
};
