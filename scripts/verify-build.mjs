import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const root=path.resolve('dist');const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.equal((html.match(/class="scene /g)||[]).length,30,'30 scenes required');
const meta=new Map([...html.matchAll(/<meta (?:property|name)="([^"]+)" content="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const shareUrl='https://marketing.parkskazka.ru/invest-day-2026/';
const shareImage=shareUrl+'assets/invest-day-2026-og-v1.jpg';
for(const [key,value] of Object.entries({'og:url':shareUrl,'og:type':'website','og:locale':'ru_RU','og:image':shareImage,'og:image:secure_url':shareImage,'og:image:type':'image/jpeg','og:image:width':'1200','og:image:height':'630','twitter:card':'summary_large_image','twitter:image':shareImage}))assert.equal(meta.get(key),value,`Invalid social metadata: ${key}`);
for(const key of ['og:title','og:description','og:site_name','og:image:alt','twitter:title','twitter:description','twitter:image:alt'])assert.ok(meta.get(key),`Missing social metadata: ${key}`);
assert.equal(meta.get('og:title'),meta.get('twitter:title'));
assert.ok(fs.statSync(path.join(root,'assets/invest-day-2026-og-v1.jpg')).size<600000,'Social cover must stay lightweight');

for(const text of ['249','455,6','76,7','2027','2028','14.09','RU000A109PK2','Тёмная','Системная'])assert.ok(html.includes(text),`Missing ${text}`);
for(const match of html.matchAll(/(?:src|href)="(\/invest-day-2026\/[^"#?]+)"/g)){const relative=match[1].replace('/invest-day-2026/','');assert.ok(fs.existsSync(path.join(root,relative)),`Missing asset ${relative}`);}
assert.ok(!/\.msg|mailto:|C:\\Users|\/mnt\/c\/|@parkskazka\.com/.test(html),'Private source material in output');
assert.ok(!/id="sources"|class="source"/.test(html),'Audience source links must be absent');
for(const [,href] of html.matchAll(/<a[^>]+href="(https?:[^"]+)"/g))assert.equal(href,'https://t.me/skazka_investday2026_bot?start=invest2026_stage','Only the audience bot link is allowed');
const sceneIds=[...html.matchAll(/<section[^>]*class="scene [^"]*"[^>]*id="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(sceneIds).size,30,'Scene IDs must be unique');
for(const id of ['speaker-viktor','industry-location','speaker-ivan','core-product','scale','speaker-natalia','investment','speaker-alexey','discussion','questions'])assert.ok(sceneIds.includes(id));
for(const bad of ['152,3','13,3%','40%','65%','30% повторных','Слабый сезон','миллионов гостей','Python','Знакомство со спикером','Генеральный директор /','Схема выбора гостя','Схема форматов потребления','Как это превращается в продукт'])assert.ok(!html.includes(bad),`Removed claim remains: ${bad}`);
const manifest=[];function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,item.name);if(item.isDirectory())walk(p);else if(item.name!=='manifest.json'){const b=fs.readFileSync(p);manifest.push({path:path.relative(root,p).replaceAll('\\','/'),bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')})}}}walk(root);fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify({format:1,files:manifest},null,2)+'\n');console.log(`Verified 30 scenes and ${manifest.length} files; ${manifest.reduce((sum,f)=>sum+f.bytes,0)} bytes.`);
