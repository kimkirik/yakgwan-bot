import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { PolicyPage } from './types';
pdfjs.GlobalWorkerOptions.workerSrc=workerUrl;
export const pdfOptions={isEvalSupported:false,cMapUrl:'/vendor/cmaps/',cMapPacked:true,standardFontDataUrl:'/vendor/standard_fonts/',wasmUrl:'/vendor/wasm/'};
export async function readPDF(file:File,progress:(s:string)=>void,signal:AbortSignal,ocr:boolean) {
  if(file.size>20*1024*1024)throw new Error('파일 한 개는 20MB 이하로 넣어 주세요.');
  const data=new Uint8Array(await file.arrayBuffer());
  if(!new TextDecoder().decode(data.slice(0,1024)).includes('%PDF-'))throw new Error('올바른 PDF 파일이 아닙니다.');
  const hash=await crypto.subtle.digest('SHA-256',data); const fingerprint=Array.from(new Uint8Array(hash)).map(n=>n.toString(16).padStart(2,'0')).join('');
  const task=pdfjs.getDocument({...pdfOptions,data});
  const abort=()=>{void task.destroy();}; signal.addEventListener('abort',abort);
  let worker: import('tesseract.js').Worker|undefined;
  try {
    const pdf=await task.promise;
    if(pdf.numPages>500)throw new Error('500페이지 이하 PDF로 나누어 넣어 주세요.');
    const pages:PolicyPage[]=[]; const unreadable:number[]=[]; let ocrCount=0;
    for(let n=1;n<=pdf.numPages;n++) {
      if(signal.aborted)throw new DOMException('취소됨','AbortError');
      progress(`${file.name} · ${n}/${pdf.numPages}페이지 읽는 중`);
      const page=await pdf.getPage(n); const content=await page.getTextContent();
      let text=''; let lastY:number|undefined;
      for(const item of content.items) { if(!('str' in item))continue; const y=item.transform[5]; if(lastY!==undefined&&Math.abs(y-lastY)>4)text+='\n'; text+=item.str+(item.hasEOL?'\n':' '); lastY=y; }
      let wasOCR=false;
      if(text.replace(/\s/g,'').length<20) {
        if(ocr&&ocrCount<50) {
          if(!worker) { progress('무료 문자 인식 준비 중 · 첫 실행에는 언어 파일을 내려받습니다'); const {createWorker}=await import('tesseract.js'); worker=await createWorker('kor+eng',1,{workerPath:'/vendor/tesseract/worker.min.js',corePath:'/vendor/tesseract/core/',langPath:'https://tessdata.projectnaptha.com/4.0.0',logger:()=>{}}); }
          progress(`${n}/${pdf.numPages}페이지 문자 인식 중`);ocrCount++;
          const viewport=page.getViewport({scale:Math.min(2,2200/Math.max(page.view[2],page.view[3]))}); const canvas=document.createElement('canvas'); canvas.width=viewport.width;canvas.height=viewport.height;
          await page.render({canvas,viewport}).promise;
          text=(await worker.recognize(canvas)).data.text;wasOCR=true;canvas.width=0;canvas.height=0;
        }
        if(text.replace(/\s/g,'').length<20)unreadable.push(n);
      }
      pages.push({number:n,text:text.trim(),ocr:wasOCR});page.cleanup();
    }
    if(!pages.some(p=>p.text.replace(/\s/g,'').length>=20))throw new Error(ocr?'문자를 읽지 못했습니다. 선명한 PDF 또는 텍스트가 포함된 약관을 넣어 주세요.':'스캔 PDF로 보입니다. 아래 “스캔 PDF 문자 인식”을 켜고 다시 넣어 주세요.');
    return {pages,fingerprint,unreadable};
  } catch(error) {
    if(signal.aborted)throw new DOMException('취소됨','AbortError');
    if(error instanceof Error&&error.name==='PasswordException')throw new Error('암호가 걸린 PDF입니다. 암호를 해제한 사본을 넣어 주세요.');
    throw error;
  } finally {signal.removeEventListener('abort',abort);await worker?.terminate();await task.destroy();}
}
export async function drawPage(blob:Blob,pageNumber:number,canvas:HTMLCanvasElement) {
  const task=pdfjs.getDocument({...pdfOptions,data:new Uint8Array(await blob.arrayBuffer())});
  try {const pdf=await task.promise; const page=await pdf.getPage(pageNumber);const viewport=page.getViewport({scale:1.4});canvas.width=viewport.width;canvas.height=viewport.height;await page.render({canvas,viewport}).promise;}finally{await task.destroy();}
}
