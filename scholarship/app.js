import {phase,matchSummary,deadlineLabel,calendarFile} from './core.js';
const $ = s=>document.querySelector(s);
const escape = s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key='snu-scholarship-desk-v1';
const profileFields=['degree','college','department','status','exchange','training'];
let state={profile:{},saved:{}};
try{const x=JSON.parse(localStorage.getItem(key)||'{}');if(x&&typeof x==='object'){for(const f of profileFields)if(typeof x.profile?.[f]==='string')state.profile[f]=x.profile[f].slice(0,100);if(x.saved&&typeof x.saved==='object'&&!Array.isArray(x.saved))for(const [id,v]of Object.entries(x.saved)){if(v&&typeof v==='object')state.saved[id]={checks:Array.isArray(v.checks)?v.checks.filter(y=>Number.isInteger(y)&&y>=0&&y<100):[],note:typeof v.note==='string'?v.note.slice(0,2000):''};}}}catch{}
let data=[],verifiedAt='',view='explore',type='all',activeId=null,toastTimer;
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3500);}
function persist(){try{localStorage.setItem(key,JSON.stringify(state));return true;}catch{toast('저장 공간을 사용할 수 없어 새로고침하면 기록이 사라질 수 있어요.');return false;}}
function save(id){if(state.saved[id]){delete state.saved[id];persist();toast('지원함에서 삭제했어요.');}else{state.saved[id]={checks:[],note:''};if(persist())toast('내 지원함에 저장했어요.');}render();}
function badge(item){const p=phase(item);return `<span class="deadline ${p==='open'?'open':''}">${escape(deadlineLabel(item))}</span>`;}
function render(){
  $('#saved-count').textContent=data.filter(x=>state.saved[x.id]).length;
  $('#open-count').textContent=data.filter(x=>phase(x)==='open').length;
  $('#review-count').textContent=data.filter(x=>['unknown','guide'].includes(phase(x))).length;
  $('#progress-count').textContent=data.filter(x=>state.saved[x.id]&&state.saved[x.id].checks.length<x.steps.length).length;
  $('#guide-view').hidden=view!=='guide';$('#explore-view').hidden=view==='guide';
  document.querySelectorAll('[data-view]').forEach(x=>{x.classList.toggle('active',x.dataset.view===view);if(x.dataset.view===view)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current');});
  $('#results-title').textContent=view==='saved'?'나의 장학금 지원함':'놓치지 말아야 할 기회';
  const query=$('#search').value.trim().toLowerCase();
  let items=data.filter(x=>(view!=='saved'||state.saved[x.id])&&(type==='all'||x.type===type)&&(!$('#hide-mismatch').checked||!matchSummary(x,state.profile).mismatches)&&($('#show-closed').checked||view==='saved'||phase(x)!=='closed')&&query.split(/\s+/).every(q=>[x.title,x.organization,x.description,x.audience,x.amount,x.type].join(' ').toLowerCase().includes(q)));
  const order={open:0,upcoming:1,unknown:2,guide:3,closed:4};
  items.sort((a,b)=>$('#sort').value==='recent'?(b.published||'').localeCompare(a.published||''):order[phase(a)]-order[phase(b)]||(a.deadline||'9999').localeCompare(b.deadline||'9999'));
  $('#result-count').textContent=`${items.length}개 공고`;
  $('#data-note').textContent=`${verifiedAt.replaceAll('-','.')} 원문 확인 · 수동 검증 자료 · ${view==='saved'?'저장한 마감 공고도 표시합니다.':'접수 일정 미확인 공고는 모집 중으로 집계하지 않습니다.'}`;
  $('#empty').hidden=items.length>0;
  $('#cards').innerHTML=items.map(item=>{const m=matchSummary(item,state.profile);const saved=state.saved[item.id];return `<article class="card ${phase(item)==='closed'?'archived':''}"><div class="card-top"><div class="tags"><span class="pill">${escape(item.type)}</span><span>${escape(item.organization)}</span></div>${badge(item)}</div><button class="card-title" data-detail="${item.id}">${escape(item.title)}</button><p class="card-desc">${escape(item.description)}</p><div class="card-meta"><strong><span>지원</span>${escape(item.amount)}</strong><strong><span>대상</span>${escape(item.audience)}</strong></div><div class="card-bottom"><span class="match ${m.kind}">${m.kind==='mismatch'?'−':'↳'} ${escape(m.label)}${saved?` · 준비 ${saved.checks.filter(n=>n<item.steps.length).length}/${item.steps.length}`:''}</span><div class="card-actions"><button class="save ${saved?'saved':''}" data-save="${item.id}" aria-pressed="${!!saved}">${saved?'✓ 저장됨':'+ 지원함'}</button><button class="detail-link" data-detail="${item.id}">조건·신청 준비 ↗</button></div></div></article>`;}).join('');
}
function showDetail(id){
  const item=data.find(x=>x.id===id);if(!item)return;activeId=id;
  const m=matchSummary(item,state.profile),saved=state.saved[id];
  $('#detail-content').innerHTML=`<div class="dialog-head"><span>장학 상세 · ${escape(item.organization)}</span><button class="close" aria-label="상세 닫기" id="close-detail">×</button></div><div class="dialog-body"><div class="tags"><span class="pill">${escape(item.type)}</span>${badge(item)}</div><h2 id="detail-title">${escape(item.title)}</h2><p>${escape(item.description)}</p><dl class="detail-facts"><div><dt>지원 내용</dt><dd>${escape(item.amount)}</dd></div><div><dt>지원 대상</dt><dd>${escape(item.audience)}</dd></div><div><dt>접수 마감 · 한국시간</dt><dd>${item.deadline?escape(item.deadline+' '+(item.deadlineTime||'(시각 원문 확인)')):item.guide?'학기별 공지 확인':'원문·첨부 요강 확인'}</dd></div><div><dt>신청 경로</dt><dd>${escape(item.method)}</dd></div></dl><h3>내 조건과 비교</h3>${m.checks.map(rule=>`<div class="condition"><span class="symbol ${rule.result==='mismatch'?'no':rule.result==='unknown'?'unknown':''}">${rule.result==='match'?'✓':rule.result==='mismatch'?'−':'?'}</span>${escape(rule.label)} <span class="tiny muted">${rule.result==='match'?'입력 정보와 부합':rule.result==='mismatch'?'입력 정보와 다름':'추가 확인'}</span><p class="evidence">근거: ${escape(rule.evidence)}</p></div>`).join('')}${item.unknowns.map(s=>`<div class="condition"><span class="symbol unknown">?</span>${escape(s)}</div>`).join('')}<div class="note-box">${escape(item.note)}</div><p class="dialog-foot">${escape(state.profile.college||'소속 대학')}${state.profile.department?' · '+escape(state.profile.department):''}의 별도 공지·내부 추천 마감도 확인하세요. 조건 비교는 입력값과 공개된 요건을 대조하며, 자격 판정이나 선발을 보장하지 않습니다.</p><h3>신청 준비 체크리스트 <span class="tiny muted" id="check-count"></span></h3><div class="progress"><i id="check-progress"></i></div><div id="checklist">${item.steps.map((step,i)=>`<label class="check"><input type="checkbox" data-check="${i}" ${saved?.checks.includes(i)?'checked':''}>${escape(step)}</label>`).join('')}</div><p class="dialog-foot">체크하면 내 지원함에 저장됩니다. 실제 신청·서류 제출은 해당 기관에서 완료해야 합니다.</p><h3><label for="memo">나의 메모</label></h3><textarea id="memo" maxlength="2000" placeholder="확인할 질문이나 준비 상황을 적어두세요. (이 기기에만 저장)">${escape(saved?.note||'')}</textarea><div class="dialog-actions"><a class="primary" target="_blank" rel="noopener" href="${escape(item.sourceUrl)}">공식 원문 확인 ↗</a>${item.applicationUrl?`<a class="secondary" target="_blank" rel="noopener" href="${escape(item.applicationUrl)}">${item.applicationUrl.includes('my.snu')?'마이스누 열기':'신청 안내 열기'} ↗</a>`:''}${item.deadline?'<button class="secondary" id="calendar">마감일 캘린더에 담기</button>':''}<button class="secondary" id="detail-save">${saved?'지원함에서 삭제':'+ 내 지원함에 저장'}</button></div><p class="dialog-foot">원문 확인 ${verifiedAt} · ${item.published?'공고 게시 '+item.published:'제도 안내'} · 학교 공식 서비스가 아닙니다.</p></div>`;
  $('#close-detail').onclick=()=>$('#detail').close();
  $('#detail-save').onclick=()=>{save(id);showDetail(id);};
  $('#checklist').onchange=e=>{if(!e.target.matches('[data-check]'))return;ensureSaved(id);state.saved[id].checks=[...document.querySelectorAll('[data-check]:checked')].map(x=>Number(x.dataset.check));persist();updateProgress(item);render();};
  $('#memo').oninput=e=>{ensureSaved(id);state.saved[id].note=e.target.value;persist();render();$('#detail-save').textContent='지원함에서 삭제';};
  if($('#calendar'))$('#calendar').onclick=()=>download(`${item.id}.ics`,calendarFile(item),'text/calendar;charset=utf-8');
  updateProgress(item);
  if(!$('#detail').open)$('#detail').showModal();
}
function ensureSaved(id){state.saved[id]??={checks:[],note:''};$('#detail-save').textContent='지원함에서 삭제';}
function updateProgress(item){const n=state.saved[item.id]?.checks.filter(i=>i<item.steps.length).length||0;$('#check-count').textContent=`${n}/${item.steps.length}`;$('#check-progress').style.width=`${n/item.steps.length*100}%`;}
function download(name,text,mime){const url=URL.createObjectURL(new Blob([text],{type:mime}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;render();});
document.querySelectorAll('[data-type]').forEach(b=>b.onclick=()=>{type=b.dataset.type;document.querySelectorAll('[data-type]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b));});render();});
for(const s of ['#search','#sort','#hide-mismatch','#show-closed'])$(s).addEventListener(s==='#search'?'input':'change',render);
$('#cards').onclick=e=>{const b=e.target.closest('button');if(b?.dataset.detail)showDetail(b.dataset.detail);if(b?.dataset.save)save(b.dataset.save);};
$('#profile').onsubmit=e=>{e.preventDefault();state.profile=Object.fromEntries(new FormData(e.target));if(persist())toast('내 조건을 적용했어요.');render();};
for(const [name,value]of Object.entries(state.profile))if($('#profile').elements.namedItem(name))$('#profile').elements.namedItem(name).value=value;
$('#reset-profile').onclick=()=>{state.profile={};$('#profile').reset();persist();render();toast('내 조건을 지웠어요.');};
$('#clear-all').onclick=()=>{if(!confirm('프로필, 지원함, 체크리스트와 메모를 모두 지울까요?'))return;state={profile:{},saved:{}};persist();$('#profile').reset();render();toast('이 사이트의 내 기록을 모두 지웠어요.');};
$('#clear-filters').onclick=()=>{$('#search').value='';$('#hide-mismatch').checked=false;$('#show-closed').checked=false;document.querySelector('[data-type="all"]').click();};
$('#detail').addEventListener('click',e=>{if(e.target===$('#detail')){const r=$('#detail').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#detail').close();}});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!$('#detail').open&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();$('#search').focus();}});
const sources=[['학생처 장학 공지','https://student.snu.ac.kr/'],['마이스누 장학 신청','https://my.snu.ac.kr/'],['통계학과','https://stat.snu.ac.kr/'],['자연과학대학','https://science.snu.ac.kr/'],['생명과학부','https://biosci.snu.ac.kr/'],['물리천문학부','https://physics.snu.ac.kr/'],['공과대학','https://eng.snu.ac.kr/'],['인문대학','https://humanities.snu.ac.kr/']];
$('#sources').innerHTML=sources.map(([label,url])=>`<a href="${url}" target="_blank" rel="noopener">${label} ↗</a>`).join('');
try{const response=await fetch('./data.json',{cache:'no-cache'});if(!response.ok)throw Error(response.status);const payload=await response.json();data=payload.scholarships;verifiedAt=payload.verifiedAt;$('#verified-date').textContent=verifiedAt.replaceAll('-','.')+' 확인';render();}catch{ $('#cards').innerHTML='<div class="guide-box"><h3>공고를 불러오지 못했어요.</h3><p>연결을 확인하고 페이지를 새로고침해 주세요.</p><a class="secondary" href="./">다시 불러오기</a></div>';$('#empty').hidden=true;}
setInterval(()=>{if(data.length)render();},60000);

