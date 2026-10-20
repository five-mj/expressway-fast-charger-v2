const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context=vm.createContext({window:{addEventListener(){}},document:{querySelector:()=>null},console});
for(const file of ['data.generated-20260930.js','map-city-pins.js','app.preview-5281.js'])vm.runInContext(fs.readFileSync(file,'utf8').replace(/^boot\(\);/m,''),context);
const origins=JSON.parse(JSON.stringify(vm.runInContext('getOriginOptions()',context)));
assert.deepEqual(origins,[...origins].sort((a,b)=>a.localeCompare(b,'ko')));assert.equal(origins.length,28);
let count=0;
for(const origin of origins){
 const destinations=JSON.parse(JSON.stringify(vm.runInContext(`getDestinationOptions(${JSON.stringify(origin)})`,context)));
 const actualRoutes=Array.from(context.window.APP_ROUTE_DATA.routes.filter(r=>r.origin===origin&&r.restAreas.length).map(r=>r.destination));
 const previews=['보령'].includes(origin)?origins:['보령'];
 const expected=[...new Set([...actualRoutes,...previews])].filter(c=>c!==origin).sort((a,b)=>a.localeCompare(b,'ko'));
 assert.deepEqual(destinations,Array.from(expected));assert(!destinations.includes(origin));count+=destinations.length;
}
assert.equal(count,716);console.log('28 origins and destination lists sorted; 662 real routes and 54 pending city pairs');
console.log(origins.join(', '));
