"""Import the 27-city workbook without publishing source/private workbook columns.

Compare all eligible operators and preserve decimal fares. Recalculate route
recommendations using that operator's 100kW+ count, not total/available count.
"""
import collections
import hashlib
import json
import sys
from pathlib import Path
import openpyxl

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1])
workbook = openpyxl.load_workbook(source, read_only=True, data_only=True)
def records(sheet):
    values = iter(workbook[sheet].values)
    headers = next(values)
    return [(row, dict(zip(headers, values))) for row, values in enumerate(values, 2)]
def number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)
def key(row):
    return tuple(row[k] for k in ('출발', '도착', '순번', '노선', '휴게소', '방향'))
def count_score(n):
    return 3 if n >= 8 else 2 if n >= 4 else 1 if n == 3 else 0
def speed_score(n):
    return 3 if n >= 350 else 2 if n >= 200 else 1 if n >= 100 else 0

def has_fast_operator(row):
    return any(
        (number(o['최대 출력(kW)']) and o['최대 출력(kW)'] >= 100)
        or (number(o['급속(100kW+) 수']) and o['급속(100kW+) 수'] > 0)
        for _, o in operators[key(row)])

cities = [r['도시'] for _, r in records('대표좌표')]
assert len(cities) == len(set(cities)) == 27
layout = json.loads((root / 'docs/map-pin-coordinates-27.json').read_text(encoding='utf-8'))
assert set(cities) == set(layout['cities'])
operators = collections.defaultdict(list)
details = []
for row, o in records('휴게소별_운영기관'):
    operators[key(o)].append((row, o))
    details.append(dict(sourceRow=row, serviceAreaName=o['휴게소'], direction=o['방향'] or '',
        operatorDisplay=o['앱 노출명'] or '정보 없음', detailOperator=o['앱 노출명'] or '정보 없음',
        price=o['회원가(원/kWh)'], maxOutputKw=o['최대 출력(kW)'],
        chargerCount=o['급속(100kW+) 수'], openingStatus=o['개통상태'],
        lat=o['위도'], lng=o['경도']))
stops = collections.defaultdict(list)
for row, r in records('경로별_휴게소(순서)'):
    stops[r['출발'], r['도착']].append((row, r))
routes = []
changes = []
removed = []
for _, summary in records('경로별_요약'):
    origin, destination = summary['출발'], summary['도착']
    rows = sorted(stops[origin, destination], key=lambda r: r[1]['순번'])
    removed.extend(dict(origin=origin,destination=destination,name=r['휴게소'],sourceRow=row)
        for row,r in rows if not has_fast_operator(r))
    rows = [(row,r) for row,r in rows if has_fast_operator(r)]
    route = dict(origin=origin, destination=destination, highway=origin+' → '+destination,
        highwayLabel='', travelDirection='', restAreas=[], stops=[])
    ranked = []
    for index, (row, r) in enumerate(rows):
        candidates = operators[key(r)]
        selected = [(op_row,o) for op_row,o in candidates
            if all(number(o[k]) for k in ['회원가(원/kWh)','급속(100kW+) 수','최대 출력(kW)'])
            and o['급속(100kW+) 수'] > 0 and o['최대 출력(kW)'] >= 100
            and o['개통상태'] in ('운영','오픈예정')]
        # Location and route order are identical within one stop; the final
        # source-row tie-break makes otherwise identical operators deterministic.
        selected.sort(key=lambda pair: (pair[1]['회원가(원/kWh)'],
            -(count_score(pair[1]['급속(100kW+) 수'])+speed_score(pair[1]['최대 출력(kW)'])),
            -pair[1]['최대 출력(kW)'], -pair[1]['급속(100kW+) 수'], pair[0]))
        best = selected[0] if selected else None
        if best:
            op_row, o = best
            price, quantity, power = o['회원가(원/kWh)'], o['급속(100kW+) 수'], o['최대 출력(kW)']
            assert all(number(v) for v in [price, quantity, power]) and quantity > 0
            assert o['개통상태'] in ('운영', '오픈예정')
            # The supplied representative must be a lowest-price eligible operator.
            eligible = [v['회원가(원/kWh)'] for _, v in candidates
                if number(v['회원가(원/kWh)']) and number(v['급속(100kW+) 수'])
                and v['급속(100kW+) 수'] > 0 and v['개통상태'] in ('운영', '오픈예정')]
            assert price == min(eligible)
            middle = {(len(rows)-1)//2, len(rows)//2}
            pos = 2 if index in middle else 1 if min(abs(index-m) for m in middle) == 1 else 0
            score = pos + count_score(quantity) + speed_score(power)
            ranked.append((price, -score, -power, -quantity, index))
        route['restAreas'].append(r['휴게소'])
        route['stops'].append(dict(name=r['휴게소'], direction=r['방향'] or '', order=index+1, originalOrder=r['순번'],
            recommended=False, sourceRow=row, candidateRows=[o[0] for o in candidates],
            displayRow=best[0] if best else None, lat=r['위도'], lng=r['경도']))
    if ranked:
        winner = min(ranked)[-1]
        route['stops'][winner]['recommended'] = True
        original = [i for i, (_, r) in enumerate(rows) if r['추천'] == 'Y']
        if original != [winner]:
            changes.append(dict(origin=origin, destination=destination,
                before=[rows[i][1]['휴게소'] for i in original], after=rows[winner][1]['휴게소']))
    route['recommendationStatus'] = 'available' if ranked else 'price-unavailable' if rows else 'no-stops'
    routes.append(route)
excluded = [dict(origin=r['출발'], destination=r['도착'], reason='no-highway')
    for _, r in records('고속도로_미이용')]
stats = dict(cities=len(cities), routes=len(routes), selectableRoutes=sum(bool(r['stops']) for r in routes),
    stops=sum(len(r['stops']) for r in routes), operators=len(details),
    recommendedRoutes=sum(any(s['recommended'] for s in r['stops']) for r in routes),
    excludedNoHighway=len(excluded), excludedNoStops=sum(not r['stops'] for r in routes),
    missingPriceRoutes=sum(r['recommendationStatus']=='price-unavailable' for r in routes))
assert stats['stops'] + len(removed) == 3635
data = dict(version='20260930-operator-ranking-20261007',sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),
    recommendationPolicy='all-operators / price / stop-order / 100kW+ count / maximum-output',
    originOptions=cities,routes=routes,stationDetails=details,excludedRoutes=excluded,stats=stats,excludedNonFastStops=removed)
(root/'data.generated-20260930.js').write_text('window.APP_ROUTE_DATA = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
(root/'map-city-pins.js').write_text('// All 27 supplied cities; Figma reference: docs/map-pin-coordinates-27.json\nwindow.FIGMA_CITY_PIN_LAYOUT = '+json.dumps(layout,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
print(json.dumps(dict(stats=stats,removedStops=len(removed),changedRecommendations=len(changes),changesFromWorkbook=changes),ensure_ascii=False))
