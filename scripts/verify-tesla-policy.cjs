const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const labels={innerHTML:'',hidden:false};
const context=vm.createContext({window:{addEventListener(){}},document:{querySelector:s=>s==='#detailLabels'?labels:null},console});
for(const file of ['data.generated-20261021.js','map-city-pins.js','app.preview-5281.js'])
 vm.runInContext(fs.readFileSync(file,'utf8').replace(/^boot\(\);/m,''),context);
const result=vm.runInContext(`(()=>{
 const result={teslaRows:0,exclusiveRoutes:[],tiedRoutes:[]};
 for(const row of EXCEL_ROUTE_DATA.stationDetails)if(row.operatorDisplay==='테슬라'){
  if(row.price!==339)throw Error('Tesla fare');result.teslaRows++;
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
 other.price_per_kwh=339;
 if(isTeslaExclusiveLowest(tesla))throw Error('Tie must use common card');
 renderDetailLabels(tesla,'recommended');
 const tied=document.querySelector('#detailLabels').innerHTML;
 if(tied.includes('테슬라 전용')||!tied.includes('>추천<'))throw Error('Common winner labels');
 renderDetailLabels(tesla,'lowPrice');
 if(!document.querySelector('#detailLabels').innerHTML.includes('공동 최저가'))throw Error('Tied label');
 renderDetailLabels(tesla,'default');
 if(!document.querySelector('#detailLabels').hidden)throw Error('Ordinary label');
 return result;
})()`,context);
assert(result.teslaRows>0);assert(result.exclusiveRoutes.length>0);
console.log(JSON.stringify(result));
