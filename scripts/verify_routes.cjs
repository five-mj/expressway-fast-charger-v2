const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context=vm.createContext({window:{},document:{querySelector:()=>null},console});
vm.runInContext(fs.readFileSync('data.generated-20260917.js','utf8'),context);
vm.runInContext(fs.readFileSync('app.preview-5281.js','utf8').replace(/^boot\(\);/m,''),context);
const result=vm.runInContext(`(() => {
 let stops=0,water=0,water294=0,nonEmpty=0;
 for (const route of EXCEL_ROUTE_DATA.routes) {
   state.origin=route.origin;state.destination=route.destination;state.highway=route.highway;
   computeRouteStations();
   if(state.routeStations.length!==route.stops.length)throw Error('Stop count');
   if(!route.stops.length)continue;
   nonEmpty++;stops+=state.routeStations.length;
   const selected=state.routeStations[state.focusedIndex];
   if(!selected.excelRecommended || !isRecommendedStation(selected))throw Error('Initial recommendation');
   if(!isLowestPriceStation(selected))throw Error('Not lowest');
   const ordered=state.routeStations.map(s=>s.sourceRow);
   if(ordered.some((r,i)=>r!==route.stops[i].sourceRow))throw Error('Order');
   for(const s of state.routeStations){
     if(s.price_per_kwh===0)throw Error('Missing price converted to zero');
     if(s.displayOperatorCandidate && s.direction!==s.displayOperatorCandidate.direction)throw Error('Direction');
   }
   if(getStationDisplayOperator(selected)==='워터'){water++;if(selected.price_per_kwh===294)water294++;}
 }
 return {routes:EXCEL_ROUTE_DATA.routes.length,nonEmpty,stops,water,water294};
})()`,context);
assert.equal(result.routes,300);assert.equal(result.nonEmpty,287);assert.equal(result.stops,1584);assert.equal(result.water,122);assert.equal(result.water294,107);
const prices=vm.runInContext(`EXCEL_ROUTE_DATA.stationDetails.filter(s=>['테슬라','에버온','E1'].includes(s.operatorDisplay)).map(s=>[s.operatorDisplay,s.price])`,context);
for(const [operator,price] of prices)assert.equal(price,{'테슬라':339,'에버온':296,E1:347.2}[operator]);
assert.equal(prices.length,94);
console.log('Verified all workbook routes:',JSON.stringify(result));
