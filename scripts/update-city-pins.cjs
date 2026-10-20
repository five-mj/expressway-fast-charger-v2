const fs=require('node:fs'),assert=require('node:assert/strict');
const data=JSON.parse(fs.readFileSync('docs/map-pin-coordinates-27.json','utf8'));
for(const [city,left,top] of [['보령',62,176]])data.cities[city]={left,top,x:+((left+data.flag.anchorX)/data.map.width).toFixed(9),y:+((top+data.flag.anchorY)/data.map.height).toFixed(9)};
assert.equal(Object.keys(data.cities).length,28);
fs.writeFileSync('docs/map-pin-coordinates-28.json',JSON.stringify(data,null,2)+'\n');
fs.writeFileSync('map-city-pins.js','// 28 supplied map positions; Figma reference: docs/map-pin-coordinates-28.json\nwindow.FIGMA_CITY_PIN_LAYOUT = '+JSON.stringify(data,null,2)+';\n');
console.log(JSON.stringify({보령:data.cities.보령}));
