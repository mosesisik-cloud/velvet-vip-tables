// Local inspection harness for the SevenRooms mirror pilot. Bound to loopback; never deploy this server.
import http from 'node:http';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { SevenroomsMirror } from '../api/sevenrooms-mirror.mjs';
const mirror = new SevenroomsMirror();
const port = Number(process.env.SEVENROOMS_PREVIEW_PORT || 4175);
const host = `127.0.0.1:${port}`;
const token = crypto.randomBytes(24).toString('hex');
const restaurantId = process.env.SEVENROOMS_RESTAURANT || 'curated-AMF-la-sponda';
const html = `<!doctype html><html lang="sv"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Velvet · SevenRooms inspektionspilot</title><style>body{margin:0;background:#101012;color:#eee;font:16px system-ui}header{padding:25px 6vw;border-bottom:1px solid #363130;color:#d5b880;letter-spacing:5px}main{max-width:480px;margin:32px auto;padding:0 20px}h1{font:42px Georgia;margin:10px 0}p{line-height:1.6;color:#c8c3bd}.btn{background:#282629;border:1px solid #776548;color:#eee;border-radius:8px;padding:12px 16px;cursor:pointer}.btn-gold{background:#d5b880;color:#171310}button:disabled{opacity:.5}summary{padding:16px 0;cursor:pointer}.booking-source{display:flex;justify-content:space-between;color:#d5b880;font-size:13px;letter-spacing:1px;text-transform:uppercase}.booking-navigation{display:flex;gap:8px;margin:12px 0}.booking-click{position:absolute;width:18px;height:18px;border:2px solid #d5b880;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none}</style><header>VELVET</header><main><p>INSPEKTIONSPILOT / SEVENROOMS</p><h1>${restaurantId.includes('plenitude') ? 'Plénitude' : 'La Sponda'}</h1><div id="mirror"></div></main><script type="module">import {mountSevenroomsMirror} from '/mirror.js';mountSevenroomsMirror(document.querySelector('#mirror'), async (path,opts)=>{try{const r=await fetch('/api'+path,{...opts,cache:'no-store'});return await r.json()}catch{return null}}, {restaurantId:'${restaurantId}'});</script></html>`;
const server = http.createServer(async (req, res) => {
  const send = (status, data) => {res.writeHead(status, {'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  if (req.headers.host !== host) return send(403,{error:'host'});
  if (req.method === 'GET' && req.url === '/') { res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Set-Cookie':`preview=${token}; HttpOnly; SameSite=Strict; Path=/`}); return res.end(html); }
  if (req.method === 'GET' && req.url === '/mirror.js') {res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8'});return res.end(await fs.readFile(new URL('../js/sevenrooms-mirror.js',import.meta.url)));}
  if (req.headers.origin !== `http://${host}` || !String(req.headers.cookie).split(';').map(x=>x.trim()).includes(`preview=${token}`)) return send(403,{error:'origin'});
  try {
    let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>4096)return send(413,{error:'size'});}
    const body=raw?JSON.parse(raw):{};
    const prefix='/api/sevenrooms-mirror';
    if(req.method==='POST'&&req.url===prefix+'/current')return send(200,mirror.current('local-preview'));
    if(req.method==='POST'&&req.url===prefix)return send(201,await mirror.create('local-preview',body.restaurantId,body.width));
    const match=req.url.match(/^\/api\/sevenrooms-mirror\/([a-f0-9-]{36})(\/action)?$/);
    if(match&&req.method==='POST'&&match[2])return send(200,await mirror.action(match[1],'local-preview',body));
    if(match&&req.method==='DELETE'&&!match[2]){await mirror.remove(match[1],'local-preview');return send(200,{ok:true});}
    send(404,{error:'not_found'});
  } catch(error){send(error.status||502,{error:error.status?error.message:'provider_unavailable'});}
});
server.listen(port,'127.0.0.1',()=>console.log(`Local preview: http://${host}`));
process.on('SIGINT',async()=>{await mirror.close();server.close();});
