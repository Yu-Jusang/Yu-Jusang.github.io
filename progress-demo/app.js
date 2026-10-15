const demoStages=[
  {name:'요청 접수',description:'어떤 결과를 만들지 확인하고 작업을 시작합니다.'},
  {name:'자료 확인',description:'필요한 자료와 기존 사이트의 구조를 살펴봅니다.'},
  {name:'화면 설계',description:'사용자가 볼 화면과 작업 순서를 정합니다.'},
  {name:'코드 작성',description:'실제로 동작하는 화면과 기능을 만듭니다.'},
  {name:'동작 점검',description:'버튼, 검색, 모바일 화면을 확인합니다.'},
  {name:'GitHub 업로드',description:'완성한 파일을 저장소에 올립니다.'},
  {name:'완료',description:'공개 주소에서 최종 결과를 확인합니다.'}
];
const $=id=>document.getElementById(id);
const demoSteps=$('demoSteps');
let demoIndex=-1,demoTimer=null,clockTimer=null,demoStartedAt=0;
function renderDemo(){
  const complete=demoIndex===demoStages.length-1;
  const percent=demoIndex<0?0:Math.round((demoIndex+1)/demoStages.length*100);
  $('demoCurrent').textContent=demoIndex<0?'시작을 기다리고 있어요':complete?'모든 단계가 끝났어요':demoStages[demoIndex].name+' 중';
  $('demoDescription').textContent=demoIndex<0?'‘체험 실행’을 누르면 현재 단계가 약 4초마다 바뀝니다.':complete?'화면 시연이 완료됐습니다. 실제 작업 상태는 아래 GitHub 배포 현황에서 확인하세요.':demoStages[demoIndex].description;
  $('demoPercent').textContent=percent+'%';$('demoCount').textContent=`${Math.max(0,demoIndex+1)} / ${demoStages.length} 단계`;
  $('demoFill').style.width=percent+'%';$('demoBar').setAttribute('aria-valuenow',String(percent));
  demoSteps.replaceChildren(...demoStages.map((step,i)=>{const li=document.createElement('li');li.className=i<demoIndex?'done':i===demoIndex?'active':'';const num=document.createElement('span');num.className='step-number';num.textContent=String(i+1).padStart(2,'0');const name=document.createElement('span');name.className='step-name';name.textContent=step.name;li.append(num,name);return li}));
  $('startDemo').disabled=!!demoTimer || complete;
}
function updateClock(){const seconds=Math.floor((Date.now()-demoStartedAt)/1000);$('demoClock').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`}
function stopDemo(){clearInterval(demoTimer);clearInterval(clockTimer);demoTimer=null;clockTimer=null}
function advanceDemo(){demoIndex++;renderDemo();if(demoIndex===demoStages.length-1)stopDemo()}
function startDemo(){if(demoTimer)return;if(demoIndex===demoStages.length-1)demoIndex=-1;demoStartedAt=Date.now();$('demoClock').textContent='00:00';advanceDemo();clockTimer=setInterval(updateClock,1000);demoTimer=setInterval(advanceDemo,4000)}
$('startDemo').addEventListener('click',startDemo);
$('resetDemo').addEventListener('click',()=>{stopDemo();demoIndex=-1;$('demoClock').textContent='00:00';renderDemo()});
renderDemo();

const owner='Yu-Jusang',repo='Yu-Jusang.github.io';
const api=`https://api.github.com/repos/${owner}/${repo}`;
const headers={'Accept':'application/vnd.github+json'};
let previousRunId=null,refreshTimer=null;
const timeText=value=>value?new Date(value).toLocaleString('ko-KR',{dateStyle:'medium',timeStyle:'short'}):'시간 정보 없음';
function setRealState(title,description,state){$('realTitle').textContent=title;$('realDescription').textContent=description;$('realBadge').textContent=state==='running'?'진행 중':state==='success'?'완료':state==='failed'?'실패':'확인 중';$('realBadge').className='state-badge '+state}
function renderRealSteps(steps){const list=$('realSteps');list.replaceChildren(...steps.map(step=>{const li=document.createElement('li');li.className=step.state;const icon=document.createElement('span');icon.className='step-icon';icon.textContent=step.state==='done'?'✓':step.state==='failed'?'!':step.state==='running'?'●':'·';const name=document.createElement('span');name.textContent=step.name;li.append(icon,name);if(step.time){const em=document.createElement('em');em.textContent=step.time;li.append(em)}return li}))}
async function getJson(url){const response=await fetch(url,{headers,cache:'no-store'});if(!response.ok)throw new Error(`GitHub 응답 ${response.status}`);return response.json()}
async function refreshReal(){
  try{
    const result=await getJson(`${api}/actions/runs?per_page=12&_=${Date.now()}`);
    const runs=result.workflow_runs||[];
    const run=runs.find(item=>/pages|deploy/i.test(`${item.name||''} ${item.path||''}`))||runs[0];
    if(!run){setRealState('아직 배포 기록이 없습니다','새 변경 사항을 GitHub에 올리면 이곳에 표시됩니다.','idle');renderRealSteps([{name:'작업 대기 중',state:'idle'}]);$('apiNote').textContent='새 배포가 시작되면 자동으로 확인합니다.';return}
    previousRunId=run.id;
    const running=run.status!=='completed';const failed=run.conclusion&&run.conclusion!=='success';
    const state=running?'running':failed?'failed':'success';
    setRealState(running?'공개 페이지를 만드는 중입니다':failed?'배포 중 문제가 생겼습니다':'최근 배포가 완료됐습니다',running?'아래 목록에서 현재 진행 단계를 확인할 수 있습니다.':failed?'GitHub에서 오류 내용을 확인해 주세요.':'웹사이트가 공개된 상태입니다.',state);
    $('runTime').textContent=`${timeText(run.run_started_at||run.created_at)} 시작 · #${run.run_number||run.id}`;
    $('runLink').href=run.html_url||`https://github.com/${owner}/${repo}/actions`;
    const jobs=await getJson(`${api}/actions/runs/${run.id}/jobs?per_page=30&_=${Date.now()}`);
    const steps=(jobs.jobs||[]).flatMap(job=>{
      if(job.steps?.length)return job.steps.map(step=>({name:step.name,state:step.status==='in_progress'?'running':step.status==='queued'?'idle':step.conclusion==='success'?'done':step.conclusion==='failure'?'failed':'idle',time:step.status==='in_progress'?'현재 단계':''}));
      return [{name:job.name||'배포 준비',state:job.status==='in_progress'?'running':job.conclusion==='success'?'done':job.conclusion==='failure'?'failed':'idle',time:''}]
    });
    renderRealSteps(steps.length?steps:[{name:running?'GitHub에서 작업을 준비하고 있습니다':'배포 기록을 확인했습니다',state:running?'running':'done'}]);
    $('apiNote').textContent=running?'배포 중에는 약 25초마다 자동으로 확인합니다.':'새 배포가 시작되는지 약 1분마다 자동으로 확인합니다.';
  }catch(error){setRealState('배포 상태를 읽을 수 없습니다','잠시 후 자동으로 다시 확인합니다.','idle');renderRealSteps([{name:'GitHub 연결 확인 중',state:'idle'}]);$('apiNote').textContent=`연결 상태: ${error.message}. GitHub 작업 기록 링크에서 직접 확인할 수 있습니다.`}
  finally{$('lastChecked').textContent=`마지막 확인 ${new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}`;clearTimeout(refreshTimer);refreshTimer=setTimeout(refreshReal,$('realBadge').classList.contains('running')?25000:60000)}
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden){clearTimeout(refreshTimer);refreshReal()}});
refreshReal();

