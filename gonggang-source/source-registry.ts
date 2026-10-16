export type SourceDefinition={key:string;name:string;url:string;kind:'notice'|'instagram';priority?:boolean};
export const sourceRegistry:SourceDefinition[]=[
 {key:'biosci',name:'생명과학부',url:'https://biosci.snu.ac.kr/board/notice',kind:'notice',priority:true},
 {key:'physics',name:'물리·천문학부',url:'https://physics.snu.ac.kr/boards/notice',kind:'notice',priority:true},
 {key:'science',name:'자연과학대학',url:'https://science.snu.ac.kr/news/announcement',kind:'notice'},
 {key:'engineering',name:'공과대학',url:'https://eng.snu.ac.kr/communication/notice/notice',kind:'notice'},
 {key:'cals',name:'농업생명과학대학',url:'https://cals.snu.ac.kr/board/notice',kind:'notice'},
 {key:'education',name:'사범대학',url:'https://edu.snu.ac.kr/category/board_17_gn_ldca7if5_20201130072915/',kind:'notice'},
 {key:'humanities',name:'인문대학',url:'https://humanities.snu.ac.kr/community/notice',kind:'notice'},
 {key:'social',name:'사회과학대학',url:'https://social.snu.ac.kr/공지사항/?mod=list',kind:'notice'},
 {key:'statistics',name:'통계학과',url:'https://stat.snu.ac.kr/category/board-18-gn-969abdbt-20210204013659/',kind:'notice'},
 {key:'snuti',name:'첨단융합학부',url:'https://snuti.snu.ac.kr/category/board-215-GN-IWAuloKV-20230830171309/',kind:'notice'},
 {key:'general',name:'서울대학교 대표 공지',url:'https://www.snu.ac.kr/snunow/notice/genernal',kind:'notice'},
 {key:'college',name:'학부대학',url:'https://snuc.snu.ac.kr/공지사항/',kind:'notice'},
 ...['snu_cns','snu.eng_official','snucals_stuco','ed_u_snu','humanities_snu','snucss_official'].map((handle,i)=>({key:'ig_'+handle.replaceAll('.','_'),name:['자연대 학생회','공대 학생회','농생대 학생회','사범대 학생회','인문대 학생회','사회대 학생회'][i],url:`https://www.instagram.com/${handle}/`,kind:'instagram' as const})),
];
export const sourceLabel=(type:string)=>type==='gmail'?'Gmail':type==='instagram'?'학생회 인스타':'학교 공지';
