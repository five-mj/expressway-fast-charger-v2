"""Read-only XLSX import. Emits public app fields only; never publishes the workbook."""
import collections, hashlib, json, sys
from pathlib import Path
import openpyxl
source=Path(sys.argv[1]); root=Path(__file__).resolve().parents[1]
w=openpyxl.load_workbook(source,read_only=True,data_only=True)
summaries=list(w['경로별_요약'].values)[1:]
stops=collections.defaultdict(list); operators=collections.defaultdict(list)
for row,r in enumerate(list(w['경로별_휴게소(순서)'].values)[1:],2):
    if r[0]: stops[r[:2]].append((row,r))
for row,r in enumerate(list(w['휴게소별_운영기관'].values)[1:],2):
    if r[0] and r[1]: operators[r[:5]].append((row,r))
routes=[]; details=[]; mismatches=[]
for summary in summaries:
    origin,destination=summary[:2]; rows=sorted(stops[origin,destination],key=lambda x:x[1][2]); n=len(rows)
    route=dict(origin=origin,destination=destination,highway=origin+' → '+destination,highwayLabel='',travelDirection='',restAreas=[],stops=[])
    ranked=[]
    for index,(row,r) in enumerate(rows):
        assert r[2]==index+1
        candidates=[]
        for opRow,o in operators[r[:5]]:
            item=dict(sourceRow=opRow,serviceAreaName=r[3],direction=r[4] or '',operatorDisplay=o[6] or '정보 없음',detailOperator=o[6] or '정보 없음',price=o[7],maxOutputKw=o[9],chargerCount=o[10],openingStatus=o[12],lat=o[14],lng=o[15])
            details.append(item)
            if o[12] in ('운영','오픈예정') and all(isinstance(o[i],(float,int)) for i in (7,9,10)):
                middle={(n-1)//2,n//2};pos=2 if index in middle else 1 if any(abs(index-m)==1 for m in middle) else 0
                score=pos+(3 if o[10]>=8 else 2 if o[10]>=4 else 1 if o[10]==3 else 0)+(3 if o[9]>=350 else 2 if o[9]>=200 else 1 if o[9]>=100 else 0)
                candidates.append((o[7],-score,-o[9],-o[10],index,opRow))
        best=min(candidates) if candidates else None
        if best: ranked.append(best)
        route['restAreas'].append(r[3])
        route['stops'].append(dict(name=r[3],direction=r[4] or '',order=r[2],recommended=r[5]=='Y',sourceRow=row,candidateRows=[x[0] for x in operators[r[:5]]],displayRow=best[-1] if best else None,lat=r[11],lng=r[12]))
    if rows:
        winner=min(ranked) if ranked else None
        flagged=[s for s in route['stops'] if s['recommended']]
        if len(flagged)!=1 or winner is None or flagged[0]['displayRow']!=winner[-1]:mismatches.append([origin,destination])
    routes.append(route)
assert not mismatches,mismatches
data=dict(version='20260917-recommended',sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),originOptions=list(dict.fromkeys(r['origin'] for r in routes)),routes=routes,stationDetails=details)
(root/'data.generated-20260917.js').write_text('window.APP_ROUTE_DATA = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
print(json.dumps(dict(routes=len(routes),visibleRoutes=sum(bool(r['stops']) for r in routes),stops=sum(len(r['stops']) for r in routes),operators=len(details),recommendationsVerified=True),ensure_ascii=False))
