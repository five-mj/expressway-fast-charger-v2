const fs=require('node:fs'),vm=require('node:vm');
const context=vm.createContext({window:{addEventListener(){}},document:{querySelector:()=>null},console});
for(const file of ['data.generated-20261021.js','map-city-pins.js','app.preview-5281.js'])
 vm.runInContext(fs.readFileSync(file,'utf8').replace(/^boot\(\);/m,''),context);
vm.runInContext(`(()=>{
 let mapHidden=true;
 els.mapScreen={classList:{contains:()=>mapHidden,add:()=>{mapHidden=true}}};
 els.heroScreen={classList:{remove(){}}};
 const refresh=refreshHeroControls;
 refreshHeroControls=function(){const origins=getOriginOptions();if(heroState.origin&&!origins.includes(heroState.origin))heroState.origin='';if(heroState.destination&&!getDestinationOptions(heroState.origin).includes(heroState.destination))heroState.destination=''};
 showHero();if(heroState.origin||heroState.destination)throw Error('Initial placeholders changed');
 for(const route of EXCEL_ROUTE_DATA.routes.filter(r=>r.stops.length)){
  heroState.origin='서울';heroState.destination='부산';state.origin=route.origin;state.destination=route.destination;mapHidden=false;
  showHero();
  if(heroState.origin!==route.origin||heroState.destination!==route.destination)throw Error('Back sync '+route.origin+route.destination);
 }
 for(const origin of getOriginOptions()){
  state.origin=origin;state.destination='';mapHidden=false;showHero();
  if(heroState.origin!==origin||heroState.destination!=='')throw Error('Pending back state');
 }
 refreshHeroControls=refresh;
 console.log('Initial placeholders, all current route back selections and destination states verified');
})()`,context);
