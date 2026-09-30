const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const context = vm.createContext({ window: {}, document: { querySelector: () => null }, console });
for (const file of ['data.generated-20260917.js', 'map-city-pins.js', 'app.preview-5281.js']) {
  vm.runInContext(fs.readFileSync(file, 'utf8').replace(/^boot\(\);/m, ''), context);
}
const result = vm.runInContext(`(() => {
  const layout = window.FIGMA_CITY_PIN_LAYOUT;
  const names = [...new Set(EXCEL_ROUTE_DATA.routes.flatMap(r => [r.origin, r.destination]))];
  const matched = names.filter(n => layout.cities[n]);
  const preserved = names.filter(n => !layout.cities[n]);
  for (const city of Object.keys(layout.cities)) {
    const pin = layout.cities[city], point = getCityRoutePoint(city);
    const expected = [23 + pin.left + layout.flag.anchorX, 285 + pin.top + layout.flag.anchorY];
    if (point.some((n, i) => Math.abs(n - expected[i]) > 0.001)) throw Error('Anchor: ' + city);
    if (pin.x < 0 || pin.x > 1 || pin.y < 0 || pin.y > 1) throw Error('Bounds: ' + city);
  }
  for (const city of preserved) {
    if (getCityRoutePoint(city) !== FIXED_CITY_ROUTE_POINTS_FINAL[city]) throw Error('Fallback: ' + city);
  }
  for (const route of EXCEL_ROUTE_DATA.routes) {
    const points = makeFixedRoutePointsFinal(route);
    if (!points || points.flat().some(n => !Number.isFinite(n))) throw Error('Route: ' + route.origin + route.destination);
    state.origin = route.origin; state.destination = route.destination;
    els.startFlag = {style:{}}; els.endFlag = {style:{}};
    for (const [city, flag, point] of [[route.origin, els.startFlag, points[0]], [route.destination, els.endFlag, points[2]]]) {
      placeRouteEnd(flag, {style:{}}, point, '출발', points, [], []);
      if (layout.cities[city]) {
        const pin = layout.cities[city];
        if (Math.abs(parseFloat(flag.style.left) - 23 - pin.left) > 0.001 ||
            Math.abs(parseFloat(flag.style.top) - 285 - pin.top) > 0.001) throw Error('Flag placement: ' + city);
      }
    }
  }
  return {count: Object.keys(layout.cities).length, matched, preserved, routes: EXCEL_ROUTE_DATA.routes.length};
})()`, context);
assert.equal(result.count, 27);
assert.equal(result.matched.length, 14);
assert.equal(result.preserved.length, 10);
console.log(JSON.stringify(result, null, 2));
