import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const root=path.resolve('dist');const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.equal((html.match(/class="scene /g)||[]).length,29,'29 scenes required');
for(const text of ['249','455,6','76,7','2027','2028','14.09','RU000A109PK2','Тёмная','Системная'])assert.ok(html.includes(text),`Missing ${text}`);
for(const match of html.matchAll(/(?:src|href)="(\/invest-day-2026\/[^"#?]+)"/g)){const relative=match[1].replace('/invest-day-2026/','');assert.ok(fs.existsSync(path.join(root,relative)),`Missing asset ${relative}`);}
assert.ok(!/\.msg|mailto:|C:\\Users|\/mnt\/c\/|@parkskazka\.com/.test(html),'Private source material in output');
assert.ok(!/<a[^>]+href="https?:|id="sources"|class="source"/.test(html),'Audience source links must be absent');
const sceneIds=[...html.matchAll(/<section[^>]*class="scene [^"]*"[^>]*id="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(sceneIds).size,29,'Scene IDs must be unique');
for(const id of ['speaker-viktor','industry-location','speaker-ivan','core-product','scale','speaker-natalia','investment','speaker-alexey','discussion'])assert.ok(sceneIds.includes(id));
for(const bad of ['152,3','13,3%','40%','65%','30% повторных','Слабый сезон','миллионов гостей','Python','Знакомство со спикером','Генеральный директор /','Схема выбора гостя','Схема форматов потребления','Как это превращается в продукт'])assert.ok(!html.includes(bad),`Removed claim remains: ${bad}`);
const manifest=[];function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,item.name);if(item.isDirectory())walk(p);else if(item.name!=='manifest.json'){const b=fs.readFileSync(p);manifest.push({path:path.relative(root,p).replaceAll('\\','/'),bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')})}}}walk(root);fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify({format:1,files:manifest},null,2)+'\n');console.log(`Verified 29 scenes and ${manifest.length} files; ${manifest.reduce((sum,f)=>sum+f.bytes,0)} bytes.`);
