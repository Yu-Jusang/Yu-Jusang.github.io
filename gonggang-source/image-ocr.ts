import type {Worker} from 'tesseract.js';

export async function noticeImage(file:File):Promise<Blob>{
 if(!['image/png','image/jpeg','image/webp','image/bmp'].includes(file.type))throw Error('PNG·JPG·WebP·BMP 사진을 사용해 주세요. HEIC·PDF는 PNG나 JPG로 바꿔 주세요.');
 if(file.size>12*1024*1024)throw Error('사진은 12MB 이하로 올려 주세요.');
 const bitmap=await createImageBitmap(file).catch(()=>{throw Error('사진을 열 수 없습니다. 다른 사진으로 다시 시도해 주세요.')});
 try{if(bitmap.width*bitmap.height>28000000)throw Error('사진이 너무 큽니다. 공지 부분만 잘라서 다시 올려 주세요.');const scale=Math.min(2,2400/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d');if(!ctx)throw Error('이 브라우저에서 사진 인식을 준비할 수 없습니다.');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('사진 변환에 실패했습니다.')),'image/png'));}finally{bitmap.close()}
}
export async function createNoticeReader(progress:(message:string)=>void):Promise<Worker>{
 const {createWorker}=await import('tesseract.js');
 const root=new URL('./ocr/',document.baseURI).href;
 return createWorker(['kor','eng'],1,{workerPath:root+'worker.min.js',corePath:root+'core',langPath:root+'lang',workerBlobURL:false,logger:m=>{if(m.status==='recognizing text')progress('사진 글자 읽는 중 · '+Math.round(m.progress*100)+'%');else progress('한국어 인식기 준비 중 · 처음에는 조금 걸릴 수 있어요.')}});
}
