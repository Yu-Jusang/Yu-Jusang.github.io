export const REGIONS=['서울','부산','대구','인천','광주','대전','울산','세종','경기','강원','충북','충남','전북','전남','경북','경남','제주'];
const yn=[['yes','해당'],['no','해당하지 않음']];
const regions=REGIONS.map(x=>[x,x]);
export const GROUPS=[
 {title:'01 · 학교와 학적',hint:'학교별·전공별 장학금',fields:[
  {name:'institution',label:'학교명',placeholder:'예: 서울대학교',maxLength:80},
  {name:'schoolRegion',label:'캠퍼스 소재지',options:[...regions,['foreign','해외']]},
  {name:'degree',label:'학위과정',options:[['undergrad','학사'],['associate','전문학사'],['master','석사'],['doctor','박사'],['integrated','석·박사통합']]},
  {name:'schoolType',label:'학교 유형',options:[['fouryear','4년제'],['college','전문대'],['cyber','방송통신·사이버'],['graduate','대학원'],['other','기타']]},
  {name:'status',label:'학적',options:[['enrolled','재학'],['returning','복학 예정'],['leave','휴학'],['completed','수료'],['freshman','학부 신입생']]},
  {name:'year',label:'학년',options:[['1','1학년'],['2','2학년'],['3','3학년'],['4','4학년'],['5','5학년 이상']]},
  {name:'major',label:'전공 계열',options:[['자연','자연과학'],['공학','공학·IT'],['인문','인문'],['사회','사회·상경'],['예체능','예술·체육'],['의약','의약·보건'],['교육','교육'],['기타','기타']]},
  {name:'department',label:'학과·전공',placeholder:'예: 통계학과',maxLength:80},
  {name:'nationality',label:'국적',options:[['kr','대한민국'],['other','그 외']]},
  {name:'firstSemester',label:'신·편입·재입학 첫 학기',options:yn},
  {name:'finalSemester',label:'졸업 학기',options:yn}
 ]},
 {title:'02 · 본인과 가족의 지역',hint:'학교 소재지와 별도',fields:[
  {name:'residence',label:'본인 주민등록 거주지',options:regions},
  {name:'parentRegion',label:'부 또는 모 주민등록 거주지',options:regions},
  {name:'residenceMonths',label:'본인 해당 지역 거주기간 (개월)',type:'number',min:0,max:1200,hint:'연속·누적 여부와 공고 기준일은 별도 확인'},
  {name:'parentMonths',label:'부모 해당 지역 거주기간 (개월)',type:'number',min:0,max:1200,hint:'한 분의 주소만 입력합니다. 부모 모두 요건은 별도 확인'},
  {name:'localHighSchool',label:'졸업 고등학교 소재지',options:[...regions,['foreign','해외']]}
 ]},
 {title:'03 · 지원구간과 성적',hint:'입력은 선택입니다',fields:[
  {name:'incomeYear',label:'지원구간 통지 기준 연도',options:[['2026','2026년'],['2027','2027년 (개편 기준 재확인)']]},
  {name:'income',label:'학자금 지원구간 (2026 체계)',options:[['basic','기초생활수급'],['near','차상위'],...Array.from({length:10},(_,i)=>[String(i+1),`${i+1}구간`]),['unassessed','미산정 / 모름']],hint:'월급으로 추정하지 않고 재단 통지 결과를 입력하세요.'},
  {name:'percentile',label:'직전학기 성적 (100점 환산)',type:'number',min:0,max:100,step:'0.01',hint:'성적표에 기재된 공식 환산 점수'},
  {name:'credits',label:'직전학기 이수학점',type:'number',min:0,max:50,step:'0.5'},
  {name:'gpaScale',label:'성적 만점 기준',options:[['4.5','4.5점'],['4.3','4.3점'],['4.0','4.0점']]},
  {name:'gpa',label:'직전학기 평점',type:'number',min:0,max:4.5,step:'0.01'},
  {name:'cumulativePercentile',label:'전체학기 성적 (100점 환산)',type:'number',min:0,max:100,step:'0.01'},
  {name:'cumulativeGpa',label:'전체학기 평점',type:'number',min:0,max:4.5,step:'0.01'}
 ]},
 {title:'04 · 해당하는 추가 조건',hint:'모르면 비워두세요',collapsible:true,fields:[
  {name:'familyChildren',label:'가구 내 자녀 수',type:'number',min:1,max:20},
  {name:'childOrder',label:'본인 출생순위',options:[['1','첫째'],['2','둘째'],['3','셋째 이상']]},
  {name:'singleParent',label:'법정 한부모가정',options:yn},
  {name:'disability',label:'장애학생',options:yn},
  {name:'care',label:'자립준비청년·보호아동',options:yn},
  {name:'veteran',label:'보훈 장학 관련 대상',options:yn},
  {name:'northKorean',label:'북한이탈주민 관련 대상',options:yn},
  {name:'rural',label:'농어촌 관련 요건',options:yn},
  {name:'working',label:'현재 산업체 재직',options:yn},
  {name:'exchange',label:'2027년 봄 해외파견 예정',options:yn},
  {name:'training',label:'이슬람권 언어 학습·연수 계획',options:yn}
 ]}
];
export const FAQS=[
 ['서울대생이 아니어도 쓸 수 있나요?','네. 국가·지역·민간 장학제도는 전국 대학생을 대상으로 탐색합니다. 교내 장학금은 해당 학교 조건을 별도로 비교합니다. 학교명은 비워둘 수 있고, 서울대생도 출신지역·부모 주소로 지역 장학금을 함께 찾아볼 수 있습니다.'],
 ['‘소득분위’와 ‘학자금 지원구간’은 같은가요?','장학 공고에서 예전 표현인 소득분위를 쓰기도 합니다. 이 사이트는 한국장학재단의 학자금 지원구간을 기준으로 비교합니다. 월급만으로 구간을 판단하지 않으며, 건강보험료나 중위소득을 따로 사용하는 재단은 그 조건을 별도로 확인해야 합니다.'],
 ['지역 장학금은 어디를 기준으로 찾나요?','학교·캠퍼스 소재지, 본인 주소, 부모 주소, 거주기간, 고교 졸업지 중 어떤 것을 요구하는지 확인하세요. ‘또는’과 ‘모두’는 다른 조건입니다. 입력하지 않은 부모 요건이나 등록기준지·누적거주 등은 충족한 것으로 간주하지 않습니다.'],
 ['성적은 4.3점에서 4.5점으로 바꿔도 되나요?','일률적인 비례 환산은 하지 않습니다. 공고가 평점 만점별 기준을 명시한 경우만 비교하고, 백분위는 학교 성적표의 공식 환산 점수를 사용합니다. 직전학기와 전체학기 성적도 따로 구분합니다.'],
 ['여러 장학금을 함께 받을 수 있나요?','등록금성 지원은 해당 학기 등록금 범위 내에서 중복지원 여부를 확인해야 합니다. 생활비·근로성 장학금도 재단 자체 중복 수혜 제한이 있을 수 있습니다. 상세 화면의 지급 성격과 주의사항을 확인하고, 애매하면 두 기관 모두에 문의하세요.'],
 ['‘조건 부합’이면 신청해도 된다는 뜻인가요?','입력한 정보와 확인한 일부 요건이 부합한다는 의미입니다. 수혜횟수·추천·대학 참여·예외 규정·첨부 서류를 포함한 모든 자격을 확인하거나 합격을 예측하는 기능은 아닙니다. 입력값이 없으면 미확인으로 남습니다.'],
 ['2027년 지원구간도 비교할 수 있나요?','한국장학재단은 2027년 1학기부터 10개 구간을 가~마 5구간으로 개편할 예정이라고 안내했습니다. 수록된 2026 숫자 구간 조건과 2027 통지 결과를 직접 비교하지 않습니다. 지원금 계산도 2026 기준에 한정합니다.'],
 ['미리 준비할 서류는 무엇인가요?','보통 신청서·재학증명서·성적증명서·지원구간통지서·주민등록 관련 증빙 등이 있으나 공고마다 다릅니다. 필수 서류는 반드시 원문을 따르고, 발급 기준일·주소변동내역 포함 여부·우편 도착 마감을 함께 확인하세요. 이 사이트에 서류를 업로드할 필요는 없습니다.'],
 ['국가장학금 신청만 하면 끝인가요?','가구원 정보제공 동의와 필요한 서류 제출, 신청 완료 상태를 확인해야 합니다. 교내·외 재단 장학금은 학과 추천이나 별도 지원서가 추가될 수 있습니다. 개인 체크리스트는 실제 기관 접수 상태와 연동되지 않습니다.'],
 ['모든 장학금이 실시간으로 올라오나요?','확인일 기준 공식 자료를 수동으로 검증해 수록했습니다. 현재 전수 수집이나 자동 갱신은 연결되어 있지 않습니다. 자료는 모집 공고와 제도 안내를 구분하며, 17개 시도 공식 경로에서 수록되지 않은 지역·시군구 장학금도 더 찾아볼 수 있습니다.']
];
export const STAGES={interested:'관심',preparing:'준비 중',submitted:'제출 기록',result:'결과 기록'};
