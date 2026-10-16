import type {Event} from './model';
export function demoEvents():Event[]{const base=new Date(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul'}).format(new Date())+'T12:00:00+09:00');const offset=(n:number)=>{const d=new Date(base);d.setDate(d.getDate()+n);return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul'}).format(d)};return [
{title:'점심 공강, 캠퍼스 토크',start:'12:00',end:'13:00',benefit:'샌드위치 + 아메리카노',location:'학생회관 라운지',rule:'참석자 전원 · 사전신청 40명',registration:'required',category:'food'},
{title:'작게 시작하는 AI 워크숍',start:'15:00',end:'16:30',benefit:'커피 기프티콘 5천원권',location:'중앙도서관 세미나실',rule:'교육 수료 + 설문 완료 시 지급',registration:'required',category:'gift'},
{title:'책과 함께하는 느린 오후',start:'12:30',end:'13:30',benefit:'쿠키와 음료',location:'중앙도서관',rule:'현장 선착순 30명 · 소진 시 종료',registration:'none',category:'food'},
{title:'마음 체크인 온라인 특강',start:'17:00',end:null,benefit:'모바일 상품권 추첨',location:'온라인',rule:'참여 후 추첨 · 전원 지급 아님',registration:'unknown',category:'gift'}
].map((e,i)=>({...e,id:'demo-'+i,date:offset(i+2),source:'notice',sourceUrl:'',eligibility:'체험용 가상 행사',evidence:'화면 체험용 가상 데이터입니다.',verifiedAt:offset(0),demo:true,uncertain:i===3?['종료시간 미확인']:[],deadline:i<2?offset(i+1):null} as Event))}
