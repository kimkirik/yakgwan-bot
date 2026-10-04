export interface Member { id: string; name: string; relation: string }
export interface PolicyPage { number: number; text: string; ocr?: boolean }
export interface Policy { id: string; memberId: string; name: string; pages: PolicyPage[]; blob: Blob; addedAt: string; fingerprint: string; unreadable: number[]; demo?: boolean }
export interface Evidence { id: string; policyId: string; policyName: string; page: number; text: string; score: number; ocr?: boolean }
export interface Answer { intro: string; evidence: Evidence[]; cautions: Evidence[]; missing: boolean; aiText?: string; aiError?: string }
export interface Message { id: string; memberId: string; question: string; answer: Answer; time: string }
export interface FamilyState { version: 1; members: Member[]; policies: Policy[]; messages: Message[]; activeId: string }
