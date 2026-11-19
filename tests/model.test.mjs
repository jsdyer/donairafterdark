import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {schedule,starter,quote,validBasket,localNow,nextSaturday} from '../web/model.mjs';
const shops=JSON.parse(readFileSync(new URL('../web/data/shops.json',import.meta.url)));
const shop=id=>shops.find(s=>s.id===id);
test('the published baseline basket includes actual sauce portions',()=>{
  assert.deepEqual(shops.map(s=>quote(s,starter).total),[2060,1908,2275,2185,1908]);
  assert.equal(quote(shop('tonys'),starter).sauce.oz,null);
  assert.equal(quote(shop('zesty'),starter).sauce.oz,4);
  assert.equal(quote(shop('kod-quinpool'),starter).sauce.oz,2);
});
test('Friday overnight windows, midnight closing and unknown counter hours',()=>{
  const states=shops.map(s=>schedule(s,'2026-11-21','00:45').state);
  assert.deepEqual(states,['open','unknown','closed','open','unknown']);
  assert.match(schedule(shop('tonys'),'2026-11-21','00:45').detail,/Friday/);
  assert.equal(schedule(shop('tonys'),'2026-11-21','04:00').state,'closed');
  assert.equal(schedule(shop('zesty'),'2026-11-21','00:00').state,'closed');
  assert.equal(schedule(shop('metro'),'2026-11-21','03:00').state,'closed');
  assert.equal(schedule(shop('zesty'),'2026-11-21','15:00').state,'open');
});
test('a missing Sunday close can affect Monday while Saturday hours remain known',()=>{
  const m=shop('metro');
  for (const [date,time,state] of [['2026-11-22','00:45','open'],['2026-11-22','10:00','closed'],['2026-11-22','18:00','unknown'],['2026-11-23','00:30','unknown'],['2026-11-23','16:00','open']]) {
    assert.equal(schedule(m,date,time).state,state);
  }
});
test('exact volumes, no extra sauce, HST and size selection',()=>{
  const b={...starter,sauce:'4oz',tax:true};
  assert.equal(quote(shop('tonys'),b).total,null);
  assert.equal(quote(shop('kod-quinpool'),b).total,2306);
  assert.equal(quote(shop('tonys'),{...b,cups:0}).total,2177);
  assert.equal(quote(shop('metro'),{...starter,size:'large',qty:3,sauce:'next',cups:2}).total,5075);
});
test('date, basket and Halifax clock validation',()=>{
  assert.equal(validBasket({...starter,qty:0}),false);
  assert.equal(validBasket({...starter,cups:0}),true);
  assert.equal(schedule(shop('tonys'),'2026-02-30','00:45').state,'invalid');
  assert.deepEqual(localNow(new Date('2026-07-04T03:45:00Z')),{date:'2026-07-04',time:'00:45'});
  assert.equal(nextSaturday(new Date('2026-07-04T03:46:00Z')),'2026-07-11');
  assert.equal(nextSaturday(new Date('2026-07-04T03:44:00Z')),'2026-07-04');
});
test('catalogue earliest review and branch count match the public data',()=>{
  const status=JSON.parse(readFileSync(new URL('../web/data/status.json',import.meta.url)));
  assert.equal(status.count,shops.length);
  assert.equal(status.verified,shops.map(s=>s.checked).sort()[0]);
  for(const s of shops) assert.ok(s.week===null || s.week.length===7);
});
