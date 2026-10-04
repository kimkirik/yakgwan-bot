import {describe,it,expect} from 'vitest';
import {answerQuestion} from '../src/retrieval';
import {initialState,removeMember,removePolicy} from '../src/storage';
import type {Policy} from '../src/types';
const policy:Policy={id:'p1',memberId:'me',name:'테스트 약관',blob:new Blob(),addedAt:'2026-10-04',fingerprint:'abc',unreadable:[],pages:[{number:1,text:'제1조 입원급여금\n질병으로 입원하면 1일당 30,000원을 지급합니다. 최대 30일입니다.'},{number:2,text:'제2조 암진단비\n일반암 진단 시 10,000,000원을 최초 1회 지급합니다.'},{number:3,text:'제3조 보장하지 않는 경우\n미용 목적 성형수술은 보장하지 않습니다. 암 보장개시는 계약일부터 90일 후입니다.'},{number:4,text:'제4조 보험금 청구\n진단서와 영수증, 입퇴원 확인서를 제출합니다.'}]};
describe('근거 기반 답변',()=>{
 it('입원 질문에 정확한 페이지와 금액 원문을 제공한다',()=>{const a=answerQuestion('입원비는 얼마나 보장돼?', [policy]);expect(a.missing).toBe(false);expect(a.evidence[0].page).toBe(1);expect(a.evidence[0].text).toContain('30,000');expect(a.cautions.some(e=>e.page===3)).toBe(true);});
 it('약관에 없는 담보를 보장한다고 만들지 않는다',()=>{const a=answerQuestion('임플란트도 보장되나요?', [policy]);expect(a.missing).toBe(true);expect(a.intro).toContain('보장이 없다는 뜻은 아닙니다');});
 it('일반 보험금 단어만 겹치는 관계없는 질문은 근거 없음',()=>expect(answerQuestion('우주여행 보험금 얼마?', [policy]).missing).toBe(true));
 it('청구 서류 질문을 찾는다',()=>expect(answerQuestion('청구할 때 어떤 서류가 필요해?', [policy]).evidence.some(e=>e.page===4)).toBe(true));
 it('일상 표현의 보장 제외 질문을 찾는다',()=>expect(answerQuestion('보험금을 못 받는 경우는?', [policy]).evidence.some(e=>e.page===3)).toBe(true));
 it('전체 보장 질문은 근거가 있는 일부 조항을 제공한다',()=>expect(answerQuestion('보장범위를 정리해 줘', [policy]).evidence.length).toBeGreaterThan(0));
 it('명시적 후속 질문은 이전 담보 문맥을 사용한다',()=>expect(answerQuestion('그럼 얼마까지?', [policy],'입원 보장돼?').evidence[0].page).toBe(1));
 it('다른 가족 문서는 넘겨주지 않으면 검색되지 않는다',()=>{const other={...policy,id:'other',memberId:'mom',pages:[{number:1,text:'임플란트 1개당 80만원을 지급합니다.'}]};const visible=[policy,other].filter(p=>p.memberId==='me');expect(answerQuestion('임플란트 보험금',visible).missing).toBe(true);});
 it('빈 PDF 집합에서 생성하지 않는다',()=>expect(answerQuestion('보장범위',[]).missing).toBe(true));
});
describe('가족별 삭제와 개인정보',()=>{
 it('가족 삭제 시 해당 PDF와 대화를 함께 제거한다',()=>{const s=initialState();s.members.push({id:'mom',name:'엄마',relation:'부모'});s.policies=[policy];s.messages=[{id:'m1',memberId:'me',question:'입원',answer:answerQuestion('입원',[policy]),time:''}];const next=removeMember(s,'me');expect(next.activeId).toBe('mom');expect(next.policies).toEqual([]);expect(next.messages).toEqual([]);});
 it('문서 삭제는 원문을 인용한 대화도 제거한다',()=>{const s=initialState();s.policies=[policy];s.messages=[{id:'m',memberId:'me',question:'입원',answer:answerQuestion('입원',[policy]),time:''}];expect(removePolicy(s,'p1').messages).toEqual([]);});
 it('마지막 가족은 실수로 지우지 않는다',()=>expect(()=>removeMember(initialState(),'me')).toThrow());
});
