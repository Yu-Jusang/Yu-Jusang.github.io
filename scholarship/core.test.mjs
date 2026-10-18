import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {phase,compareRule,matchSummary,calendarFile,koreaDate,tuitionEstimate,sanitizeState} from './core.js';
const data=JSON.parse(fs.readFileSync(new URL('./data.json',import.meta.url),'utf8'));
const item=id=>data.scholarships.find(x=>x.id===id);
test('KST exact deadline, date-only deadline and unknown schedules',()=>{
 assert.equal(koreaDate(new Date('2026-10-17T16:00:00Z')),'2026-10-18');
 const timed={deadline:'2026-10-06',deadlineTime:'15:00'};
 assert.equal(phase(timed,new Date('2026-10-06T05:59:59Z')),'open');
 assert.equal(phase(timed,new Date('2026-10-06T06:00:00Z')),'closed');
 assert.equal(phase({deadline:'2026-10-20'},new Date('2026-10-20T14:59:59Z')),'open');
 assert.equal(phase({deadline:'2026-10-20'},new Date('2026-10-20T15:00:00Z')),'closed');
 assert.equal(phase({}),'unknown');assert.equal(phase({guide:true}),'guide');
 assert.equal(phase(item('kfas-talent-7')),'unknown');
});
test('blank profile is unknown; institution scope is enforced for SNU',()=>{
 assert.equal(matchSummary(item('snu-custom-guide'),{}).kind,'unknown');
 assert(matchSummary(item('snu-custom-guide'),{institution:'연세대학교'}).mismatches>0);
 assert.equal(compareRule(item('snu-custom-guide').rules[0],{institution:'서울대'}),'match');
 assert.equal(matchSummary(item('ilun-2026-fall'),{degree:'undergrad'}).kind,'mismatch');
});
test('income comparison never mixes 2026 and 2027; basic welfare is handled',()=>{
 const rule=item('national-i').rules.find(x=>x.field==='income');
 assert.equal(compareRule(rule,{income:'4',incomeYear:'2026'}),'match');
 assert.equal(compareRule(rule,{income:'4',incomeYear:'2027'}),'unknown');
 assert.equal(compareRule(rule,{income:'unassessed',incomeYear:'2026'}),'unknown');
 assert.equal(compareRule(rule,{income:'basic',incomeYear:'2026'}),'match');
 assert.equal(compareRule(rule,{income:'10',incomeYear:'2026'}),'mismatch');
});
test('regional OR accepts parent residence; regional AND rejects wrong university',()=>{
 const incheon=item('incheon-hope').rules[1];
 assert.equal(compareRule(incheon,{parentRegion:'인천',schoolRegion:'서울',residence:'서울'}),'match');
 assert.equal(compareRule(incheon,{schoolRegion:'서울',residence:'서울'}),'unknown');
 const gangwon=item('gangwon-living').rules[1];
 assert.equal(compareRule(gangwon,{residence:'강원',residenceMonths:'24',schoolRegion:'서울',localHighSchool:'강원'}),'mismatch');
 const seoul=item('seoul-talent-university').rules[1];
 assert.equal(compareRule(seoul,{schoolRegion:'부산',parentRegion:'서울'}),'match');
});
test('residence duration does not turn Seoul years into cumulative Jeju years',()=>{
 const rule=item('jeju-hope').rules[1];
 assert.equal(compareRule(rule,{residence:'서울',residenceMonths:'100',parentRegion:'제주'}),'unknown');
 assert.equal(compareRule(rule,{residence:'제주',residenceMonths:'70',parentRegion:'서울'}),'match');
});
test('GPA uses published scale-specific cutoffs and cumulative grades separately',()=>{
 const rule=item('incheon-hope').rules.find(x=>x.label==='직전학기 평점');
 assert.equal(compareRule(rule,{gpaScale:'4.3',gpa:'2.6'}),'match');
 assert.equal(compareRule(rule,{gpaScale:'4.5',gpa:'2.6'}),'mismatch');
 assert.equal(compareRule(rule,{gpa:'2.6'}),'unknown');
 const seoul=item('seoul-talent-university').rules.find(x=>x.field==='cumulativePercentile');
 assert.equal(compareRule(seoul,{percentile:'95'}),'unknown');
});
test('general grades below cutoff stay uncertain when exceptions may apply',()=>{
 const rule=item('national-i').rules.find(x=>x.label.startsWith('성적'));
 assert.equal(compareRule(rule,{percentile:'75',income:'2',incomeYear:'2026',firstSemester:'no',disability:'no',care:'no'}),'unknown');
 assert.equal(compareRule(rule,{percentile:'75',income:'basic',incomeYear:'2026'}),'match');
 assert.equal(compareRule(rule,{percentile:'60',disability:'yes'}),'match');
});
test('tuition caps use semester amounts, remaining tuition and no cross-year estimate',()=>{
 assert.equal(tuitionEstimate({income:'4',incomeYear:'2026'},3000000,1000000).estimated,2000000);
 assert.equal(tuitionEstimate({income:'4',incomeYear:'2026'},4000000,0).estimated,2200000);
 assert.equal(tuitionEstimate({income:'9',incomeYear:'2026'},3000000,0).estimated,500000);
 assert.equal(tuitionEstimate({income:'9',incomeYear:'2026'},3000000,0,'multi12').estimated,675000);
 assert.equal(tuitionEstimate({income:'9',incomeYear:'2026'},3000000,0,'multi3').estimated,1000000);
 assert.equal(tuitionEstimate({income:'basic',incomeYear:'2026'},3000000,1000000).estimated,2000000);
 assert.equal(tuitionEstimate({income:'10',incomeYear:'2026'},3000000,0).estimated,0);
 assert.equal(tuitionEstimate({income:'4',incomeYear:'2027'},3000000,0),null);
 assert.equal(tuitionEstimate({income:'4',incomeYear:'2026'},3000000,4000000).excess,1000000);
});
test('backup sanitization drops invalid fields, numeric ranges and unsafe keys',()=>{
 const clean=sanitizeState(JSON.parse('{"profile":{"institution":"서울대","income":"99","percentile":"1000","gpaScale":"4.3","gpa":"4.4","credits":"12","apiKey":"private"},"saved":{"__proto__":{"checks":[1]},"national-i":{"checks":[1,1,-1,"2",100],"note":"메모","stage":"invalid"}}}'));
 assert.equal(clean.profile.income,undefined);assert.equal(clean.profile.percentile,undefined);assert.equal(clean.profile.gpa,undefined);assert.equal(clean.profile.apiKey,undefined);
 assert.equal(clean.profile.credits,'12');assert.deepEqual(clean.saved['national-i'].checks,[1]);assert.equal(clean.saved['national-i'].stage,'interested');assert.equal(Object.hasOwn(clean.saved,'__proto__'),false);
});
test('catalog integrity: real source URLs, 17 unique directories and no invented deadlines',()=>{
 assert.equal(new Set(data.directory.map(x=>x.region)).size,17);
 assert(data.scholarships.length>=40);const ids=new Set();
 for(const entry of data.scholarships){assert(!ids.has(entry.id));ids.add(entry.id);assert.match(entry.sourceUrl,/^https:\/\//);assert(entry.steps.length>0);assert(entry.unknowns.length>0);assert(entry.category);assert(entry.verifiedAt);if(entry.guide)assert.equal(entry.deadline,null);if(!entry.deadline)assert.equal(calendarFile(entry),null);}
 assert.equal(data.scholarships.filter(x=>x.category==='국가').length,14);
});
test('calendar preserves known times and folds UTF-8 lines',()=>{
 const text=calendarFile(item('mirae-36-2027'),new Date('2026-10-18T00:00:00Z'));
 assert(text.includes('DTSTART;TZID=Asia/Seoul:20261006T150000'));
 assert(calendarFile(item('cces-language-2026')).includes('DTSTART;VALUE=DATE:20261020'));
 for(const line of text.split('\r\n'))assert(Buffer.byteLength(line)<=75);
});
