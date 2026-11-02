const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const labels={innerHTML:'',hidden:false};
const context=vm.createContext({window:{addEventListener(){}},document:{querySelector:s=>s==='#detailLabels'?labels:null},console});
for(const file of ['data.generated-20261021.js','map-city-pins.js','app.preview-5281.js'])
 vm.runInContext(fs.readFileSync(file,'utf8').replace(/^boot\(\);/m,''),context);
const result=vm.runInContext(`(()=>{
 const result={teslaRows:0,exclusiveRoutes:[],tiedRoutes:[]};
 for(const row of EXCEL_ROUTE_DATA.stationDetails)if(row.operatorDisplay==='테슬라'){
  if(row.price!==339||!row.magicDock)throw Error('Tesla fare or Magic Dock');
  if(['신탄진휴게소','진영휴게소','행담도휴게소','고양휴게소'].includes(row.serviceAreaName))throw Error('Excluded Tesla site');
  result.teslaRows++;
 }
 for(const route of EXCEL_ROUTE_DATA.routes){
  state.origin=route.origin;state.destination=route.destination;computeRouteStations();
  const winner=getRecommendedStation();if(!winner)continue;
  if(isTeslaExclusiveLowest(winner))result.exclusiveRoutes.push([route.origin,route.destination]);
  else if(getStationDisplayOperator(winner)==='테슬라')result.tiedRoutes.push([route.origin,route.destination]);
 }
 const tesla={operator_name:'테슬라',price_per_kwh:339,total_charger_count:8,charging_speed_kw:325};
 const other={operator_name:'타사',price_per_kwh:347,total_charger_count:8,charging_speed_kw:350};
 state.routeStations=[tesla,other];
 if(!isTeslaExclusiveLowest(tesla))throw Error('Unique winner');
 renderDetailLabels(tesla,'recommended');
 const unique=document.querySelector('#detailLabels').innerHTML;
 if(!unique.includes('테슬라 전용')||unique.includes('>추천<'))throw Error('Exclusive labels');
 if(unique.indexOf('테슬라 전용')>unique.indexOf('최저가'))throw Error('Tesla label must precede lowest label');
 other.price_per_kwh=339;
 other.charging_speed_kw=250;
 if(isTeslaExclusiveLowest(tesla))throw Error('Tie must use common card');
 renderDetailLabels(tesla,'recommended');
 const tied=document.querySelector('#detailLabels').innerHTML;
 if(!tied.includes('테슬라 전용')||tied.includes('>추천<'))throw Error('Recommended Tesla keeps owner label');
 if(!usesTeslaCardStyle(tesla))throw Error('Recommended Tesla style must remain');
 other.charging_speed_kw=350;
 if(usesTeslaCardStyle(tesla))throw Error('Non-recommended tied Tesla must use common style');
 renderDetailLabels(tesla,'lowPrice');
 if(!document.querySelector('#detailLabels').innerHTML.includes('공동 최저가'))throw Error('Tied label');
 if(document.querySelector('#detailLabels').innerHTML.includes('테슬라 전용'))throw Error('Tied Tesla label must be absent');
 other.price_per_kwh=294;
 if(!usesTeslaCardStyle(tesla))throw Error('Ordinary Tesla style must remain');
 renderDetailLabels(tesla,'default');
 if(document.querySelector('#detailLabels').hidden||!document.querySelector('#detailLabels').innerHTML.includes('테슬라 전용'))throw Error('Ordinary Tesla label');
 renderDetailLabels(other,'default');
 if(!document.querySelector('#detailLabels').hidden)throw Error('Ordinary non-Tesla label');
 return result;
})()`,context);
assert.equal(result.teslaRows,122);assert.equal(result.exclusiveRoutes.length,38);
const data=context.window.APP_ROUTE_DATA, rows=new Map(data.stationDetails.map(o=>[o.sourceRow,o]));
for(const route of data.routes)for(const stop of route.stops){
 for(const id of stop.candidateRows)assert(rows.has(id),'Dangling operator reference');
 if(stop.name==='시흥하늘휴게소'&&stop.direction==='판교방향')assert.equal(rows.get(stop.displayRow).operatorDisplay,'채비');
}
console.log(JSON.stringify(result));
