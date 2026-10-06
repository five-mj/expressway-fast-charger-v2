const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context=vm.createContext({window:{addEventListener(){}},document:{querySelector:()=>null},console});
for(const file of ['data.generated-20260930.js','map-city-pins.js','app.preview-5281.js'])
 vm.runInContext(fs.readFileSync(file,'utf8').replace(/^boot\(\);/m,''),context);
const result=vm.runInContext(`(() => {
 let stops=0,recommended=0,noPrice=0,selectable=0;
 if(getOriginOptions().length!==27)throw Error('Cities');
 for(const route of EXCEL_ROUTE_DATA.routes){
  state.origin=route.origin;state.destination=route.destination;state.highway=route.highway;
  computeRouteStations();
  if(state.routeStations.length!==route.stops.length)throw Error('Count');
  if(getDestinationOptions(route.origin).includes(route.destination)!==!!route.stops.length)throw Error('Dropdown filter');
  const points=makeFixedRoutePointsFinal(route);
  if(!points || points.flat().some(n=>!Number.isFinite(n)))throw Error('Pin coordinates');
  if(!route.stops.length)continue;
  selectable++;stops+=route.stops.length;
  const actual=getRecommendedStation();
  const ranked=state.routeStations.map((s,i)=>({s,i,price:s.price_per_kwh,
    count:getStationTotalCount(s),power:getStationChargingSpeed(s)}))
    .filter(x=>typeof x.price==='number')
    .map(x=>({...x,score:getRouteDistanceScore(x.i,route.stops.length)+getChargerCountScore(x.count)+getChargingSpeedScore(x.power)}))
    .sort((a,b)=>a.price-b.price||b.score-a.score||b.power-a.power||b.count-a.count||a.i-b.i);
  if(ranked.length){
   recommended++;
   if(actual!==ranked[0].s || state.routeStations[state.focusedIndex]!==actual)throw Error('Recommendation '+route.origin+route.destination);
   if(!isLowestPriceStation(actual))throw Error('Price');
  }else{noPrice++;if(actual)throw Error('Invented recommendation');}
  state.routeStations.forEach((s,i)=>{
   if(s.sourceRow!==route.stops[i].sourceRow)throw Error('Order');
   if(s.price_per_kwh===0)throw Error('Missing price becomes zero');
   if(s.displayOperatorCandidate && s.direction!==s.displayOperatorCandidate.direction)throw Error('Direction');
  });
 }
 state.origin='속초';state.destination='목포';computeRouteStations();
 const winner=getRecommendedStation();
 if(winner.service_area_name!=='부안고려청자휴게소'||winner.price_per_kwh!==347||getStationTotalCount(winner)!==6)throw Error('Sokcho Mokpo');
 const mang=state.routeStations.find(s=>s.service_area_name==='망향휴게소');
 if(mang.price_per_kwh!==347 || getStationTotalCount(mang)!==2)throw Error('Manghyang');
 return {stops,recommended,noPrice,selectable};
})()`,context);
assert.deepEqual(JSON.parse(JSON.stringify(result)),{stops:3635,recommended:648,noPrice:14,selectable:662});
const reference=JSON.parse(fs.readFileSync('docs/map-pin-coordinates-27.json','utf8'));
assert.deepEqual(JSON.parse(JSON.stringify(context.window.FIGMA_CITY_PIN_LAYOUT)),reference);
console.log('All routes, recommendations, missing fares and 27 map coordinates verified:',result);
