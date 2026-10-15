const SAMPLE = [
  ['인간과건강','811.214','001','간호학과','간호대학','학사','전공',1,'황보영',3,'미공개'],
  ['건축과 컴퓨터','4012.203','001','건축학과','공과대학','학사','전공',1,'미정',3,'미공개'],
  ['건축과 컴퓨터','4012.203','002','건축학과','공과대학','학사','전공',1,'미정',3,'미공개'],
  ['기초스튜디오 1 (건축과 표현)','M1498.000700','001','건축학과','공과대학','학사','전공',1,'미정',3,'미공개'],
  ['기초스튜디오 1 (건축과 표현)','M1498.000700','002','건축학과','공과대학','학사','전공',1,'미정',3,'미공개'],
  ['경영을 위한 경제학','M2171.001900','001','경영대학','경영대학','학사','전공',1,'송준',3,'미공개'],
  ['경영을 위한 경제학','M2171.001900','002','경영대학','경영대학','학사','전공',1,'송준',3,'미공개'],
  ['경영을 위한 경제학','M2171.001900','003','경영대학','경영대학','학사','전공',1,'조용수',3,'미공개'],
  ['경영을 위한 경제학','M2171.001900','004','경영대학','경영대학','학사','전공',1,'조용수',3,'미공개'],
  ['경영전략 연구방법론','M1338.001400','002','경영대학','경영대학','대학원','전공',1,'강효석',3,'미공개'],
  ['경영학과 나의 미래','M2171.002000','001','경영대학','경영대학','학사','전공',1,'이용규',1,'미공개'],
  ['소비자행동론연구','251.575','001','경영대학','경영대학','대학원','전공',1,'이경미',3,'미공개'],
  ['회계원리','251.205','001','경영대학','경영대학','학사','전공',1,'백복현',3,'미공개'],
  ['회계원리','251.205','002','경영대학','경영대학','학사','전공',1,'최종학',3,'미공개'],
  ['회계원리','251.205','003','경영대학','경영대학','학사','전공',1,'최선화',3,'미공개'],
  ['회계원리','251.205','004','경영대학','경영대학','학사','전공',1,'서정연',3,'미공개'],
  ['회계원리','251.205','005','경영대학','경영대학','학사','전공',1,'마흐사 베흐남라드',3,'미공개'],
  ['경제원론 1','200.105','001','경제학부','사회과학대학','학사','전공',1,'김대일',3,'미공개'],
  ['경제원론 1','200.105','002','경제학부','사회과학대학','학사','전공',1,'박지형',3,'미공개'],
  ['경제원론 1','200.105','003','경제학부','사회과학대학','학사','전공',1,'안동현',3,'미공개'],
  ['경제원론 1','200.105','004','경제학부','사회과학대학','학사','전공',1,'윤참나',3,'미공개'],
  ['경제원론 2','200.106','001','경제학부','사회과학대학','학사','전공',1,'윤택',3,'미공개'],
  ['경제원론 2','200.106','002','경제학부','사회과학대학','학사','전공',1,'박이택',3,'미공개'],
  ['경제원론 2','200.106','003','경제학부','사회과학대학','학사','전공',1,'이창선',3,'미공개'],
  ['선사기술','116.571','001','고고미술사학과(고고학전공)','인문대학','대학원','전공',1,'성춘택',3,'미공개'],
  ['지질고고학','116.568','001','고고미술사학과(고고학전공)','인문대학','대학원','전공',1,'Jennifer Bates',3,'미공개'],
  ['토기론','116.564','001','고고미술사학과(고고학전공)','인문대학','대학원','전공',1,'김장석',3,'미공개'],
  ['머신러닝을 위한 기초 수학 및 프로그래밍 실습','M2867.006500','001','공학전문대학원','공학전문대학원','대학원','전공',1,'김성우',3,'미공개'],
  ['응용공학특론 (Physical AI)','M2866.001300','002','공학전문대학원','공학전문대학원','대학원','전공',1,'김성우',3,'미공개'],
  ['전력기술의 원리','M2866.003100','001','공학전문대학원','공학전문대학원','대학원','전공',1,'이규섭',3,'미공개'],
  ['관악실기(악기명)','6532.2240','001','관현악과','음악대학','학사','전공',1,'미정',2,'미공개'],
  ['관악실기(악기명)','6532.2240','002','관현악과','음악대학','학사','전공',1,'미정',2,'미공개'],
  ['관악실기(전공악기명)','657.708','001','관현악과','음악대학','대학원','전공',1,'미정',3,'미공개']
];
const KEYS=['course','code','section','department','college','level','major','year','professor','credits','time'];
const $=id=>document.getElementById(id);
const sampleRows=SAMPLE.map((row,index)=>Object.fromEntries(KEYS.map((key,i)=>[key,row[i]]).concat([['id',index]])));
let rows=sampleRows.slice(),page=1,status='',selectedId=null;
const PAGE_SIZE=12;
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const fmt=n=>Number(n).toLocaleString('ko-KR');
const clean=value=>String(value??'').trim();
const assigned=row=>clean(row.professor)!==''&&clean(row.professor)!=='미정';
function resetPage(){page=1;render()}
function fillSelect(id,values,allLabel){const el=$(id),before=el.value;el.replaceChildren(new Option(allLabel,''),...values.map(v=>new Option(v,v)));el.value=values.includes(before)?before:''}
function setupOptions(){const colleges=[...new Set(rows.map(r=>r.college).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));fillSelect('collegeSelect',colleges,'전체 단과대');const currentCollege=$('collegeSelect').value;const departments=[...new Set(rows.filter(r=>!currentCollege||r.college===currentCollege).map(r=>r.department).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));fillSelect('departmentSelect',departments,'전체 학과')}
function renderDepartments(){const counts=new Map();for(const r of rows){const item=counts.get(r.department)||{total:0,assigned:0};item.total++;if(assigned(r))item.assigned++;counts.set(r.department,item)}$('departmentCount').textContent=`${counts.size}개`;$('allCount').textContent=fmt(rows.length);const query=$('departmentSearch').value.trim().toLocaleLowerCase();const current=$('departmentSelect').value;$('allDepartments').classList.toggle('active',!current);const list=$('departmentList');list.replaceChildren();for(const name of [...counts.keys()].sort((a,b)=>a.localeCompare(b,'ko'))){if(!name.toLocaleLowerCase().includes(query))continue;const count=counts.get(name);const btn=document.createElement('button');btn.type='button';btn.className='department'+(name===current?' active':'');btn.innerHTML=`<span>${esc(name)}</span><strong>${fmt(count.assigned)} / ${fmt(count.total)}</strong>`;btn.addEventListener('click',()=>{const college=rows.find(r=>r.department===name)?.college||'';$('collegeSelect').value=college;setupOptions();$('departmentSelect').value=name;resetPage()});list.append(btn)}}
function filtered(includeStatus=true){const course=$('courseSearch').value.trim().toLocaleLowerCase(),professor=$('professorSearch').value.trim().toLocaleLowerCase(),college=$('collegeSelect').value,department=$('departmentSelect').value,major=$('majorSelect').value,level=$('levelSelect').value;return rows.filter(r=>(!college||r.college===college)&&(!department||r.department===department)&&(!major||r.major===major)&&(!level||r.level===level)&&(!course||`${r.course} ${r.code}`.toLocaleLowerCase().includes(course))&&(!professor||r.professor.toLocaleLowerCase().includes(professor))&&(!includeStatus||!status||(status==='assigned'?assigned(r):!assigned(r))))}
function sorted(data){const key=$('sortSelect').value;const copy=data.slice();if(key==='default')return copy.sort((a,b)=>Number(a.year)-Number(b.year)||a.id-b.id);const field={course:'course',professor:'professor',department:'department'}[key];return copy.sort((a,b)=>String(a[field]).localeCompare(String(b[field]),'ko')||a.id-b.id)}
function render(){setupOptions();renderDepartments();$('selectedDepartment').textContent=$('departmentSelect').value||'전체 학과';const base=filtered(false),data=sorted(filtered());const assignedCount=base.filter(assigned).length;$('totalStat').textContent=fmt(base.length);$('assignedStat').textContent=fmt(assignedCount);$('unassignedStat').textContent=fmt(base.length-assignedCount);$('timeStat').textContent=fmt(base.filter(r=>r.time&&r.time!=='미공개').length);$('allStatusCount').textContent=fmt(base.length);$('assignedStatusCount').textContent=fmt(assignedCount);$('unassignedStatusCount').textContent=fmt(base.length-assignedCount);document.querySelectorAll('.status').forEach(btn=>btn.classList.toggle('active',btn.dataset.status===status));const pages=Math.max(1,Math.ceil(data.length/PAGE_SIZE));page=Math.min(page,pages);const start=(page-1)*PAGE_SIZE;const list=$('courseTable');list.replaceChildren();for(const row of data.slice(start,start+PAGE_SIZE)){const tr=document.createElement('tr');tr.innerHTML=`<td><button type="button" class="course-name">${esc(row.course)}</button><small>${esc(row.code)} · ${esc(row.section)}</small></td><td>${esc(row.department)}</td><td>${esc(row.level)} · ${esc(row.major)}<small>${esc(row.year)}학년</small></td><td><span class="pill ${assigned(row)?'ok':''}">${esc(row.professor||'미정')}</span></td><td>${esc(row.credits)}</td><td>${esc(row.time||'미공개')}</td>`;tr.querySelector('button').addEventListener('click',()=>showDetail(row));list.append(tr)}$('emptyMessage').hidden=data.length!==0;$('rangeLabel').textContent=data.length?`${fmt(data.length)}개 중 ${fmt(start+1)}–${fmt(Math.min(start+PAGE_SIZE,data.length))}`:'0개';$('pageLabel').textContent=`${page} / ${pages}`;$('previousPage').disabled=page<=1;$('nextPage').disabled=page>=pages}
function showDetail(r){$('detailBody').innerHTML=`<dl class="detail-grid"><dt>과목</dt><dd>${esc(r.course)}</dd><dt>과목번호</dt><dd>${esc(r.code)} · ${esc(r.section)}</dd><dt>학과</dt><dd>${esc(r.department)}</dd><dt>단과대</dt><dd>${esc(r.college)}</dd><dt>과정</dt><dd>${esc(r.level)} · ${esc(r.major)} · ${esc(r.year)}학년</dd><dt>담당교수</dt><dd>${esc(r.professor||'미정')}</dd><dt>학점</dt><dd>${esc(r.credits)}</dd><dt>강의시간</dt><dd>${esc(r.time||'미공개')}</dd></dl>`;$('detailDialog').showModal()}
function resetFilters(){for(const id of ['collegeSelect','departmentSelect','majorSelect','levelSelect','courseSearch','professorSearch','departmentSearch'])$(id).value='';$('sortSelect').value='default';status='';resetPage()}
function csvCell(value){const s=String(value??'');return /[",\r\n]/.test(s)?'"'+s.replaceAll('"','""')+'"':s}
function downloadCsv(){const headers=['과목명','과목번호','분반','학과','단과대','과정','전공여부','학년','담당교수','학점','강의시간'];const lines=[headers.join(','),...sorted(filtered()).map(r=>KEYS.map(k=>csvCell(r[k])).join(','))];const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='교수배정-현재목록.csv';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function parseCsv(text){const out=[],row=[];let field='',quoted=false;for(let i=0;i<text.length;i++){const ch=text[i];if(quoted){if(ch==='"'&&text[i+1]==='"'){field+='"';i++}else if(ch==='"')quoted=false;else field+=ch}else if(ch==='"')quoted=true;else if(ch===','){row.push(field);field=''}else if(ch==='\r'||ch==='\n'){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(v=>v!==''))out.push(row.slice());row.length=0;field=''}else field+=ch}if(quoted)throw Error('CSV 따옴표가 닫히지 않았습니다.');row.push(field);if(row.some(v=>v!==''))out.push(row);return out}
async function importCsv(file){try{const matrix=parseCsv((await file.text()).replace(/^\ufeff/,''));if(matrix.length<2)throw Error('헤더와 강좌 데이터가 필요합니다.');const header=matrix.shift().map(clean);const labels=['과목명','과목번호','분반','학과','단과대','과정','전공여부','학년','담당교수','학점','강의시간'];const indexes=labels.map(v=>header.indexOf(v));if(indexes.some(i=>i<0))throw Error(`필요한 열이 없습니다: ${labels.filter((_,i)=>indexes[i]<0).join(', ')}`);const next=matrix.map((cells,id)=>Object.fromEntries(KEYS.map((key,i)=>[key,clean(cells[indexes[i]])]).concat([['id',id]]))).filter(r=>r.course&&r.department);if(!next.length)throw Error('유효한 강좌가 없습니다.');rows=next;resetFilters();$('dataNote').textContent=`내 CSV · ${fmt(rows.length)}개 강좌`;$('importMessage').textContent=`${fmt(rows.length)}개 강좌를 불러왔습니다. 이 데이터는 브라우저에만 있습니다.`}catch(error){$('importMessage').textContent=`불러오기 실패: ${error.message}`}finally{$('csvInput').value=''}}
for(const id of ['departmentSearch','courseSearch','professorSearch'])$(id).addEventListener('input',id==='departmentSearch'?renderDepartments:resetPage);
for(const id of ['departmentSelect','majorSelect','levelSelect','sortSelect'])$(id).addEventListener('change',resetPage);
$('collegeSelect').addEventListener('change',()=>{$('departmentSelect').value='';resetPage()});
$('allDepartments').addEventListener('click',()=>{$('collegeSelect').value='';$('departmentSelect').value='';resetPage()});
document.querySelectorAll('.status').forEach(btn=>btn.addEventListener('click',()=>{status=btn.dataset.status;resetPage()}));
$('resetFilters').addEventListener('click',resetFilters);$('previousPage').addEventListener('click',()=>{page--;render()});$('nextPage').addEventListener('click',()=>{page++;render()});$('exportButton').addEventListener('click',downloadCsv);
$('csvInput').addEventListener('change',event=>{if(event.target.files[0])importCsv(event.target.files[0])});$('restoreSample').addEventListener('click',()=>{rows=sampleRows.slice();resetFilters();$('dataNote').textContent='공개 페이지에서 확인한 일부 강좌로 만든 체험판';$('importMessage').textContent='샘플 데이터로 돌아왔습니다.'});
$('closeDialog').addEventListener('click',()=>$('detailDialog').close());$('detailDialog').addEventListener('click',event=>{if(event.target===$('detailDialog'))$('detailDialog').close()});
$('themeButton').addEventListener('click',()=>{document.body.classList.toggle('dark');localStorage.setItem('course-demo-theme',document.body.classList.contains('dark')?'dark':'light')});if(localStorage.getItem('course-demo-theme')==='dark')document.body.classList.add('dark');
render();

