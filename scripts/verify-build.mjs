import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const root=path.resolve('dist');const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.equal((html.match(/class="scene /g)||[]).length,12,'12 scenes required');
for(const text of ['249','455,6','76,7','2027','2030','п.п.','Тёмная','Системная'])assert.ok(html.includes(text),`Missing ${text}`);
for(const match of html.matchAll(/(?:src|href)="(\/invest-day-2026\/[^"#?]+)"/g)){const relative=match[1].replace('/invest-day-2026/','');assert.ok(fs.existsSync(path.join(root,relative)),`Missing asset ${relative}`);}
assert.ok(!/\.msg|mailto:|C:\\Users|\/mnt\/c\/|@parkskazka\.com/.test(html),'Private source material in output');
assert.ok(!/<a[^>]+href="https?:|id="sources"|class="source"/.test(html),'Audience source links must be absent');
const manifest=[];function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,item.name);if(item.isDirectory())walk(p);else{const b=fs.readFileSync(p);manifest.push({path:path.relative(root,p).replaceAll('\\','/'),bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')})}}}walk(root);fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify({format:1,files:manifest},null,2)+'\n');console.log(`Verified 12 scenes and ${manifest.length} files; ${manifest.reduce((sum,f)=>sum+f.bytes,0)} bytes.`);
