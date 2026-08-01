const https = require('https');
const YAHOO_HOST = 'query1.finance.yahoo.com';
function doRequest(path){return new Promise((resolve,reject)=>{const r=https.request({host:YAHOO_HOST,path,method:'GET',headers:{'User-Agent':'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)','Accept':'application/json'}},res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>resolve(d));});r.on('error',reject);r.end();});}
module.exports = async (req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
  res.setHeader('Content-Type','application/json');
  if(req.method==='OPTIONS'){res.status(200).end();return;}
  const symbol=(req.query.symbol||'BBRI.JK').toUpperCase();
  const type=req.query.type||'quote';
  try{
    if(type==='price'){const r=await doRequest('/v8/finance/chart/'+symbol+'?interval=1d&range=1d');res.status(200).send(r);}
    else{const r=await doRequest('/v7/finance/quote?symbols='+symbol);res.status(200).send(r);}
  }catch(e){res.status(502).json({error:'Gagal mengambil data',detail:String(e)});}
};
