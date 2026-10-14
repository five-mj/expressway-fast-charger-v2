const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
async function run(kind,native){
 let handler,opened,payload,copied;
 const status={textContent:'',classList:{toggle(){},contains(){return false},add(){},remove(){}},style:{setProperty(){},removeProperty(){}}};
 const navigator={clipboard:{writeText:async url=>{copied=url}}};
 if(native)navigator.share=async value=>{payload=value;await native()};
 vm.runInNewContext(fs.readFileSync('route-share.js','utf8'),{
 document:{getElementById:()=>status,querySelectorAll:()=>[{dataset:{share:kind},parentElement:{appendChild:node=>{assert.equal(node,status)}},closest:selector=>selector==='.route-share-buttons'?{appendChild:node=>assert.equal(node,status)}:null,addEventListener:(_,fn)=>handler=fn}]},
 navigator,location:{href:'https://vercel-public-5325-20260708.vercel.app/?v=test',origin:'https://vercel-public-5325-20260708.vercel.app',search:''},
 state:{origin:'서울',destination:'속초'},window:{open:url=>opened=url},URL,URLSearchParams,clearTimeout(){},setTimeout(){}});
 await handler();return {opened,payload,copied,status:status.textContent};
}
(async()=>{
 const native=await run('kakao',async()=>{});assert.equal(native.payload.title,'서울 → 속초 최저가 급속 충전소');assert.equal(native.copied,undefined);
 assert.equal((await run('kakao')).status,'이 브라우저에서는 공유창을 지원하지 않습니다.\n링크 복사를 이용해주세요.');
 assert.equal((await run('kakao',async()=>{throw {name:'NotAllowedError'}})).status,'다시 시도해주세요.');
 assert.equal((await run('kakao',async()=>{throw {name:'AbortError'}})).status,'');
 const copy=await run('link');assert.equal(copy.status,'링크 복사 성공!');assert.equal(new URL(copy.copied).searchParams.get('destination'),'속초');assert.equal(new URL(copy.copied).searchParams.has('v'),false);
 for(const kind of ['facebook','x']){const result=await run(kind);const link=new URL(result.opened).searchParams.get(kind==='facebook'?'u':'url');assert.match(decodeURIComponent(link),/share\/서울-속초.html/)}
 const page=fs.readFileSync('share/서울-속초.html','utf8');assert.match(page,/og:title" content="서울 → 속초 최저가 급속 충전소/);assert.match(page,/summary_large_image/);assert.match(page,/og-share-20261014.png/);
 console.log('Native share, cancellation, unsupported browser, copy and route preview verified');
})();
