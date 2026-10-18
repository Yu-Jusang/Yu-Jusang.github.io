import {GROUPS} from './content.js?v=2';

export function koreaDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
export function phase(item, now = new Date()) {
  if (item.guide) return 'guide';
  if (!item.deadline) return 'unknown';
  const today = koreaDate(now);
  if (today > item.deadline) return 'closed';
  if (today === item.deadline && item.deadlineTime && now >= new Date(`${item.deadline}T${item.deadlineTime}:00+09:00`)) return 'closed';
  if (item.start && today < item.start) return 'upcoming';
  return 'open';
}
export function compareRule(rule, profile) {
  if (rule.all || rule.any) {
    const results = (rule.all || rule.any).map(x => compareRule(x, profile));
    const result = rule.all ? results.includes('mismatch') ? 'mismatch' : results.every(x=>x==='match') ? 'match' : 'unknown'
      : results.includes('match') ? 'match' : results.every(x=>x==='mismatch') ? 'mismatch' : 'unknown';
    return result === 'mismatch' && rule.soft ? 'unknown' : result;
  }
  if (rule.year && profile.incomeYear !== String(rule.year)) return 'unknown';
  const value = profile[rule.field];
  if (value === '' || value === undefined || value === null) return 'unknown';
  if (rule.field === 'income' && value === 'unassessed') return 'unknown';
  const normalized = rule.field === 'institution' ? normalizeInstitution(value) : String(value);
  if (rule.allowed?.map(String).includes(normalized)) return 'match';
  if (rule.min !== undefined || rule.max !== undefined) {
    const numeric = rule.field === 'income' && ['basic','near'].includes(value) ? 0 : Number(value);
    if (!Number.isFinite(numeric)) return 'unknown';
    const matches = (rule.min === undefined || numeric >= rule.min) && (rule.max === undefined || numeric <= rule.max);
    if (matches) return 'match';
    if (rule.soft) return 'unknown';
    return 'mismatch';
  }
  // Explicit blocked lists let conditional cases such as returning or completed remain uncertain.
  if (rule.blocked && !rule.blocked.includes(value)) return 'unknown';
  if (rule.soft) return 'unknown';
  return 'mismatch';
}
export function normalizeInstitution(value) {
  const normalized=String(value).normalize('NFKC').replace(/\s/g,'').toLowerCase();
  return ['서울대','서울대학교','snu','seoulnationaluniversity'].includes(normalized)?'서울대학교':normalized;
}
export function matchSummary(item, profile) {
  const checks = (item.rules || []).map(rule => ({...rule,result:compareRule(rule,profile)}));
  const mismatches = checks.filter(x=>x.result==='mismatch').length;
  const matches = checks.filter(x=>x.result==='match').length;
  const unknowns=checks.filter(x=>x.result==='unknown').length+(item.unknowns||[]).length;
  return {checks,matches,mismatches,unknowns,kind:mismatches?'mismatch':matches?'partial':'unknown',label:mismatches?`입력 조건 ${mismatches}개와 다름`:matches?`확인한 조건 ${matches}개 부합`:'조건 입력 후 비교'};
}
export function tuitionEstimate(profile, tuition, otherTuition, program = 'type1') {
  if (profile.incomeYear !== '2026' || !profile.income || profile.income==='unassessed') return null;
  const band=['basic','near'].includes(profile.income)?0:Number(profile.income);
  if (!Number.isInteger(band)||band<0||band>10) return null;
  let cap=0;
  if(band===0) cap=Infinity;
  else if(program==='multi3')cap=band<=8?Infinity:band===9?1000000:0;
  else if(program==='multi12')cap=band<=3?3050000:band<=6?2525000:band<=8?2325000:band===9?675000:0;
  else cap=band<=3?3000000:band<=6?2200000:band<=8?1800000:band===9?500000:0;
  const remaining=Math.max(0,Number(tuition)-Number(otherTuition));
  if(!Number.isFinite(remaining)||Number(tuition)<0||Number(otherTuition)<0)return null;
  return {cap,remaining,estimated:Math.min(cap,remaining),excess:Math.max(0,Number(otherTuition)-Number(tuition))};
}
export const PROFILE_FIELDS=['institution','schoolRegion','residence','parentRegion','residenceMonths','parentMonths','localHighSchool','degree','schoolType','status','year','major','department','nationality','income','incomeYear','percentile','credits','gpa','gpaScale','cumulativePercentile','cumulativeGpa','familyChildren','childOrder','singleParent','disability','care','veteran','northKorean','rural','working','firstSemester','finalSemester','exchange','training'];
export function sanitizeState(raw) {
  const out={profile:{},saved:{}};
  if(!raw||typeof raw!=='object')return out;
  for(const definition of GROUPS.flatMap(g=>g.fields)) {
    const field=definition.name,value=raw.profile?.[field];
    if(typeof value!=='string'||!PROFILE_FIELDS.includes(field))continue;
    if(value===''){out.profile[field]='';continue;}
    if(definition.options&&!definition.options.some(([key])=>key===value))continue;
    if(definition.type==='number') {
      const n=Number(value);
      if(!Number.isFinite(n)||n<definition.min||n>definition.max)continue;
    }
    out.profile[field]=value.slice(0,120);
  }
  if(out.profile.gpaScale)for(const field of ['gpa','cumulativeGpa'])if(Number(out.profile[field])>Number(out.profile.gpaScale))delete out.profile[field];
  if(raw.saved&&typeof raw.saved==='object'&&!Array.isArray(raw.saved))for(const[id,v]of Object.entries(raw.saved).slice(0,500)){
    if(!/^[a-z0-9][a-z0-9-]{0,90}$/.test(id)||!v||typeof v!=='object')continue;
    out.saved[id]={checks:Array.isArray(v.checks)?[...new Set(v.checks.filter(y=>Number.isInteger(y)&&y>=0&&y<100))]:[],note:typeof v.note==='string'?v.note.slice(0,2000):'',stage:['interested','preparing','submitted','result'].includes(v.stage)?v.stage:'interested'};
  }
  return out;
}
export function daysLeft(deadline, now = new Date()) {
  return Math.round((Date.parse(deadline+'T00:00:00Z')-Date.parse(koreaDate(now)+'T00:00:00Z'))/86400000);
}
export function deadlineLabel(item, now = new Date()) {
  const state = phase(item,now);
  if(state==='guide')return '제도 안내';
  if(state==='unknown')return '접수 일정 확인';
  if(state==='closed')return '접수 마감';
  if(state==='upcoming')return `${item.start.replaceAll('-','.')} 접수 시작`;
  const days = daysLeft(item.deadline,now);
  return days===0?`오늘 마감${item.deadlineTime?' '+item.deadlineTime:' · 시각 확인'}`:`D-${days}`;
}
const icsText = text => String(text).replaceAll('\\','\\\\').replaceAll('\n','\\n').replaceAll(',','\\,').replaceAll(';','\\;');
export function calendarFile(item, now = new Date()) {
  if (!item.deadline) return null;
  const stamp=now.toISOString().replace(/[-:]/g,'').replace(/\.\d+Z/,'Z');
  const date=item.deadline.replaceAll('-','');
  const timing=item.deadlineTime?`DTSTART;TZID=Asia/Seoul:${date}T${item.deadlineTime.replace(':','')}00`:`DTSTART;VALUE=DATE:${date}`;
  // Fold UTF-8 lines to RFC 5545's 75-octet limit without splitting characters.
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//SNU Scholarship Desk//KO','CALSCALE:GREGORIAN','BEGIN:VTIMEZONE','TZID:Asia/Seoul','BEGIN:STANDARD','DTSTART:19700101T000000','TZOFFSETFROM:+0900','TZOFFSETTO:+0900','END:STANDARD','END:VTIMEZONE','BEGIN:VEVENT',`UID:${item.id}@yu-jusang.github.io`,`DTSTAMP:${stamp}`,timing,`SUMMARY:${icsText('[장학 마감] '+item.title)}`,`DESCRIPTION:${icsText((item.deadlineTime?'한국시간 마감.':'마감 시각은 원문 확인 필요.')+'\n'+item.sourceUrl)}`,`URL:${item.sourceUrl}`,'END:VEVENT','END:VCALENDAR'];
  return lines.map(line=>{let chunks=[],chunk='',size=0;for(const char of line){const bytes=new TextEncoder().encode(char).length;if(size+bytes>74){chunks.push(chunk);chunk=' ';size=1;}chunk+=char;size+=bytes;}chunks.push(chunk);return chunks.join('\r\n');}).join('\r\n')+'\r\n';
}
