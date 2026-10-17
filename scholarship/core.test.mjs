import {test} from 'node:test';
import assert from 'node:assert/strict';
import {phase,compareRule,matchSummary,calendarFile,koreaDate} from './core.js';
import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync(new URL('./data.json',import.meta.url),'utf8'));
test('KST date and exact deadline boundary',()=>{
 assert.equal(koreaDate(new Date('2026-10-17T16:00:00Z')),'2026-10-18');
 const item={deadline:'2026-10-06',deadlineTime:'15:00'};
 assert.equal(phase(item,new Date('2026-10-06T05:59:59Z')),'open');
 assert.equal(phase(item,new Date('2026-10-06T06:00:00Z')),'closed');
 assert.equal(phase({deadline:'2026-10-20'},new Date('2026-10-20T14:59:59Z')),'open');
 assert.equal(phase({deadline:'2026-10-20'},new Date('2026-10-20T15:00:00Z')),'closed');
 assert.equal(phase({}), 'unknown');assert.equal(phase({guide:true}), 'guide');
});
test('unknown profile and conditional status are not positive matches',()=>{
 const rule={field:'status',allowed:['enrolled','returning'],blocked:['freshman']};
 assert.equal(compareRule(rule,{}),'unknown');
 assert.equal(compareRule(rule,{status:'leave'}),'unknown');
 assert.equal(compareRule(rule,{status:'freshman'}),'mismatch');
 const item=data.scholarships.find(x=>x.id==='ilun-2026-fall');
 assert.equal(matchSummary(item,{degree:'undergrad'}).kind,'mismatch');
 assert.equal(matchSummary(item,{degree:'master',status:'enrolled'}).kind,'partial');
});
test('source data integrity and missing dates',()=>{
 const ids=new Set();for(const item of data.scholarships){assert(!ids.has(item.id));ids.add(item.id);assert.match(item.sourceUrl,/^https:\/\/[^/]*snu.ac.kr\//);assert(item.steps.length>0);assert(item.unknowns.length>0);if(!item.deadline)assert.equal(calendarFile(item),null);}
});
test('calendar has exact time only when known, and folds Unicode lines',()=>{
 const exact=data.scholarships.find(x=>x.id==='mirae-36-2027');
 const text=calendarFile(exact,new Date('2026-10-18T00:00:00Z'));
 assert(text.includes('DTSTART;TZID=Asia/Seoul:20261006T150000'));
 const day=calendarFile(data.scholarships[0]);assert(day.includes('DTSTART;VALUE=DATE:20261020'));
 for(const line of text.split('\r\n'))assert(Buffer.byteLength(line)<=75);
});

