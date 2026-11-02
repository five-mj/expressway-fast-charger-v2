// Explicit user-supplied Tesla-owner tariff. Re-run after importing a workbook.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'data.generated-20261021.js');
const context = {window:{}};
vm.runInNewContext(fs.readFileSync(file,'utf8'),context);
const data = context.window.APP_ROUTE_DATA;
const magicDockSites = new Set([
  '탄천휴게소|논산방향','이인휴게소|천안방향',
  '정안알밤휴게소|서울방향','정안알밤휴게소|부산방향',
  '가평휴게소|서울방향','가평휴게소|춘천방향',
  '시흥하늘휴게소|일산방향','시흥하늘휴게소|판교방향',
  '평창휴게소|인천방향'
]);
const excluded = data.stationDetails.filter(row=>row.operatorDisplay==='테슬라'
  && !magicDockSites.has(row.serviceAreaName+'|'+row.direction));
const excludedRows = new Set(excluded.map(row=>row.sourceRow));
data.stationDetails=data.stationDetails.filter(row=>!excludedRows.has(row.sourceRow));
for(const route of data.routes)for(const stop of route.stops)
  stop.candidateRows=stop.candidateRows.filter(id=>!excludedRows.has(id));
const rows = new Map(data.stationDetails.map(row=>[row.sourceRow,row]));
const countScore=n=>n>=8?3:n>=4?2:n===3?1:0;
const powerScore=n=>n>=350?3:n>=200?2:n>=100?1:0;
let updated=0, changedOperators=0, changedRecommendations=0;
for(const row of data.stationDetails) {
  if(row.operatorDisplay==='테슬라') {
    row.price=339; row.fareAudience='tesla-owner'; row.magicDock=true; updated++;
  }
}
for(const route of data.routes) {
  const ranked=[];
  const middle=[Math.floor((route.stops.length-1)/2),Math.floor(route.stops.length/2)];
  const before=route.stops.findIndex(stop=>stop.recommended);
  route.stops.forEach((stop,index)=>{
    const eligible=stop.candidateRows.map(id=>rows.get(id)).filter(o=>o
      &&typeof o.price==='number'&&typeof o.chargerCount==='number'&&o.chargerCount>0
      &&typeof o.maxOutputKw==='number'&&o.maxOutputKw>=100
      &&['운영','오픈예정'].includes(o.openingStatus));
    eligible.sort((a,b)=>a.price-b.price
      ||(countScore(b.chargerCount)+powerScore(b.maxOutputKw))-(countScore(a.chargerCount)+powerScore(a.maxOutputKw))
      ||b.maxOutputKw-a.maxOutputKw||b.chargerCount-a.chargerCount||a.sourceRow-b.sourceRow);
    const selected=eligible[0];
    if(stop.displayRow!==(selected?.sourceRow??null))changedOperators++;
    stop.displayRow=selected?.sourceRow??null;
    stop.recommended=false;
    if(selected) {
      const distance=Math.min(...middle.map(m=>Math.abs(m-index)));
      const position=distance===0?2:distance===1?1:0;
      ranked.push({index,price:selected.price,score:position+countScore(selected.chargerCount)+powerScore(selected.maxOutputKw),power:selected.maxOutputKw,count:selected.chargerCount});
    }
  });
  ranked.sort((a,b)=>a.price-b.price||b.score-a.score||b.power-a.power||b.count-a.count||a.index-b.index);
  if(ranked.length)route.stops[ranked[0].index].recommended=true;
  if(before!==(ranked[0]?.index??-1))changedRecommendations++;
  route.recommendationStatus=ranked.length?'available':route.stops.length?'price-unavailable':'no-stops';
}
data.version='20261021-tesla-magicdock-20261102';
data.stats.operators=data.stationDetails.length;
data.teslaFarePolicy={price:339,unit:'KRW/kWh',audience:'테슬라 차주 전용',source:'사용자 지정 2026-11-02',eligibility:'사용자 검증 매직독 휴게소·방향 목록에 포함된 테슬라만 노출·비교',allowedSites:[...magicDockSites],pendingSites:[{name:'시흥하늘휴게소',direction:'판교방향',reason:'설비 데이터 추가 대기; 기존 채비 정보 유지'}],excludedSites:[{name:'신탄진휴게소',direction:'서울방향',reason:'테슬라 충전소 없음'},{name:'행담도휴게소',reason:'충전소가 휴게소와 떨어져 있음'},{name:'진영휴게소',direction:'부산방향',reason:'매직독 없음'}],referenceOnly:[{name:'고양휴게소',direction:'판교·문산',reason:'경로 데이터 미포함'}],exclusiveCard:'테슬라 추천 카드는 단독·공동 모두 분홍색 테슬라 전용 + 최저가; 일반은 파란색 테슬라 전용; 비추천 공동 최저가 카드만 전용 태그·색상 없이 기존 공통 디자인'};
fs.writeFileSync(file,'window.APP_ROUTE_DATA = '+JSON.stringify(data)+';\n');
console.log({updated,excludedRows:excludedRows.size,changedOperators,changedRecommendations});
