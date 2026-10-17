import type {Event} from './model';

const clean=(s:string)=>s.replace(/(?:\+82[-\s]?)?0?1[016789][-\s]?\d{3,4}[-\s]?\d{4}/g,'').replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi,'').replace(/^[\s✔✅☑📌📍📅⏰•*·-]+/u,'').trim();
const line=(text:string,names:string)=>text.match(new RegExp('(?:'+names+')\\s*[:：]\\s*([^\\n]+)'))?.[1]?.trim()||'';
const dateParts=(s:string)=>[...s.matchAll(/(?:(20\d{2})\s*[.\/년-]\s*)?(\d{1,2})\s*[.\/월-]\s*(\d{1,2})(?:\s*일)?/g)];
const validDate=(year:number,month:number,day:number)=>{const s=`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;const d=new Date(s+'T12:00:00Z');if(d.getUTCFullYear()!==year||d.getUTCMonth()+1!==month||d.getUTCDate()!==day)throw Error('공지의 날짜를 확인해 주세요.');return s};
export function parseNotice(text:string,year:number):Event {
 if(text.length>16000)throw Error('공지문은 16,000자 이내로 붙여넣어 주세요.');
 const lines=text.trim().split(/\r?\n/).map(s=>s.trim()).filter(Boolean);if(!lines.length)throw Error('공지문을 붙여넣어 주세요.');
 const title=clean(lines[0]).replace(/^\[(.*)\]$/,'$1').slice(0,150);
 const schedule=line(text,'일시|행사 일시|행사일|일자|날짜');const dates=dateParts(schedule);
 if(dates.length>1)throw Error('여러 날짜가 있는 공지는 날짜별로 나누어 추가해 주세요.');
 const explicitYear=Number(text.match(/\b(20\d{2})\b/)?.[1]||year);
 const date=dates[0]?validDate(Number(dates[0][1]||explicitYear),Number(dates[0][2]),Number(dates[0][3])):null;
 const times=[...schedule.matchAll(/(?:([오전후]{2})\s*)?(\d{1,2})\s*[:시]\s*(\d{2})?(?:분)?/g)].map(m=>{let h=Number(m[2]),min=Number(m[3]||0);if(m[1]==='오후'&&h<12)h+=12;if(m[1]==='오전'&&h===12)h=0;if(h>23||min>59)throw Error('공지의 시간을 확인해 주세요.');return String(h).padStart(2,'0')+':'+String(min).padStart(2,'0')});
 const start=times[0]||null,end=times[1]||null;if(start&&end&&end<=start)throw Error('종료시간은 시작시간 이후여야 합니다.');
 const location=clean(line(text,'장소|배부 장소|진행 장소'));
 const eligibility=clean(line(text,'대상|참여 대상|참가 대상'));
 const benefitIndex=lines.findIndex(s=>/(?:품목|메뉴|혜택|제공 품목|제공 메뉴|간식)\s*[:：]/.test(s));
 const benefits:string[]=[];
 if(benefitIndex>=0){const first=lines[benefitIndex].split(/[:：]/).slice(1).join(':').trim();if(first)benefits.push(first);for(let i=benefitIndex+1;i<lines.length&&benefits.length<6;i++){if(!/^[•·*-]|🍱|🍔|🥤|☕|🍕/.test(lines[i]))break;benefits.push(lines[i]);}}
 const benefit=benefits.map(clean).filter(Boolean).join(' · ')||'';
 const conditions=lines.filter(s=>/^\*/.test(s)||/선착순|소진 시|추첨|중복수령|중복 수령/.test(s)).map(clean);
 const rule=conditions.join(' · ').slice(0,1200)||'지급 조건 미기재';
 const deadlineLine=line(text,'신청 마감|마감일|마감|신청 기간|신청기간');const dl=dateParts(deadlineLine).at(-1);const deadline=dl?validDate(Number(dl[1]||explicitYear),Number(dl[2]),Number(dl[3])):undefined;
 const registrationUrl=text.match(/(?:신청\s*링크|신청\s*주소)\s*[:：]\s*(https:\/\/[^\s<>]+)/)?.[1];
 const registration=/사전\s*신청\s*(?:불필요|없이)|신청\s*없이/.test(text)?'none':registrationUrl||/사전\s*신청\s*(?:필수|필요)|신청\s*필수/.test(text)?'required':'unknown';
 const uncertain:string[]=[];if(!date)uncertain.push('행사 날짜 미기재');if(!start)uncertain.push('시작시간 미기재');if(!end)uncertain.push(/소진/.test(schedule)?'수량 소진 시 종료':'종료시간 미기재');
 const weekday=schedule.match(/\(([일월화수목금토])\)/)?.[1];if(date&&weekday&&'일월화수목금토'[new Date(date+'T12:00:00Z').getUTCDay()]!==weekday)uncertain.push('원문 요일과 날짜가 일치하지 않음 · 날짜를 확인해 주세요');
 return {id:'',title,date,start,end,location,eligibility,benefit,category:/기프티콘|상품권|경품/.test(benefit)?'gift':/간식|음식|도시락|덮밥|버거|콜라|식사|메뉴/.test(title+' '+benefit)?'food':'experience',rule,registration,registrationUrl,deadline,source:'manual',sourceUrl:'',publicVerified:false,evidence:benefit,verifiedAt:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul'}).format(new Date()),uncertain};
}
export function noticeId(e:Pick<Event,'title'|'date'|'start'>){let h=2166136261;for(const c of `${e.title}|${e.date}|${e.start}`)h=Math.imul(h^c.charCodeAt(0),16777619);return 'manual-'+(h>>>0).toString(16)}

export const noticeExample=`[2026-2학기 통계학과 중간고사 간식행사]
안녕하세요. 제12대 통계학과 학생회 [노을]입니다.
✔일시: 10/19 (월) 17:30~소진 시까지(선착순)
✔장소: 통계학과 과방 (25동 223호)
✔대상: 통계학과 정회원, 일반회원, 준회원
*학생증 확인 예정이며 실물 학생증 또는 온라인 학생증을 미리 준비해주셔야 합니다.
*학생회원에게 우선 배부될 예정이며 학생회원 미등록시 후순위가 됩니다.
*18:30부터는 1인당 추가로 1번씩 중복수령이 허용될 예정입니다.
✔품목:
• 🍱 제육 많이 덮밥 🍱 (40인)
• 일반 콜라 / 제로 콜라 (택 1)
(코카콜라)`;
