// Explicit user-supplied Tesla-owner tariff. Re-run after importing a workbook.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'data.generated-20261021.js');
const context = {window:{}};
vm.runInNewContext(fs.readFileSync(file,'utf8'),context);
const data = context.window.APP_ROUTE_DATA;
const rows = new Map(data.stationDetails.map(row=>[row.sourceRow,row]));
const countScore=n=>n>=8?3:n>=4?2:n===3?1:0;
const powerScore=n=>n>=350?3:n>=200?2:n>=100?1:0;
let updated=0, changedOperators=0, changedRecommendations=0;
for(const row of data.stationDetails) {
  if(row.operatorDisplay==='테슬라') {
    row.price=339; row.fareAudience='tesla-owner'; updated++;
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
data.version='20261021-tesla-owner-fare-20261102';
data.teslaFarePolicy={price:339,unit:'KRW/kWh',audience:'테슬라 차주 전용',source:'사용자 지정 2026-11-02',exclusiveCard:'단독 최저가 추천 시에만 최저가 + 테슬라 전용; 공동 최저가 및 일반 노출은 공통 정책'};
fs.writeFileSync(file,'window.APP_ROUTE_DATA = '+JSON.stringify(data)+';\n');
console.log({updated,changedOperators,changedRecommendations});
