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
  const value = profile[rule.field];
  if (!value) return 'unknown';
  if (rule.allowed.includes(value)) return 'match';
  // Explicit blocked lists let conditional cases such as returning or completed remain uncertain.
  if (rule.blocked && !rule.blocked.includes(value)) return 'unknown';
  return 'mismatch';
}
export function matchSummary(item, profile) {
  const checks = item.rules.map(rule => ({...rule,result:compareRule(rule,profile)}));
  const mismatches = checks.filter(x=>x.result==='mismatch').length;
  const matches = checks.filter(x=>x.result==='match').length;
  return {checks,matches,mismatches,kind:mismatches?'mismatch':matches?'partial':'unknown',label:mismatches?`입력 조건 ${mismatches}개와 다름`:matches?`확인한 조건 ${matches}개 부합 · 추가 요건 확인`:'세부 요건 확인 필요'};
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
