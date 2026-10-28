import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('.',import.meta.url));
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
http.createServer(async(req,res)=>{
 try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root)|| !['/index.html','/manifest.webmanifest','/sw.js','/icons/icon.svg','/icons/icon-192.png','/icons/icon-512.png','/src/install.js','/src/local-audio.js','/src/app.js','/src/spotify.js','/src/style.css'].includes(pathname==='/'?'/index.html':pathname)){res.writeHead(404);return res.end('Not found');}
 res.setHeader('Cache-Control','no-cache');res.setHeader('Content-Type',types[path.extname(file)]||'text/plain');res.setHeader('X-Content-Type-Options','nosniff');res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(Number(process.env.PORT)||5173,'0.0.0.0',()=>console.log('SpotiAmp running on port '+(process.env.PORT||5173)));
