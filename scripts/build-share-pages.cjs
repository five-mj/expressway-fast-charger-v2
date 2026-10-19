// Regenerate after changing route data or the common sharing image.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const context = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(root, 'data.generated-20260930.js'), 'utf8'), context);
const host = 'https://vercel-public-5325-20260708.vercel.app';
const image = `${host}/assets/new/og-share-20261014.png`;
const escape = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
fs.mkdirSync(path.join(root, 'share'), {recursive: true});
let count = 0;
const routes = context.window.APP_ROUTE_DATA.routes.filter(r => r.stops.length);
const cities = [...new Set([...routes.map(r=>r.origin),'보령','군산'])];
const pending = cities.map(origin=>({origin,destination:''}));
const pendingPairs=cities.flatMap(origin=>cities.filter(destination=>origin!==destination&&(['보령','군산'].includes(origin)||['보령','군산'].includes(destination))).map(destination=>({origin,destination})));
for (const route of [...routes,...pending,...pendingPairs]) {
  const title = route.destination ? `${route.origin} → ${route.destination} 최저가 급속 충전소` : `${route.origin} → 도착지 선택`;
  const destination = route.destination || '도착지선택';
  const name = `${route.origin}-${destination}.html`;
  const url = `${host}/share/${encodeURIComponent(route.origin)}-${encodeURIComponent(destination)}.html`;
  const target = `/?${new URLSearchParams(route.destination ? {origin:route.origin,destination:route.destination} : {origin:route.origin,view:'result'})}`;
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title>
<meta property="og:type" content="website"><meta property="og:site_name" content="경로별 최저가 급속 충전소"><meta property="og:url" content="${escape(url)}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="경로별 최저가 급속 충전소와 추천 휴게소를 확인하세요."><meta property="og:image" content="${image}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="경로별 최저가 급속 충전소와 추천 휴게소를 확인하세요."><meta name="twitter:image" content="${image}"><meta name="twitter:image:alt" content="최저가 충전소로 안내해드릴게요!">
</head><body><p><a href="${escape(target)}">${escape(title)} 보기</a></p><script>location.replace(${JSON.stringify(target)})</script></body></html>`;
  fs.writeFileSync(path.join(root, 'share', name), html);
  count++;
}
console.log(`${count} route sharing pages generated`);
