import type { Answer, Evidence, Policy } from './types';
const concepts: Record<string, string[]> = {
  암: ['암', '악성신생물', '암진단', '암진단비', '일반암', '유사암', '소액암', '갑상선암', '제자리암'],
  입원: ['입원', '입원비', '입원일당', '입원의료비', '병실', '입원급여금'],
  수술: ['수술', '수술비', '수술급여금'],
  통원: ['통원', '외래', '병원비', '통원의료비', '진료', '실손'],
  치과: ['치아', '치과', '임플란트', '보철', '틀니'],
  면책: ['면책', '제외', '보장하지', '지급하지', '보상하지', '미보장', '비보장', '못받', '안되는'],
  대기: ['면책기간', '보장개시', '대기기간', '책임개시', '감액', '가입후', '가입한지'],
  한도: ['한도', '얼마', '최대', '금액', '보험금', '자기부담', '공제', '횟수', '일수'],
  청구: ['청구', '서류', '진단서', '영수증', '신청', '구비', '접수'],
  해지: ['해지', '해약', '환급', '취소', '철회'],
  갱신: ['갱신', '보험료', '납입', '인상'],
  상해: ['상해', '사고', '재해', '골절', '화상'],
};
const stop = new Set(['보장','보험','약관','가능','되나요','되는지','알려줘','알려주세요','해주세요','무엇','어떻게','있나요','것은','대한','대해','저는','저의','내가','나는','받을','받나요','있어','돼','되나','합니다','전체','요약','내용','범위','정리','설명','보장범위','물어볼게','경우','얼마나','필요해','뭐가','알려','못받','조건','언제부터']);
const normalize = (s: string) => s.normalize('NFKC').toLowerCase().replace(/\s+/g,'');
function words(q: string): string[] { return q.normalize('NFKC').toLowerCase().replace(/[^가-힣a-z0-9\s]/g,' ').split(/\s+/).map(t=>t.replace(/(인가요|인가|은요|는요|까지|에서|으로|해줘|해주세요|되나요|받나요|인가요|나요|는지|적인|에도|에요|이요|은|는|을|를|이|가|도|만|에|의)$/,'')).filter(t=>t.length>=2&&!stop.has(t)); }
function matches(t: string, term: string): boolean { if(term==='암') return /암|악성신생물/.test(t); return t.includes(term); }
export function chunks(policies: Policy[]): Evidence[] {
  return policies.flatMap(p=>p.pages.flatMap(page=>{
    const blocks = page.text.split(/\n\s*\n/).filter(Boolean); const out: string[]=[];
    for (const block of blocks) {
      if(block.length<=900) out.push(block);
      else { let start=0; while(start<block.length) { let end=Math.min(start+800,block.length); if(end<block.length){ const cut=block.lastIndexOf('\n',end); if(cut>start+300)end=cut; } out.push(block.slice(start,end)); if(end===block.length)break; start=Math.max(start+1,end-120); } }
    }
    return out.filter(t=>t.trim().length>8).map((text,i)=>({id:`${p.id}:${page.number}:${i}`,policyId:p.id,policyName:p.name,page:page.number,text,score:0,ocr:page.ocr}));
  }));
}
export function answerQuestion(question: string, policies: Policy[], previousQuestion=''): Answer {
  let query=question.trim();
  if (/^(그럼|그러면|그건|그거|그것|이건|이거|그 경우|그 보장)/.test(query) && previousQuestion) query=previousQuestion+' '+query;
  const n=normalize(query); const terms=words(query);
  const active=Object.entries(concepts).filter(([,v])=>v.some(t=>n.includes(t)));
  const specific=active.filter(([key])=>['암','입원','수술','통원','치과','상해'].includes(key));
  const broad=/전체|보장\s*(범위|내용)|요약|어떤.*보장|무슨.*보장/.test(query)&&specific.length===0;
  const all=chunks(policies);
  const scored=all.map(c=>{
    const t=normalize(c.text); let score=0;
    for(const term of terms) if(matches(t,term)) score+=term.length>3?5:3;
    for(const [key,aliases] of active) { if(aliases.some(a=>matches(t,a)))score+=specific.some(([k])=>k===key)?9:4; }
    if(specific.length && !specific.some(([,aliases])=>aliases.some(a=>matches(t,a))))score=0;
    // A specific unknown subject must not match only generic "payment/limit" words.
    const genericTerms=new Set(Object.entries(concepts).filter(([key])=>!['암','입원','수술','통원','치과','상해'].includes(key)).flatMap(([,v])=>v));
    const subjects=terms.filter(x=>!Array.from(genericTerms).some(g=>x.includes(g))&&!['어떤','언제','필요한','준비','보장받','받','진단받았','들어있','보장되','가능한'].includes(x));
    if(!broad&&!specific.length&&subjects.length&&!subjects.some(x=>t.includes(x)))score=0;
    if(broad && /보장|지급사유|보험금|면책|한도|제외/.test(t))score+=5;
    if(/목차/.test(t)&&c.text.length>300)score*=0.3;
    return {...c,score};
  }).filter(c=>c.score>=3).sort((a,b)=>b.score-a.score);
  const unique=(list:Evidence[],max:number)=>{const seen=new Set<string>();return list.filter(c=>{const key=c.policyId+':'+c.page;if(seen.has(key))return false;seen.add(key);return true;}).slice(0,max);};
  const evidence=unique(scored,4);
  if(!evidence.length)return {intro:'업로드한 약관에서 질문을 뒷받침할 근거를 찾지 못했습니다. 보장이 없다는 뜻은 아닙니다. 담보명이나 질병명을 구체적으로 바꾸거나 해당 특약을 추가해 주세요.',evidence:[],cautions:[],missing:true};
  const relatedIds=new Set(evidence.map(e=>e.policyId));
  const cautions=unique(all.filter(c=>relatedIds.has(c.policyId)&&/면책|보장하지|지급하지|보상하지|보장개시|감액|자기부담|제외/.test(c.text)&&!evidence.some(e=>e.policyId===c.policyId&&e.page===c.page)),3);
  return {intro: broad?'약관에서 보장과 지급 조건이 언급된 조항을 찾았습니다. 아래 원문과 함께 제외·제한 조건도 확인해 주세요.':'질문과 관련된 약관 조항을 찾았습니다. 아래 문구는 원문 발췌이며, 지급 조건과 예외를 함께 확인해야 합니다.',evidence,cautions,missing:false};
}
