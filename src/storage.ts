import type { FamilyState } from './types';
export function initialState(): FamilyState { return { version: 1, members: [{ id: 'me', name: '나', relation: '본인' }], policies: [], messages: [], activeId: 'me' }; }
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => { const r = indexedDB.open('yakgwan-family-v1', 1); r.onupgradeneeded = () => r.result.createObjectStore('family'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
}
export async function loadState(): Promise<FamilyState> {
  const db = await openDB();
  return new Promise((resolve, reject) => { const tx = db.transaction('family'); const r = tx.objectStore('family').get('state'); r.onsuccess = () => resolve(r.result?.version === 1 ? r.result : initialState()); r.onerror = () => reject(r.error); tx.oncomplete = () => db.close(); });
}
export async function saveState(state: FamilyState): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => { const tx = db.transaction('family', 'readwrite'); tx.objectStore('family').put(state, 'state'); tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = tx.onabort = () => { db.close(); reject(tx.error); }; });
}
export function removeMember(state: FamilyState, id: string): FamilyState {
  const members = state.members.filter(m => m.id !== id);
  if (!members.length) throw new Error('가족은 최소 한 명 필요합니다.');
  return { ...state, members, policies: state.policies.filter(p => p.memberId !== id), messages: state.messages.filter(m => m.memberId !== id), activeId: state.activeId === id ? members[0].id : state.activeId };
}
export function removePolicy(state: FamilyState, id: string): FamilyState {
  // Old answers may contain excerpts from the removed document. Remove those too.
  return { ...state, policies: state.policies.filter(p => p.id !== id), messages: state.messages.filter(m => ![...m.answer.evidence, ...m.answer.cautions].some(e => e.policyId === id)) };
}
