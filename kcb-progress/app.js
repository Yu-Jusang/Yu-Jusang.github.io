const text=(tag,value,className)=>{const el=document.createElement(tag);el.textContent=value;if(className)el.className=className;return el;};
const date=value=>new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value))+' KST';
let refreshing=false;
async function refresh(){
  if(refreshing)return;refreshing=true;
  const connection=document.getElementById('connection');
  try{
    const response=await fetch('./progress.json?check='+Date.now(),{cache:'no-store'});
    if(!response.ok)throw new Error('HTTP '+response.status);
    const data=await response.json();
    document.getElementById('state').textContent=data.state_label;
    document.getElementById('headline').textContent=data.headline;
    document.getElementById('summary').textContent=data.summary;
    document.getElementById('updated').textContent='마지막 게시 · '+date(data.updated_at);
    const steps=data.steps.map((s,i)=>{const li=document.createElement('li');li.append(text('span',String(i+1).padStart(2,'0'),'step-no'));const content=document.createElement('div');content.append(text('h3',s.title),text('p',s.detail));li.append(content,text('span',s.label,'label '+s.status));return li;});
    document.getElementById('steps').replaceChildren(...steps);
    document.getElementById('metrics').replaceChildren(...data.metrics.map(m=>{const tr=document.createElement('tr');for(const v of [m.name,(100*m.a).toFixed(4)+'%',(100*m.b).toFixed(4)+'%',m.source])tr.append(text('td',v));return tr;}));
    document.getElementById('events').replaceChildren(...data.events.map(e=>{const li=document.createElement('li');const t=text('time',date(e.at));t.dateTime=e.at;const content=document.createElement('div');content.append(text('h3',e.title),text('p',e.detail));li.append(t,content);return li;}));
    connection.textContent='연결됨 · 마지막 확인 '+date(new Date());connection.className='';
  }catch(error){connection.textContent='최신 상태를 가져오지 못했습니다. 마지막 표시가 최신이 아닐 수 있습니다.';connection.className='connection-error';}
  finally{refreshing=false;}
}
document.getElementById('refresh').addEventListener('click',refresh);
refresh();setInterval(()=>{if(!document.hidden)refresh();},20000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
