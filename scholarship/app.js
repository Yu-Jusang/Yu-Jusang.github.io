import {phase,matchSummary,deadlineLabel,calendarFile,tuitionEstimate,sanitizeState} from './core.js?v=2';
import {REGIONS,GROUPS,FAQS,STAGES} from './content.js?v=2';

const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=value=>{try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?esc(u.href):'#';}catch{return '#';}};
const STORAGE_KEY='scholarship-desk-v2';
const OLD_KEY='snu-scholarship-desk-v1';
let state=sanitizeState(null);
try{state=sanitizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)||localStorage.getItem(OLD_KEY)||'{}'));}catch{}
let items=[],metadata={},view='explore',category='',stage='',page=1,activeId=null,toastTimer,loaded=false;
const pageSize=10;
const fieldDefinitions=GROUPS.flatMap(g=>g.fields);

function toast(message){
  $('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3500);
}
function persist(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));return true;}
  catch{toast('이 브라우저에서 저장할 수 없어요. 새로고침 전에 기록을 백업하세요.');return false;}
}
function download(name,text,mime){
  const objectUrl=URL.createObjectURL(new Blob([text],{type:mime}));
  const a=document.createElement('a');a.href=objectUrl;a.download=name;a.click();
  setTimeout(()=>URL.revokeObjectURL(objectUrl),1000);
}
function profileLabel(name){
  const value=state.profile[name];if(!value)return '';
  const definition=fieldDefinitions.find(x=>x.name===name);
  return definition?.options?.find(([v])=>v===value)?.[1]||value;
}
function renderProfileSummary(){
  const profile=state.profile;
  const summary=[profile.institution,profileLabel('degree'),profile.residence?`${profile.residence} 거주`:'',profile.parentRegion?`부모 ${profile.parentRegion}`:'',profile.income&&profile.income!=='unassessed'?`${profile.incomeYear||'연도 미입력'} · ${profileLabel('income')}`:''].filter(Boolean);
  $('#profile-summary').textContent=summary.length?summary.join(' · '):'학교와 거주지가 다른가요?';
  const count=Object.values(profile).filter(Boolean).length;
  $('#profile-subtitle').textContent=count?`${count}개 조건 입력 · 확인된 항목만 대조하며, 미입력·예외 조건은 추가 확인으로 남깁니다.`:'본인·부모 거주지와 학교 소재지를 따로 넣어 기회를 찾아보세요.';
}
function setView(next){
  view=['explore','saved','calculator','guide'].includes(next)?next:'explore';render();
}
function render(){
  $('#saved-count').textContent=items.filter(x=>state.saved[x.id]).length;
  $('#total-count').textContent=loaded?items.length:'—';
  $('#region-count').textContent=loaded?items.filter(x=>x.category==='지역').length:'—';
  $('#source-count').textContent=loaded?(metadata.directory||[]).length:'—';
  for(const id of ['explore','saved','calculator','guide'])$(`#${id}-view`).hidden=id!==view;
  document.querySelectorAll('.nav').forEach(button=>{
    button.classList.toggle('active',button.dataset.view===view);
    if(button.dataset.view===view)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
  });
  renderProfileSummary();
  if(loaded){renderResults();renderSaved();}
}
function filteredItems(){
  const query=$('#search').value.trim().toLowerCase().split(/\s+/);
  const benefit=$('#benefit-filter').value,region=$('#region-filter').value,selectedPhase=$('#phase-filter').value;
  let result=items.filter(item=>{
    const p=phase(item),match=matchSummary(item,state.profile);
    const text=[item.title,item.organization,item.description,item.amount,item.category,item.type,...(item.regions||[]),...(item.requirements||[])].join(' ').toLowerCase();
    return (!category||item.category===category)&&(!benefit||item.type===benefit)&&(!region||item.regions?.includes(region))&&(!selectedPhase||p===selectedPhase)
      &&($('#show-closed').checked||selectedPhase==='closed'||p!=='closed')&&(!$('#hide-mismatch').checked||!match.mismatches)&&query.every(q=>text.includes(q));
  });
  const order={open:0,upcoming:1,guide:2,unknown:3,closed:4};
  result.sort((a,b)=>{
    if($('#sort').value==='name')return a.title.localeCompare(b.title,'ko');
    if($('#sort').value==='recommended'){
      const am=matchSummary(a,state.profile),bm=matchSummary(b,state.profile);
      const differing=Number(!!am.mismatches)-Number(!!bm.mismatches);
      if(differing)return differing;
      if(am.matches!==bm.matches)return bm.matches-am.matches;
    }
    return order[phase(a)]-order[phase(b)]||(a.deadline||'9999').localeCompare(b.deadline||'9999');
  });
  return result;
}
function tags(item){
  return `<span class="tag filled">${esc(item.category)}</span><span class="tag">${esc(item.type)}</span>${item.regions?.length?`<span class="tag">${esc(item.regions.join('·'))}</span>`:''}`;
}
function status(item){return `<span class="status ${phase(item)==='open'?'open':''}">${esc(deadlineLabel(item))}</span>`;}
function card(item){
  const match=matchSummary(item,state.profile),saved=state.saved[item.id];
  const amount=item.amount.length>65?item.amount.slice(0,65)+'…':item.amount;
  return `<article class="scholarship-card ${phase(item)==='closed'?'archived':''}">
    <div class="card-meta-top"><div class="tag-row">${tags(item)}<span class="provider">${esc(item.organization)}</span></div>${status(item)}</div>
    <div class="card-main"><div><button class="title-button" data-detail="${item.id}">${esc(item.title)}</button><p class="card-description">${esc(item.description)}</p></div><button class="bookmark" data-save="${item.id}" aria-label="${esc(item.title)} ${saved?'저장 취소':'저장'}" aria-pressed="${!!saved}">${saved?'✓ 저장됨':'+ 저장'}</button></div>
    <div class="facts-row"><strong><span>지원</span>${esc(amount)}</strong><strong><span>기준</span>${item.basisYear||'연도별'} · ${item.guide?'제도 안내':'모집 공고'}</strong></div>
    <div class="card-bottom"><span class="match ${match.kind}">${match.mismatches?'−':match.matches?'✓':'○'} ${esc(match.label)} · 추가 확인 ${match.unknowns}개</span><button class="detail-button" data-detail="${item.id}">조건·신청 준비 ↗</button></div>
  </article>`;
}
function renderResults(){
  const result=filteredItems();const pages=Math.max(1,Math.ceil(result.length/pageSize));page=Math.min(page,pages);
  $('#result-count').textContent=`${result.length}개 / 전체 ${items.length}개`;
  $('#result-note').textContent=`공식 자료 ${metadata.verifiedAt} 확인 · 제도 안내와 모집 공고를 구분합니다. 조건 부합은 최종 지원 자격 판정이 아닙니다.`;
  $('#cards').innerHTML=result.slice((page-1)*pageSize,page*pageSize).map(card).join('');
  $('#empty').hidden=result.length>0;
  $('#pagination').innerHTML=pages>1?`<button data-page="${page-1}" ${page===1?'disabled':''}>← 이전</button><span>${page} / ${pages}</span><button data-page="${page+1}" ${page===pages?'disabled':''}>다음 →</button>`:'';
}
function savedProgress(item){const n=state.saved[item.id]?.checks.filter(i=>i<item.steps.length).length||0;return {n,total:item.steps.length,percent:n/item.steps.length*100};}
function renderSaved(){
  const selected=items.filter(x=>state.saved[x.id]&&(!stage||state.saved[x.id].stage===stage));
  $('#saved-empty').hidden=selected.length>0;
  $('#saved-cards').innerHTML=selected.map(item=>{
    const saved=state.saved[item.id],progress=savedProgress(item);
    return `<article class="saved-item"><div class="tag-row">${tags(item)}${status(item)}</div><h3><button class="title-button" data-detail="${item.id}">${esc(item.title)}</button></h3><p>${esc(item.amount)}</p><div class="detail-stage"><span>나의 진행 상황</span><select data-saved-stage="${item.id}" aria-label="${esc(item.title)} 진행 상태">${Object.entries(STAGES).map(([value,label])=>`<option value="${value}" ${saved.stage===value?'selected':''}>${label}</option>`).join('')}</select></div><div class="progress"><i style="width:${progress.percent}%"></i></div><div class="saved-actions"><span>준비 체크 ${progress.n}/${progress.total}</span><button data-detail="${item.id}">메모·서류 확인 ↗</button></div></article>`;
  }).join('');
  if(!selected.length&&items.some(x=>state.saved[x.id]))$('#saved-empty').querySelector('h3').textContent='이 단계에 저장된 장학금이 없어요.';
  else $('#saved-empty').querySelector('h3').textContent='아직 저장한 장학금이 없어요.';
}
function ensureSaved(id){
  state.saved[id]??={checks:[],note:'',stage:'interested'};
}
function toggleSave(id){
  if(state.saved[id]){delete state.saved[id];persist();toast('지원함에서 삭제했어요.');}
  else{ensureSaved(id);if(persist())toast('내 지원함에 저장했어요.');}
  render();
}
function detailProgress(item){
  const progress=savedProgress(item);
  $('#detail-progress').style.width=`${progress.percent}%`;
  $('#check-count').textContent=`${progress.n}/${progress.total}`;
  $('#detail-save').textContent=state.saved[item.id]?'지원함에서 삭제':'+ 지원함에 저장';
  $('#detail-stage').value=state.saved[item.id]?.stage||'interested';
}
function showDetail(id){
  const item=items.find(x=>x.id===id);if(!item)return;
  activeId=id;const match=matchSummary(item,state.profile),saved=state.saved[id];
  $('#detail-content').innerHTML=`<div class="dialog-head"><span class="eyebrow">SCHOLARSHIP / DETAILS</span><button class="close" data-close="detail-dialog" aria-label="상세 닫기">×</button></div><div class="dialog-body">
    <div class="tag-row">${tags(item)}${status(item)}</div><h2 id="detail-title" class="detail-title">${esc(item.title)}</h2><p class="detail-lead">${esc(item.description)}</p>
    <dl class="detail-facts"><div><dt>지원 내용</dt><dd>${esc(item.amount)}</dd></div><div><dt>운영기관</dt><dd>${esc(item.organization)}</dd></div><div><dt>접수 마감 · 한국시간</dt><dd>${item.deadline?esc(item.deadline+' '+(item.deadlineTime||'(시각 원문 확인)')):item.guide?'연도·학기별 공고 확인':'일정 미확인 · 원문 확인'}</dd></div><div><dt>기준 연도 · 확인일</dt><dd>${item.basisYear||'공고별'} · ${item.verifiedAt||metadata.verifiedAt}</dd></div></dl>
    <section class="detail-section"><h3>내 조건과 비교</h3>${match.checks.length?match.checks.map(rule=>`<div class="condition"><span class="symbol">${rule.result==='match'?'✓':rule.result==='mismatch'?'−':'?'}</span><div>${esc(rule.label)}<span class="condition-state">${rule.result==='match'?'입력 정보와 부합':rule.result==='mismatch'?'입력 정보와 다름':'추가 확인'}</span><p class="evidence">근거: ${esc(rule.evidence)}</p></div></div>`).join(''):'<p class="detail-foot">세부 요강을 확인해야 하므로 자동 조건 비교를 적용하지 않습니다.</p>'}</section>
    <section class="detail-section"><h3>공식 안내의 주요 조건</h3><ul class="detail-list">${(item.requirements||[]).length?item.requirements.map(s=>`<li>${esc(s)}</li>`).join(''):'<li>공식 원문에 기재된 세부 선발 조건을 확인하세요.</li>'}</ul></section>
    <section class="detail-section"><h3>추가로 확인할 질문</h3><ul class="detail-list">${item.unknowns.map(s=>`<li>${esc(s)}</li>`).join('')}</ul></section>
    <div class="detail-note">${esc(item.note)}${item.overlap?`<br><b>중복 수혜:</b> ${esc(item.overlap)}`:''}</div>
    <section class="detail-section"><h3>신청 준비 체크리스트 <span id="check-count" class="tiny muted"></span></h3><div class="progress"><i id="detail-progress"></i></div><div id="checklist">${item.steps.map((step,i)=>`<label class="detail-check"><input type="checkbox" data-check="${i}" ${saved?.checks.includes(i)?'checked':''}>${esc(step)}</label>`).join('')}</div><p class="detail-foot">개인 준비 기록입니다. 체크해도 실제 기관에 신청되거나 서류가 제출되지 않습니다.</p><label class="detail-stage">나의 진행 상황<select id="detail-stage">${Object.entries(STAGES).map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}</select></label></section>
    <section class="detail-section"><h3><label for="detail-memo">나의 메모</label></h3><textarea id="detail-memo" class="detail-memo" maxlength="2000" placeholder="담당자에게 물어볼 질문, 준비 상황 등을 적어두세요.">${esc(saved?.note||'')}</textarea></section>
    <div class="detail-actions"><a class="button dark" href="${url(item.sourceUrl)}" target="_blank" rel="noopener">공식 원문 확인 ↗</a>${item.applicationUrl&&item.applicationUrl!==item.sourceUrl?`<a class="button" href="${url(item.applicationUrl)}" target="_blank" rel="noopener">신청 경로 열기 ↗</a>`:''}${item.deadline?'<button class="button" id="calendar">마감일 캘린더 ↓</button>':''}<button class="button" id="detail-save"></button></div><p class="detail-source">출처: <a href="${url(item.sourceUrl)}" target="_blank" rel="noopener">${esc(item.organization)} 공식 자료 ↗</a>${(item.sources||[]).slice(1).map(s=>` · <a href="${url(s.url)}" target="_blank" rel="noopener">${esc(s.label||'추가 근거')} ↗</a>`).join('')}</p><p class="detail-foot">학과·학교 추천 마감이 기관 마감보다 이를 수 있습니다. 최종 자격·지원금·선발 결과는 운영기관에서 확인하세요.</p></div>`;
  $('#checklist').onchange=()=>{
    ensureSaved(id);state.saved[id].checks=[...document.querySelectorAll('[data-check]:checked')].map(x=>Number(x.dataset.check));
    if(state.saved[id].stage==='interested'&&state.saved[id].checks.length)state.saved[id].stage='preparing';
    persist();detailProgress(item);render();
  };
  $('#detail-memo').oninput=e=>{ensureSaved(id);state.saved[id].note=e.target.value;persist();detailProgress(item);render();};
  $('#detail-stage').onchange=e=>{ensureSaved(id);state.saved[id].stage=e.target.value;persist();detailProgress(item);render();};
  $('#detail-save').onclick=()=>{toggleSave(id);showDetail(id);};
  if($('#calendar'))$('#calendar').onclick=()=>download(`${id}.ics`,calendarFile(item),'text/calendar;charset=utf-8');
  detailProgress(item);
  if(!$('#detail-dialog').open)$('#detail-dialog').showModal();
}
function renderProfileForm(){
  const fieldHTML=definition=>{
    const fieldId=`profile-${definition.name}`;
    const input=definition.options?`<select id="${fieldId}" name="${definition.name}"><option value="">선택하지 않음</option>${definition.options.map(([value,label])=>`<option value="${esc(value)}">${esc(label)}</option>`).join('')}</select>`:`<input id="${fieldId}" name="${definition.name}" type="${definition.type||'text'}" ${definition.type==='number'?`min="${definition.min}" max="${definition.max}" step="${definition.step||'1'}"`:`maxlength="${definition.maxLength||100}"`} placeholder="${esc(definition.placeholder||'미입력')}" autocomplete="off">`;
    return `<label class="field" for="${fieldId}">${esc(definition.label)}${input}${definition.hint?`<small>${esc(definition.hint)}</small>`:''}</label>`;
  };
  $('#profile-fields').innerHTML=GROUPS.map(group=>`<section class="profile-group">${group.collapsible?`<details><summary>${esc(group.title)} · 선택 항목</summary>`:`<h3>${esc(group.title)} <small>${esc(group.hint)}</small></h3>`}<div class="fields">${group.fields.map(fieldHTML).join('')}</div>${group.collapsible?'</details>':''}</section>`).join('');
  for(const definition of fieldDefinitions)$('#profile-form').elements.namedItem(definition.name).value=state.profile[definition.name]||'';
}
function openProfile(){renderProfileForm();$('#profile-dialog').showModal();}
function resetFilters(){
  category='';page=1;for(const name of ['search','benefit-filter','region-filter','phase-filter'])$(`#${name}`).value='';
  $('#hide-mismatch').checked=false;$('#show-closed').checked=false;
  document.querySelectorAll('[data-category]').forEach(x=>{x.classList.toggle('selected',x.dataset.category==='');x.setAttribute('aria-pressed',String(x.dataset.category===''));});
  render();
}
function backup(){download('장학한눈에-개인기록.json',JSON.stringify({version:2,exportedAt:new Date().toISOString(),...state},null,2),'application/json;charset=utf-8');}
function initialize(){
  $('#region-filter').insertAdjacentHTML('beforeend',REGIONS.map(region=>`<option>${region}</option>`).join(''));
  $('#faqs').innerHTML=FAQS.map(([question,answer])=>`<details class="faq"><summary>${esc(question)}</summary><p>${esc(answer)}</p></details>`).join('');
  if(matchMedia('(max-width:780px)').matches)$('#filter-details').open=false;
  document.addEventListener('click',e=>{
    const button=e.target.closest('button');if(!button)return;
    if(button.hasAttribute('data-profile'))openProfile();
    if(button.dataset.view)setView(button.dataset.view);
    if(button.dataset.close)$(`#${button.dataset.close}`).close();
    if(button.dataset.detail)showDetail(button.dataset.detail);
    if(button.dataset.save)toggleSave(button.dataset.save);
    if(button.hasAttribute('data-category')){
      category=button.dataset.category;page=1;
      document.querySelectorAll('[data-category]').forEach(x=>{x.classList.toggle('selected',x===button);x.setAttribute('aria-pressed',String(x===button));});render();
    }
    if(button.hasAttribute('data-stage')){stage=button.dataset.stage;document.querySelectorAll('[data-stage]').forEach(x=>x.classList.toggle('selected',x===button));renderSaved();}
    if(button.hasAttribute('data-page')){page=Number(button.dataset.page);renderResults();$('.results').scrollIntoView({block:'start'});}
  });
  for(const name of ['search','benefit-filter','region-filter','phase-filter','sort','hide-mismatch','show-closed'])$(`#${name}`).addEventListener(name==='search'?'input':'change',()=>{page=1;if(loaded)renderResults();});
  for(const name of ['reset-filters','clear-filters'])$(`#${name}`).onclick=resetFilters;
  $('#profile-form').onsubmit=e=>{
    e.preventDefault();const values=Object.fromEntries(new FormData(e.target));
    const scale=Number(values.gpaScale);
    if(scale&&[values.gpa,values.cumulativeGpa].some(x=>x!==''&&Number(x)>scale)){toast('입력한 평점이 만점 기준보다 높아요.');return;}
    state.profile=sanitizeState({profile:values}).profile;page=1;
    if(persist())toast('내 조건을 적용했어요.');$('#profile-dialog').close();render();
    $('#estimate').textContent='조건이 변경됐어요. 금액을 다시 계산해 주세요.';
  };
  $('#reset-profile').onclick=()=>{state.profile={};renderProfileForm();persist();render();toast('내 조건을 초기화했어요.');};
  $('#saved-cards').onchange=e=>{const id=e.target.dataset.savedStage;if(id&&state.saved[id]){state.saved[id].stage=e.target.value;persist();renderSaved();}};
  $('#calculator').onsubmit=e=>{
    e.preventDefault();const values=Object.fromEntries(new FormData(e.target));
    const result=tuitionEstimate(state.profile,values.tuition,values.other,values.program);
    if(!result){$('#estimate').textContent='2026년으로 통지받은 학자금 지원구간을 프로필에 입력해 주세요. 2027 기준과 혼용하지 않습니다.';return;}
    const won=n=>`${n.toLocaleString('ko-KR')}원`;
    $('#estimate').innerHTML=`<span>입력값과 지원금 표에 따른 이번 학기 상한</span><strong>${won(result.estimated)}</strong><small>실제 지급 예정액이 아닙니다. 자격 심사를 통과하고 등록금 잔액이 인정되는 경우의 상한입니다.</small><dl><div><dt>장학 유형별 학기 상한</dt><dd>${Number.isFinite(result.cap)?won(result.cap):'등록금 전액'}</dd></div><div><dt>다른 지원 차감 후 등록금</dt><dd>${won(result.remaining)}</dd></div></dl>${result.excess?'<p class="detail-foot">다른 등록금성 지원이 등록금을 초과했습니다. 기관에 중복지원 해소 여부를 확인하세요.</p>':''}`;
  };
  for(const name of ['export-data','backup'])$(`#${name}`).onclick=backup;
  $('#restore').onchange=async e=>{
    const file=e.target.files?.[0];if(!file)return;
    try{
      if(file.size>500000)throw Error('size');const raw=JSON.parse(await file.text());
      if(raw.version!==2||!raw.profile||!raw.saved)throw Error('format');
      if(!confirm('백업 파일의 기록으로 현재 프로필과 지원함을 바꿀까요?'))return;
      state=sanitizeState(raw);persist();render();toast('백업 기록을 불러왔어요.');
    }catch{toast('이 사이트에서 내보낸 500KB 이하 JSON 백업 파일을 선택해 주세요.');}
    finally{e.target.value='';}
  };
  $('#clear-data').onclick=()=>{
    if(!confirm('프로필·지원함·메모를 모두 지울까요? 백업이 없다면 복원할 수 없어요.'))return;
    state=sanitizeState(null);try{localStorage.removeItem(STORAGE_KEY);localStorage.removeItem(OLD_KEY);}catch{}
    render();$('#estimate').textContent='선발 여부를 예측하는 계산기가 아닙니다.';toast('이 사이트의 개인 기록을 지웠어요.');
  };
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!document.querySelector('dialog[open]')&&!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();setView('explore');$('#search').focus();}});
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)dialog.close();}));
}
initialize();render();
try{
  const response=await fetch('./data.json',{cache:'no-cache'});if(!response.ok)throw Error(response.status);
  metadata=await response.json();if(!Array.isArray(metadata.scholarships)||!Array.isArray(metadata.directory))throw Error('format');
  items=metadata.scholarships;loaded=true;
  $('#verified-date').textContent=metadata.verifiedAt.replaceAll('-','.');$('#coverage').textContent=metadata.coverage;
  $('#source-directory').innerHTML=metadata.directory.map(source=>`<article class="directory-item"><span>${esc(source.region)}</span><a href="${url(source.url)}" target="_blank" rel="noopener">${esc(source.organization)} <span>↗</span></a><p>${esc(source.note)}</p></article>`).join('');
  render();
}catch{
  $('#result-count').textContent='불러오기 실패';$('#cards').innerHTML='<div class="box"><h3>자료를 불러오지 못했어요.</h3><p>인터넷 연결을 확인하고 다시 열어 주세요.</p><a class="button" href="./">다시 불러오기 ↻</a></div>';
}
setInterval(()=>{if(loaded)render();},60000);
