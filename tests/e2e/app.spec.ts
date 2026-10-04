import {test,expect} from '@playwright/test';
import path from 'node:path';
const sample=path.resolve('public/sample-policy.pdf');
test('PDF upload, question, source, persistence and family isolation',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));const outgoing:string[]=[];page.on('request',r=>{if(r.method()==='POST'&&!new URL(r.url()).pathname.startsWith('/cdn-cgi/challenge-platform/'))outgoing.push(r.url());});
 await page.goto('/');await expect(page.getByRole('heading',{name:'나의 보험 이야기'})).toBeVisible();
 await page.locator('#pdf-input').setInputFiles(sample);
 await expect(page.getByRole('alert')).toContainText('약관 1개를 저장');
 await page.locator('#question').fill('입원비는 얼마나 보장돼?');await page.getByRole('button',{name:'질문 보내기'}).click();
 await expect(page.locator('.answer .quote').first()).toContainText('30,000');
 await page.locator('.answer .quote').first().click();await expect(page.locator('#page-label')).toContainText('1 / 3');
 await expect(page.locator('#pdf-canvas')).toBeVisible();await page.waitForFunction(()=>document.querySelector<HTMLCanvasElement>('#pdf-canvas')!.width>0);
 await page.getByRole('button',{name:'다음',exact:true}).click();await expect(page.locator('#page-label')).toContainText('2 / 3');await page.getByRole('button',{name:'닫기',exact:true}).click();
 await page.reload();await expect(page.locator('.answer .quote').first()).toContainText('30,000');
 await page.getByRole('button',{name:'가족 추가',exact:true}).click();await page.getByLabel('이름 또는 별명').fill('엄마');await page.getByLabel('관계', {exact:true}).selectOption('부모');await page.locator('#member-form .primary').click();
 await expect(page.getByRole('heading',{name:'엄마의 보험 이야기'})).toBeVisible();await expect(page.locator('#question')).toBeDisabled();await expect(page.locator('.answer')).toHaveCount(0);
 await page.locator('#pdf-input').setInputFiles(sample);await expect(page.getByRole('alert')).toContainText('엄마의 약관 1개');
 await page.reload();await expect(page.getByRole('heading',{name:'엄마의 보험 이야기'})).toBeVisible();
 await page.locator('#question').fill('임플란트가 보장되나요?');await page.getByRole('button',{name:'질문 보내기'}).click();await expect(page.locator('.answer')).toContainText('근거를 찾지 못했습니다');
 await page.getByRole('button',{name:/나 본인/}).click();await expect(page.locator('.answer')).toContainText('30,000');
 expect(errors).toEqual([]);expect(outgoing).toEqual([]);
});
test('duplicate and invalid uploads, actual delete cascade',async({page})=>{
 await page.goto('/');await page.locator('#pdf-input').setInputFiles(sample);await expect(page.getByRole('alert')).toContainText('약관 1개를 저장');
 await page.locator('#pdf-input').setInputFiles(sample);await expect(page.getByRole('alert')).toContainText('이미 등록된 약관');await expect(page.locator('.policy-item')).toHaveCount(1);
 await page.locator('#pdf-input').setInputFiles({name:'broken.pdf',mimeType:'application/pdf',buffer:Buffer.from('not a pdf')});await expect(page.getByRole('alert')).toContainText('올바른 PDF 파일이 아닙니다');
 await page.locator('#question').fill('보장범위');await page.getByRole('button',{name:'질문 보내기'}).click();await expect(page.locator('.answer')).toBeVisible();
 await page.getByRole('button',{name:'sample-policy.pdf 삭제'}).click();await page.getByRole('button',{name:'삭제하기',exact:true}).click();await expect(page.locator('.policy-item')).toHaveCount(0);await expect(page.locator('.answer')).toHaveCount(0);
 await page.reload();await expect(page.locator('.policy-item')).toHaveCount(0);
});
test('mobile tabs and layouts fit at 360 and 390px',async({page})=>{
 for(const width of [360,390]){await page.setViewportSize({width,height:844});await page.goto('/');await expect(page.locator('.welcome h2')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'가족·약관',exact:true}).click();await page.getByRole('button',{name:'가족 추가',exact:true}).click();await page.getByLabel('이름 또는 별명').fill('아빠');await page.locator('#member-form .primary').click();
  await page.getByRole('button',{name:'질문하기',exact:true}).click();await expect(page.getByRole('heading',{name:'아빠의 보험 이야기'})).toBeVisible();
  await page.getByRole('button',{name:'근거 노트',exact:true}).click();await expect(page.getByText('답변 옆에, 근거도 함께')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
test('family rename and deletion retain other family data',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'가족 추가',exact:true}).click();await page.getByLabel('이름 또는 별명').fill('동생');await page.locator('#member-form .primary').click();
 await page.getByRole('button',{name:'동생 정보 관리'}).click();await page.getByLabel('이름 또는 별명').fill('형');await page.getByRole('button',{name:'변경 저장'}).click();await expect(page.getByRole('heading',{name:'형의 보험 이야기'})).toBeVisible();
 await page.getByRole('button',{name:'형 정보 관리'}).click();await page.getByRole('button',{name:'이 가족과 연결된 자료 삭제'}).click();await page.getByRole('button',{name:'삭제하기',exact:true}).click();await expect(page.getByRole('heading',{name:'나의 보험 이야기'})).toBeVisible();await page.reload();await expect(page.locator('.family')).toHaveCount(1);
});
