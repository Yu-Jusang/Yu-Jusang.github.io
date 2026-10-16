'use client';
import {useEffect,useState} from 'react';
import {ArrowUpRight,RefreshCw} from 'lucide-react';
import {sourceRegistry} from './source-registry';
export type SourceCheck={key:string;state:'ok'|'browser_only'|'blocked'|'error'|'pending';checkedAt:string;detail?:string};
export default function SourcePanel({checks=[]}:{checks?:SourceCheck[]}){
 return <div className="source-catalog"><div className="catalog-header"><h3>학과·단과대 10곳 + 학교 공지 2곳</h3><p>생명과학부와 물리·천문학부는 우선 확인 대상입니다.</p></div>{['notice','instagram'].map(kind=><section key={kind}>{kind==='instagram'&&<div className="catalog-header"><h3>학생회 인스타 6곳</h3><p>브라우저 확인과 무인 자동 수집을 구분합니다. 로그인 제한은 수집 성공으로 처리하지 않습니다.</p></div>}<div className="source-cards">{sourceRegistry.filter(s=>s.kind===kind).map(s=>{const c=checks.find(c=>c.key===s.key);return <a className={'source-card '+(s.priority?'priority-source':'')} key={s.key} href={s.url} target="_blank" rel="noopener noreferrer"><div><strong>{s.name}</strong><ArrowUpRight size={14}/></div><small>{s.kind==='instagram'?'@'+s.url.split('/')[3]:new URL(s.url).hostname}{s.priority?' · 우선 확인':''}</small><span className={'source-state '+(c?.state==='ok'?'success':'')}>{!c?'확인 대기':c.state==='ok'?'본문 접근 확인':c.state==='browser_only'?'브라우저 확인 · 자동수집 제한':c.state==='blocked'?'접근 제한':c.state==='pending'?'확인 대기':'수집 오류'}</span>{c?.checkedAt&&<time>{new Date(c.checkedAt).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})}</time>}{c?.detail&&<p>{c.detail}</p>}</a>})}</div></section>)}</div>
}
