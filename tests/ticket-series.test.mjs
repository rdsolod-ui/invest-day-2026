import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=n=>JSON.parse(fs.readFileSync(new URL('../src/data/'+n,import.meta.url),'utf8'));
const season=read('admission-sales.json'),night=read('night-sales.json'),events=read('season-events.json');
const validate=series=>{
 const days=(Date.parse(series.end)-Date.parse(series.start))/86400000+1;
 assert.equal(series.daily.length,days);
 for(let i=0;i<days;i++){
  const d=series.daily[i];assert.equal(d.date,new Date(Date.parse(series.start)+i*86400000).toISOString().slice(0,10));
  assert.equal(d.tickets_sold-d.returned,d.net_tickets);assert.ok(d.tickets_sold>=0);
 }
 for(const key of ['tickets_sold','returned','net_tickets'])assert.ok(Math.abs(series.daily.reduce((s,d)=>s+d[key],0)-series.total[key])<.01,key);
};
test('daily admission series cover contiguous seasons and reconcile to interval totals',()=>season.seasons.forEach(validate));
test('growth compares matching dates, never the full prior season against the partial current season',()=>{
 const old=season.seasons[0].daily.filter(d=>d.date.slice(5)<=season.cutoff.slice(5)).reduce((s,d)=>s+d.tickets_sold,0);
 assert.equal(season.comparison.previous,old);assert.equal(season.comparison.current,season.seasons[1].total.tickets_sold);
 assert.ok(Math.abs(season.comparison.growthPercent-(season.comparison.current/old-1)*100)<1e-10);
 assert.equal(season.seasons[1].end,season.cutoff);assert.equal(season.seasons[0].end,'2025-09-30');
});
test('Night Riders spans all 92 summer days and its curve uses the same net metric as the KPI',()=>{
 assert.equal(night.start,'2026-06-01');assert.equal(night.end,'2026-08-31');validate(night);assert.equal(night.metric,'net_tickets');assert.equal(night.hoursPerNight,3);
 assert.ok(night.daily.slice(0,30).some(d=>d.tickets_sold>0));assert.ok(night.daily.slice(30,61).some(d=>d.tickets_sold>0));
});
test('event legend ids are unique, dated, and distinguish evidence of operation from opening dates',()=>{
 assert.equal(new Set(events.map(e=>e.id)).size,events.length);
 for(let i=1;i<events.length;i++)assert.ok(events[i].date>=events[i-1].date);
 assert.equal(events.find(e=>e.title==='Путь Дракона').kind,'confirmed');assert.ok(!events.some(e=>e.title.includes('Сердце Москвы')));
});

test('public chart snapshots contain only aggregated chart metrics',()=>{
 for(const series of [...season.seasons,night])for(const day of series.daily)assert.deepEqual(Object.keys(day).sort(),['date','net_tickets','returned','tickets_sold']);
 assert.ok(!JSON.stringify(season).includes('ticket_type'));assert.equal(typeof night.total.net_revenue,'number');
});
