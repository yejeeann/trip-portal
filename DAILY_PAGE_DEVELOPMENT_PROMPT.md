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
   - 아래 타임라인: 도시/지역 구간 안에 실제 관광지별 카드를 표시한다.
   - 관광지 카드는 이미지, 시간, 체류시간, 상세설명, 볼거리, 팁을 포함한다.
   - 이미지는 외부 URL 런타임 호출이 아니라 `public/travel-photos/...` 아래 정적 파일을 사용한다.

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

### 2. 도시별/구간별 지도

- 목적: 해당 도시나 권역 안에서 실제 관광지를 어떤 순서로 볼지 보여준다.
- 데이터 소스: `cityVisits.spots` 중 관광지로 분류된 항목.
- 표시 대상: 도시 내부 관광지, 전망대, 성당, 유적, 해변, 숨은 명소.
- 제외 대상: 공항, 숙소 체크인 지점, 페리 터미널, 단순 이동 기준점. 필요하면 `이동/기준 지점` 보조 카드로만 표시한다.
- 금지: `Gzira -> Gozo`, `Malta -> Catania`처럼 이동 자체를 도시별 일정 카드 제목이나 구간으로 만들지 않는다. 이런 이동은 `routeOverview`와 상단 이동 타임라인에만 둔다.
- 예시:
  - Valletta 구간 지도: Valletta, Upper Barrakka Gardens, St. John's Co-Cathedral
  - Three Cities 구간 지도: Birgu, Bormla/Cospicua, Senglea/Gardjola Gardens
  - Gozo 구간 지도: Cittadella, Gozo Island, Ggantija Archaeological Park

### 3. 데이터 역할 분리

- `routeOverview`: daily 상단 지도와 도시 이동 타임라인 전용.
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
   - 추가 핵심/숨은 명소 포함 타당성
   - 이동/체류시간 현실성
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
