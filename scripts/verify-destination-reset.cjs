const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context=vm.createContext({window:{addEventListener(){}},document:{querySelector:()=>null},console,URL,
 location:{href:'https://example.com/?origin=속초&destination=서울'},history:{replaceState(_s,_t,url){context.savedUrl=url}}});
for(const file of ['data.generated-20261021.js','map-city-pins.js','app.preview-5281.js'])
 vm.runInContext(fs.readFileSync(file,'utf8').replace(/^boot\(\);/m,''),context);
const result=vm.runInContext(`(()=>{
 let kept=0,reset=0;
 const origins=getOriginOptions();
 for(const old of EXCEL_ROUTE_DATA.routes.filter(r=>r.stops.length))for(const next of origins){
  state.origin=old.origin;state.destination=old.destination;
  const valid=getDestinationOptions(next).includes(old.destination);
  setResultOrigin(next);
  if(state.destination!==(valid?old.destination:''))throw Error('Transition '+old.origin+old.destination+next);
  valid?kept++:reset++;
 }
 state.origin='속초';state.destination='서울';setResultOrigin('서울');
 if(state.destination!=='')throw Error('Same city fallback');
 syncResultUrl();
 const node=()=>({hidden:false,disabled:true,innerHTML:'old',textContent:'old',setAttribute(){}});
 for(const key of ['originValue','destinationValue','originTrigger','destinationTrigger','routeLayer','stationLayer','routeBadge','priceCard','brandLabel','pinTotalBadge','pinTotalText','startFlag','endFlag','startLabel','endLabel','prev','next'])els[key]=node();
 const notice=node();document.getElementById=()=>notice;
 state.routeStations=[{old:true}];state.focusedIndex=4;
 render();moveFocus(1);moveFocus(-1);
 if(state.routeStations.length||state.focusedIndex!==-1)throw Error('Stale results');
 if(els.routeLayer.innerHTML||els.stationLayer.innerHTML)throw Error('Stale route or pins');
 if(!els.priceCard.hidden||!els.brandLabel.hidden||els.pinTotalBadge.hidden||notice.hidden)throw Error('Visibility');
 if(els.pinTotalText.textContent!=='0/0')throw Error('Empty counter');
 if(els.prev.disabled||els.next.disabled)throw Error('Buttons changed appearance');
 if(els.destinationValue.textContent!=='도착지 선택')throw Error('Placeholder');
 state.destination=getDestinationOptions('서울')[0];computeRouteStations();
 const recommended=getRecommendedStation();
 if(state.routeStations[state.focusedIndex]!==recommended)throw Error('Recommendation after reselect');
 return {kept,reset};
})()`,context);
const url=new URL(context.savedUrl);assert.equal(url.searchParams.get('origin'),'서울');assert.equal(url.searchParams.has('destination'),false);assert.equal(url.searchParams.get('view'),'result');
console.log('All origin changes, pending result clearing, navigation no-op and recommendation restoration verified:',result);
