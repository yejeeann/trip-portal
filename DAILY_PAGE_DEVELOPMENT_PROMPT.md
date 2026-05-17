# Daily Page Development Prompt

이 문서는 `daily` 일자별 페이지를 같은 방식과 품질 기준으로 개발하기 위한 설계 프롬프트입니다.  
목표는 KML/DOCX 원본, MCP 서버 응답, LLM 보강 결과를 바탕으로 실제 이동 가능한 일정을 만들고, 앱 실행 중 외부 호출 없이 정적 데이터로 안정적으로 보여주는 것입니다.

## 개발 원칙

1. 원본 데이터 확인
   - KML 파일에서 도시, 관광지, 좌표, 이동 후보를 추출한다.
   - DOCX 파일에서 도시별 역사, 문화, 인물, 신화, 건축, 메모를 추출한다.
   - 확정 교통편, 숙소 주소, 체크인/out 날짜, 항공/기차/페리 시간을 함께 반영한다.
   - KML/DOCX에 있는 장소는 빠뜨리지 않는다. 실제 방문이 어려우면 `선택`, `대안 루프`, `메모 카드`로 보존한다.

2. MCP 서버 활용
   - `optimize_daily_route`: 장소 순서와 가능한 동선 검토.
   - `generate_map_links`: 일자별 경로 지도 링크 생성.
   - `get_attraction_wiki`: 관광지 기본 정보와 설명 근거 수집.
   - MCP 결과는 `data/generated/...json`에 저장해 추적 가능한 근거 데이터로 남긴다.

3. LLM 보강
   - MCP 응답이 짧거나 부족하면 LLM으로 역사, 문화, 배경, 관람 포인트, 동선 팁을 보강한다.
   - 관광지별 상세설명은 400자 이상으로 작성한다.
   - 설명은 단순 소개가 아니라 “왜 이 일정에 들어가는지”가 드러나야 한다.
   - 최종 앱 데이터는 런타임 MCP 호출이 아니라 `lib/sicily-guide-data.ts` 같은 정적 데이터로 저장한다.

4. 일정 설계
   - 이동시간, 체류시간, 식사/휴식, 숙소 체크인/out, 확정 교통편을 함께 고려한다.
   - 하루에 불가능한 장소는 실제 일정에 무리하게 넣지 않고 대안/선택 카드로 분리한다.
   - 추가 핵심 명소나 숨은 명소가 빠져 있으면 포함하되, 이동상 가능한 경우만 실제 방문 일정으로 둔다.
   - 도시/지역 이동 흐름과 관광지 관람 흐름을 분리해서 설계한다.

5. 페이지 구조
   - 상단 daily 지도: 하루 전체의 도시/지역 간 이동 흐름만 표시한다.
   - 도시별/구간별 지도: 해당 도시 또는 권역 안의 관광지 핀만 표시한다.
   - 지도 위에는 번호 핀과 검증된 실제 경로선만 표시한다.
   - 장소명, 설명, 거리/시간, 범례성 중복 문구는 지도 위에 올리지 않고 아래 Route 리스트에서 처리한다.
   - 지도 배경은 출판형 editorial map 스타일을 기본으로 한다. 저채도, 저라벨, 낮은 대비 배경 위에 경로선과 번호 핀만 강조한다.
   - 웹/앱 daily 상단 지도는 접기/펼치기 컨트롤을 항상 유지한다.
   - 아래 타임라인: 도시/지역 구간 안에 실제 관광지별 카드를 표시한다.
   - 관광지 카드는 이미지, 시간, 체류시간, 상세설명, 볼거리, 팁을 포함한다.
   - 이미지는 외부 URL 런타임 호출이 아니라 `public/travel-photos/...` 아래 정적 파일을 사용한다.

6. PDF 전체 구성 기준
   - PDF는 아래 7단 구성을 기본 순서로 고정한다.
   - 1) 표지
   - 2) 전체 루트 요약 지도
   - 3) 항공권과 야간열차: 확정 항공편과 장거리 야간열차만 모은 이동 전용 페이지
   - 4) Accommodations: 숙소 전체 요약, 주소, 체크인/out 빠른 참조
   - 5) Day별 일자별 가이드: PDF의 핵심 본문
   - 6) 장소별 상세 설명 부록: Daily 본문에서 줄인 긴 역사/배경 설명만 선별
   - 7) 오프라인 체크리스트
   - `GuideIntro`, `GuideIndex`, `RouteSchedule`, 전면 `City & Place Guide`처럼 Daily 본문과 중복되거나 공백이 큰 섹션은 기본 PDF에 넣지 않는다.
   - 항공권과 야간열차는 이동 전용 페이지에서 요약하고, Daily Page A/B에는 같은 대형 카드를 반복하지 않는다.
   - 장소별 상세 설명 부록은 Daily 뒤에 둔다. 이미지와 짧은 장소 요약은 Daily Page B가 담당하고, 부록은 텍스트 중심의 깊은 설명만 담당한다.
   - 부록은 모든 장소를 다시 반복하는 장이 아니다. 핵심 역사/문화/배경 설명이 긴 장소만 선별해 PDF가 과도하게 길어지지 않게 한다.

7. PDF Daily 확정 템플릿 기준
   - Daily PDF는 일자별 2페이지 스프레드로 만든다.
   - Page A는 `Maps & Movement` 역할이다. 도시/지역 이동 지도, 도시 내부 관광지 지도, Movement Route, Sight Route만 배치한다.
   - Page A 지도는 번호 핀 중심으로 구성하고, 번호는 Movement Route/Sight Route 리스트와 1:1로 대응해야 한다.
   - Movement Route/Sight Route 리스트가 장소명, 이동 흐름, 구간별 거리/시간을 담당한다. 지도 위에 같은 정보를 반복하지 않는다.
   - Page A 지도 비율은 실제 카드/패널의 가로세로비에 맞춰 렌더링한다. 타일이나 경로선이 늘어나 보이면 실패로 본다.
   - Page A 지도 배경은 복잡한 웹지도처럼 보이지 않게 저채도/저라벨 타일을 사용하고, 경로선과 번호 핀이 시각적 주인공이 되게 한다.
   - Page B는 `Places & Practical` 역할이다. 대표 이미지, Key Stops, Secondary Stops, Practical Notes, 특수 교통 카드만 배치한다.
   - Page B는 출판형 editorial layout으로 구성한다. 상단에는 대표 랜드마크 리드 스토리, 본문에는 Key Stops 랜드마크 인덱스, 오른쪽 사이드 레일에는 Secondary Stops, Practical Notes, 특수 교통 카드를 둔다.
   - Key Stops는 하루의 랜드마크 인덱스다. 대표 도시, 핵심 관광지, 필수 랜드마크가 모두 포함되어야 한다.
   - Secondary Stops는 보조 동선, 휴식, 분위기 장소, 선택성이 있는 짧은 정차만 둔다. 핵심 랜드마크가 Secondary로 밀리면 실패로 본다.
   - Page A와 Page B는 같은 순서를 공유해야 한다. Sight Route의 순서와 Key Stops의 순서가 다르면 원인을 확인한다.

8. 핵심 장소 포함 검수
   - 원본 KML/DOCX, MCP 산출물, 기존 `cityVisits.spots`, `places`, `routeOverview`를 대조해 도시/관광지 누락 목록을 만든다.
   - 각 일자마다 `필수 방문`, `보조 방문`, `휴식/식사`, `이동 기준점`, `선택/대안`으로 장소 역할을 분류한다.
   - `필수 방문`으로 분류한 장소는 반드시 Page A의 Local Sight Map 또는 Movement Map, Page B의 Key Stops 중 적절한 위치에 들어가야 한다.
   - 이동 기준점은 Movement Map/Movement Route에는 들어갈 수 있지만, 관광지 Key Stops에는 넣지 않는다.
   - 실제 방문이 어려운 핵심 후보는 삭제하지 않고 Secondary, 대안 루프, Field Notes 중 하나로 보존한다.

9. 경로 정확도 검수
   - 이동거리/시간은 직선거리 추정만으로 확정하지 않는다.
   - 차량/도보/페리/기차/항공 모드별로 OSRM, Google Maps 링크, MCP `generate_map_links`, 확정 교통편 시간을 대조한다.
   - Movement Route는 실제 도로, 산악 지형, 해안 우회, 페리 대기, 주차/하차 지점을 고려한 순서여야 한다.
   - 이동거리/시간 검수 결과가 없는 구간은 “검수 필요”로 남기고 출판용 확정 페이지로 처리하지 않는다.
   - 도로/도보 경로선은 OSRM geometry, Google Maps 검수, MCP 결과처럼 검증 가능한 route geometry만 사용한다.
   - 경로 geometry가 실패한 구간은 임의 직선으로 대체하지 않고 `거리/시간 검수 필요` 상태로 남긴다.
   - 지도에 표시되는 routeOverview 순서와 검수된 이동 순서가 다르면 지도 데이터를 먼저 수정한다.
   - 도시 간 이동과 도시 내부 관광을 한 지도에 섞어 축척이 깨지면 반드시 Movement Map과 Local Sight Map으로 분리한다.
   - 항공/장거리 기차 종점은 메인 daily 지도와 Movement Map에는 번호 핀으로 포함한다.
   - 항공/장거리 기차 종점이 도시 관광 지도 축척을 깨면 Local Sight Map에서는 제외하고 교통 카드나 Movement Route로 분리한다.

## 지도 설계 기준

### 1. Daily 상단 지도

- 목적: 그날의 큰 이동 흐름을 한눈에 보여준다.
- 데이터 소스: 가능하면 `routeOverview`를 별도로 둔다.
- 표시 대상: 출발 도시/숙소, 공항/역/페리 항구, 이동 후 도착 도시, 당일 권역 대표 지점, 최종 숙소.
- 표시 단위: 관광지 개별 핀이 아니라 도시/권역/이동 거점 단위.
- 예시:
  - Day 7: Catania -> Malta -> Gzira -> Valletta -> Three Cities
  - Day 8: Gzira -> Cirkewwa -> Gozo -> Comino -> Gzira
  - Day 9: Gzira -> South Coast -> Mdina/Mosta -> Malta Airport -> Catania Airport -> San Calogero
- 금지: Upper Barrakka Gardens, St. John's Co-Cathedral처럼 같은 도시 안의 관광지를 상단 daily 지도에 전부 표시하지 않는다.
- 항공, 기차, 페리 이동은 도시별 관광 카드에는 넣지 않더라도 daily 상단 지도와 이동 타임라인에는 포함할 수 있다.
- 항공, 장거리 기차 도착지는 관광지가 아니어도 daily 상단 지도에는 도시 이동의 최종 도착점 번호 핀으로 표시한다.

### 2. 도시별/구간별 지도

- 목적: 해당 도시나 권역 안에서 실제 관광지를 어떤 순서로 볼지 보여준다.
- 데이터 소스: `cityVisits.spots` 중 관광지로 분류된 항목.
- 표시 대상: 도시 내부 관광지, 전망대, 성당, 유적, 해변, 숨은 명소.
- 제외 대상: 공항, 숙소 체크인 지점, 페리 터미널, 단순 이동 기준점. 필요하면 `이동/기준 지점` 보조 카드로만 표시한다.
- 장거리 항공/기차 도착지는 Local Sight Map에 넣지 않는다. 해당 지점은 daily 상단 지도나 Movement Map, 교통 카드에서만 보여준다.
- 금지: `Gzira -> Gozo`, `Malta -> Catania`처럼 이동 자체를 도시별 일정 카드 제목이나 구간으로 만들지 않는다. 이런 이동은 `routeOverview`와 상단 이동 타임라인에만 둔다.
- 예시:
  - Valletta 구간 지도: Valletta, Upper Barrakka Gardens, St. John's Co-Cathedral
  - Three Cities 구간 지도: Birgu, Bormla/Cospicua, Senglea/Gardjola Gardens
  - Gozo 구간 지도: Cittadella, Gozo Island, Ggantija Archaeological Park

### 3. 지도 표현 및 거리/시간 표기 규칙

- 웹/앱/PDF 공통으로 지도 위에는 번호 핀과 실제 경로선만 표시한다.
- 장소명, 설명, 거리/시간, 범례성 중복 텍스트는 지도 위에 올리지 않는다.
- 배경 지도는 `editorial map` 스타일을 기본으로 한다.
- 배경 지도는 저채도, 저라벨, 낮은 대비로 처리해 도로명/주변 POI가 경로 이해를 방해하지 않게 한다.
- 경로선은 배경과 분리되도록 밝은 casing 선 위에 테마 컬러 라인을 올린다.
- 경로선은 지도보다 먼저 튀면 실패로 본다. 출판형 지도에서는 낮은 opacity와 얇은 stroke를 기본으로 하고 번호 핀을 주 정보로 둔다.
- 번호 핀은 Route 리스트와 연결되는 주 정보이므로 배경보다 높은 대비로 표시한다.
- 번호 핀은 아래 Today Route, Movement Route, Sight Route 리스트의 번호와 1:1로 대응해야 한다.
- 메인 daily 지도와 Movement Map은 장거리 항공/기차 종점을 포함하되, 실제 도로/도보 경로선으로 검증되지 않은 장거리 구간은 임의 직선으로 잇지 않는다.
- 구간별 거리/시간은 지도 아래 또는 옆의 Route 리스트에 표시한다.
- 웹/앱: 상단 지도 아래 Today Route 카드에서 도시/교통 이동 순서와 거리/시간만 보여준다.
- Today Route에는 관광지, 랜드마크, 식사/휴식 지점을 넣지 않는다. 이들은 Local Sight Map, Sight Route, 장소 카드에서만 다룬다.
- PDF: Page A의 Movement Route / Sight Route 리스트에서 이동 순서와 거리/시간을 보여준다.
- 지도 비율은 실제 렌더 카드의 가로세로비를 따라야 하며, OSM/Google/정적 타일이 늘어나 보이면 실패로 본다.
- 도로/도보 경로선은 OSRM geometry 등 검증된 route geometry만 사용한다. 실패 구간은 직선으로 그리지 않고 `거리/시간 검수 필요`로 남긴다.
- Google Maps는 검수, 열기 링크, 단일 장소 embed에 활용하고, PDF용 지도는 인쇄 안정성을 위해 OSM 타일/정적 경로 데이터를 우선한다.
- 앱/웹 daily 상단 지도는 접기/펼치기 컨트롤이 항상 보여야 한다.

### 4. 데이터 역할 분리

- `routeOverview`: daily 상단 지도와 도시 이동 타임라인의 원천 데이터. 렌더링할 때는 `flight`, `train`, `ferry`, `transit`, 공항, 역, 항구, 숙소, 도시 기준점 등 이동 포인트만 Today Route/Movement Map에 사용한다.
- `cityVisits`: 아래 도시/권역별 일정 섹션 전용. 이동 전용 구간이 아니라 실제 관광을 하는 도시/권역만 둔다.
- `cityVisits.spots`: 도시 내부 관광지 카드와 도시별 지도 전용.
- `places`: 상세 페이지, 검색, PDF 참조, 전체 장소 데이터 보존용.

## 설계 프롬프트 템플릿

```text
다음 여행 일자의 daily 페이지 일정을 설계해줘.

목표:
- KML 파일의 도시/관광지와 DOCX 파일의 장소/역사 메모를 모두 검토한다.
- KML/DOCX에 포함된 장소는 빠뜨리지 말고, 실제 방문/선택/대안 루프/메모 카드로 구분한다.
- 추가로 꼭 가봐야 할 핵심 명소나 숨은 명소가 빠져 있으면 포함한다.
- 이동시간, 체류시간, 식사/휴식, 숙소 체크인/out, 확정 교통편을 고려해 실제 가능한 일정으로 설계한다.
- 관광지별 상세설명은 역사, 문화, 배경, 관람 포인트를 포함해 400자 이상 작성한다.
- 관광지별 이미지는 앱 실행 시 안정적으로 표시되도록 로컬 정적 이미지 경로를 사용한다.
- 앱 실행 중 MCP/LLM을 호출하지 않도록 최종 결과는 정적 데이터로 사용할 수 있게 작성한다.

입력:
- Day: {day}
- Date: {date}
- 숙소/거점: {base_accommodation}
- 확정 교통편: {confirmed_transport}
- KML 장소 목록: {kml_places}
- DOCX 메모 목록: {docx_notes}
- 기존 앱 데이터 구조: cityVisits 안에 도시/지역 구간, spots 안에 관광지 카드
- daily 상단 지도 데이터 구조: routeOverview 안에 하루 전체 도시/지역 이동 지점

MCP 활용 결과:
- route optimization: {mcp_optimized_route}
- map links: {mcp_map_links}
- attraction wiki/details: {mcp_attraction_details}

출력 형식:

1. 일정 설계 판단
   - 포함한 KML/DOCX 장소
   - 추가한 핵심/숨은 명소
   - 실제 방문 장소
   - 선택/대안/메모 처리한 장소
   - 이동시간/체류시간 기준

2. cityVisits 구조
   - city: 도시/지역 구간명
   - stayDuration: 실제 체류 시간
   - routeMode: walk / drive / ferry / transit
   - entryPoint: 이동 시작 기준점
   - coordinates: 도시/지역 대표 좌표
   - spots: 관광지별 카드 목록
   - practicalNotes: 이동, 주차, 입장, 식사, 날씨, 체크인/out 팁

3. routeOverview 구조
   - id
   - name: 지도/타임라인에 표시할 도시 또는 권역명
   - detail: 항공, 페리, 숙소, 권역 설명
   - mode: flight / train / ferry / drive / walk / taxi / transit
   - coordinates: 도시/권역 대표 좌표
   - 주의: 같은 도시 안 관광지 개별 좌표를 모두 넣지 않는다.

4. 관광지별 정적 데이터
   - id
   - name
   - category
   - timeLabel
   - duration
   - coordinates
   - image: 로컬 정적 이미지 경로
   - imageAlt
   - shortDescription
   - detailDescription: 400자 이상
   - whyVisit
   - whatToSee
   - tips

5. PDF 생성용 md 반영
   - 일자별 상세 일정표
   - 이동/체류시간 기준
   - KML/DOCX 포함 여부
   - MCP 산출물 참조 경로
   - 관광지별 이미지 경로
   - 관광지별 400자 이상 상세설명
   - 실제 방문/선택/대안 구분

6. 검수 체크리스트
   - KML/DOCX 장소 누락 여부
   - 도시/관광지 핵심 장소가 `필수 방문`, `보조 방문`, `이동 기준점`, `선택/대안`으로 분류됐는지
   - `필수 방문` 장소가 Page B Key Stops에 포함됐는지
   - 핵심 랜드마크가 Secondary Stops로 밀리지 않았는지
   - Page A Sight Route와 Page B Key Stops의 순서가 일치하는지
   - 추가 핵심/숨은 명소 포함 타당성
   - 이동/체류시간 현실성
   - 이동거리/시간이 실제 도로/도보/페리/철도/항공 기준으로 검수됐는지
   - `routeOverview` 순서가 검수된 실제 이동 순서와 일치하는지
   - Movement Map과 Local Sight Map의 분리 기준이 지켜졌는지
   - 지도 핀 축척 때문에 도시 내부 관광지 위치가 흐려지지 않는지
   - 지도 위에 번호 핀 외 장소명/거리/시간 배지가 올라오지 않는지
   - 배경 지도가 저채도/저라벨 editorial map으로 보이는지
   - 도로명/주변 POI가 너무 강하게 보여 경로와 번호 핀을 방해하지 않는지
- 경로선이 배경과 충분히 분리되어 보이는지
- 경로선이 너무 진하거나 굵어서 배경 지도와 번호 핀을 압도하지 않는지
   - 지도 번호와 아래 Route 리스트 번호가 일치하는지
   - 거리/시간이 지도 아래 또는 옆 Route 리스트에 표시되는지
   - Today Route에 관광지/랜드마크/식사/휴식 지점이 섞이지 않았는지
   - 관광지는 Local Sight Map, Sight Route, 장소 카드로만 내려갔는지
   - 웹/앱 daily 상단 지도 접기/펼치기 동작이 유지되는지
   - 지도 타일/경로선이 실제 카드 비율에 맞고 늘어나지 않는지
   - 장거리 항공/기차 종점이 도시 관광 지도 축척을 깨지 않는지
   - 장거리 항공/기차 종점이 메인 daily 지도와 Movement Map에는 포함되고 Local Sight Map에서는 제외되는지
   - 이미지 정적 파일 존재 여부
   - 이미지와 관광지 매칭 정확도
   - 관광지 상세설명 400자 이상 여부
   - 관광지 상세설명 역사/문화/배경 정보 포함 여부
   - 관광지 상세설명 내용 정확도
   - 앱 실행 시 이미지 누락/깨짐 여부
   - daily 상단 지도가 도시/지역 간 이동 흐름으로 보이는지 여부
   - 도시별/구간별 지도가 해당 도시 내부 관광지 핀으로 보이는지 여부
   - 앱 페이지 구조가 도시 이동 흐름 + 관광지별 카드로 보이는지 여부
   - 앱 빌드/typecheck 통과 여부
```

## 구현 체크포인트

- `routeOverview`는 daily 상단 지도와 도시 이동 타임라인을 표현한다.
- `cityVisits`는 아래 도시/지역별 관광 일정 구간을 표현한다.
- `cityVisits.spots`는 실제 관광지별 카드를 표현한다.
- `places`는 상세 페이지, 지도, 카드 렌더링을 위해 관광지 기준으로 유지한다.
- 항공, 기차, 페리, 숙소는 관광지 카드와 구분하되 일정 흐름에는 포함한다.
- 상단 daily 지도는 관광지 전체가 아니라 `routeOverview`의 도시/지역 이동 순서를 보여준다.
- 도시 내 관광지 지도는 해당 도시/구간 내부 카드에서 보이도록 한다.
- 메인 daily 지도와 PDF Movement Map에는 장거리 항공/기차 도착 도시를 최종 이동 지점으로 포함한다.
- Local Sight Map에는 장거리 항공/기차 도착 도시를 넣지 않고 해당 도시의 실제 관광일에 다시 표시한다.
- Today Route와 상단 City Route Map은 `routeOverview` 중 이동/교통 포인트만 사용하고 관광지를 표시하지 않는다.
- 관광지는 Local Sight Map, Sight Route, Key Stops, 장소 카드에서만 표시한다.
- 웹/앱/PDF 지도는 번호 핀과 실제 경로선만 표시하고, 거리/시간과 장소명은 Route 리스트에서 처리한다.
- 웹/앱/PDF 지도 배경은 출판형 editorial map 스타일로 낮은 채도, 낮은 대비, 최소 라벨을 사용한다.
- 경로선은 밝은 casing과 테마 컬러 라인을 함께 사용해 배경 지도와 분리한다.
- 경로선 opacity와 두께는 낮게 유지하고, 위치 인지는 번호 핀과 Route 리스트가 담당하게 한다.
- 웹/앱 daily 상단 지도 접기/펼치기 컨트롤이 지도 위에서 가려지지 않게 유지한다.
- PDF Page A의 Movement Route/Sight Route 리스트는 지도 번호와 같은 순서로 구간별 거리/시간을 보여준다.
- 지도는 실제 렌더 영역의 가로세로비에 맞춰 렌더링한다. 타일, 핀, 경로선이 늘어나 보이면 수정한다.
- PDF Page B의 Key Stops는 대표 랜드마크/핵심 관광지를 빠짐없이 보여주는 색인으로 유지한다.
- PDF Page B의 Secondary Stops는 보조 장소만 담고, 핵심 관광지를 밀어내는 보관 영역으로 쓰지 않는다.
- 거리/시간이 필요한 Movement Route 검수는 OSRM/MCP/Google Maps/확정 교통편 중 최소 하나 이상의 실제 경로 근거를 남긴다.
- PDF 참조 md는 앱 데이터보다 더 설명적인 원본 문서로 작성한다.

## 검증 명령

```powershell
npm run typecheck
npm run build
```

정적 이미지 경로 검증 예시:

```powershell
$content = Get-Content -Raw -Path lib\sicily-guide-data.ts
$matches = [regex]::Matches($content, '"(/(?:travel-photos|travel-art)/[^"]+)"') |
  ForEach-Object { $_.Groups[1].Value } |
  Sort-Object -Unique

$missing = @()
foreach ($path in $matches) {
  $fs = Join-Path (Get-Location) (Join-Path 'public' $path.TrimStart('/'))
  if (-not (Test-Path -LiteralPath $fs)) { $missing += $path }
}

if ($missing.Count) {
  $missing | ForEach-Object { Write-Host "MISSING $_" }
  exit 1
}

Write-Host "All static guide images found: $($matches.Count)"
```
