# Trip Portal 개발 내용 정리

작성일: 2026-05-11

## 프로젝트 개요

`trip-portal`은 Next.js 14 App Router 기반의 여행 가이드 포털입니다. 사용자가 매번 여행지를 입력해 새 일정을 생성하는 앱이 아니라, 개발 중 MCP와 보조 데이터로 미리 보강한 여행 일정, 장소 설명, 지도 정보, 교통/숙소 정보를 정적 가이드 형태로 제공하는 앱입니다.

현재 핵심 방향은 다음과 같습니다.

- 홈에서 대표 여행과 저장된 여행 라이브러리를 보여줍니다.
- 여행 상세 화면에서 전체 루트, 항공권, 일자별 일정, 지도, 숙소 정보를 탐색합니다.
- 일자별 화면에서 모바일 앱처럼 지도, 타임라인, 장소 카드, 상세 바텀시트를 제공합니다.
- 장소 상세 화면에서 관광지 설명, 방문 이유, 볼거리, 팁, 다음 장소 정보를 제공합니다.
- 앱 실행 중 MCP 호출은 동선 최적화, 지도 링크 생성처럼 사용자 트리거 또는 실시간성이 있는 기능에 제한합니다.

## 기술 스택

- Next.js `14.2.3`
- React `18.2`
- TypeScript
- Tailwind CSS
- Framer Motion
- lucide-react 아이콘
- OpenStreetMap / Leaflet iframe 지도
- 선택적 Google Maps Embed 연동
- Travel MCP / Stitch MCP 연동 구조

주요 실행 스크립트:

```bash
npm run dev
npm run build
npm run typecheck
```

## 주요 라우트

- `/`: 여행 포털 홈
- `/trips/[tripId]`: 여행 전체 상세
- `/trips/[tripId]/day/[dayId]`: 일자별 상세 가이드
- `/trips/[tripId]/places/[placeId]`: 관광지 상세 페이지
- `/api/travel`: Stitch MCP 또는 정적 fallback 여행 데이터 반환
- `/api/geocode`: Photon geocoding API를 감싼 지도 좌표 프록시

## 현재 포함된 여행 데이터

정적 여행 데이터의 중심 파일은 `lib/fallback-travel.ts`입니다.

현재 포함된 대표 여행:

- `sicily-malta-rome-17d`
  - 제목: `Sicily & Malta — 19 Days`
  - 기간: `May 21, 2026 — Jun 8, 2026`
  - 국가: Italy, Malta
  - 현재 홈의 메인 여행으로 사용됩니다.
- `swiss-alps-grand-route-2025`
  - 제목: `Swiss Alps Grand Route — 19 Days`
  - 기간: `May 30, 2025 — Jun 17, 2025`
  - 국가: Italy, Switzerland, France, Austria, Czechia, Slovenia
  - 홈의 다른 여행 라이브러리로 노출됩니다.

세부 가이드 데이터:

- `lib/sicily-guide-data.ts`
  - Sicily / Malta / Rome 일정의 항공권, 마스터 타임라인, 일자별 가이드 데이터
  - 소스: `Sicily 202605.kml + confirmed transport`
- `lib/swiss-guide-data.ts`
  - Swiss Alps Grand Route 일정의 항공권, 마스터 타임라인, 일자별 가이드 데이터
  - 소스: `Swiss202506.pdf`
- `lib/trip-guide.ts`
  - 여행 ID에 맞는 가이드 데이터를 선택합니다.
  - 명시적 일자 가이드가 없는 경우 마스터 타임라인에서 임시 일자 가이드를 생성합니다.
  - 장소 상세 데이터가 부족한 경우 기본 설명, 방문 이유, 볼거리, 팁을 생성합니다.

## 구현된 화면

### 홈 화면

파일: `components/travel-home.tsx`

구현 내용:

- 상단 고정 헤더
- 대표 여행 히어로 패널
- 다음 일정 카드
- 여행 지표 카드
  - 전체 일수
  - 국가 수
  - 다음 목적지 기온
  - 추천 가이드 수
- 가로 스크롤 일자 타임라인
- 추천 장소 카드
- 다른 여행 라이브러리
- 모바일 하단 탭 네비게이션

홈 화면은 `app/page.tsx`에서 `fallbackTravelPayload`를 직접 사용합니다.

### 여행 전체 상세 화면

파일: `components/trip-detail.tsx`

구현 내용:

- 데스크톱과 모바일 화면 분기
- 데스크톱용 editorial dossier 스타일
- 여행 히어로
- 고정 섹션 앵커바
- 항공권 카드
- 전체 루트 지도
- 마스터 타임라인 테이블
- 일자별 브리프
- 지도 커버리지 점검 카드
- 관광지 사진 피드
- 장소 클릭 시 상세 바텀시트
- 숙소 카드와 지도

데이터 로딩은 `/api/travel`을 우선 호출하고, 실패 시 `fallbackTravelPayload`로 되돌아갑니다.

### 모바일 여행 앱 화면

파일: `components/mobile-trip-app.tsx`

구현 내용:

- 모바일 전용 탭 UI
  - Overview
  - Route
  - Daily
  - Sights
  - Logistics
- Instagram Story 스타일 일자 선택 UI
- 일자별 지도
- 장소 타임라인
- 스마트 동선 최적화 버튼
- 지도 앱에서 보기 버튼
- 장소 갤러리
- 항공/교통 스케줄 카드
- 장소 상세 바텀시트

### 일자별 상세 화면

파일: `components/daily-detail.tsx`

구현 내용:

- 일자별 고정 헤더와 날짜 탭
- 지도 영역
  - 좌표가 여러 개면 `MultiOsmMap`
  - 좌표가 하나면 `OsmMap`
  - 좌표가 없으면 지역명 기반 지도 검색
- 숙소, 장소, 이동 구간을 하나의 타임라인으로 구성
- 장소를 중요도/역할에 따라 분류
- 도시 간 이동일 또는 장소 데이터가 부족한 날은 placeholder guide 생성
- 동선 거리 계산과 예상 이동 시간 표시
- MCP 기반 동선 최적화 및 지도 링크 생성 버튼
- 하단 앱 네비게이션

### 장소 상세 화면

파일: `components/place-detail.tsx`

구현 내용:

- 장소 전용 히어로 이미지
- 장소 카테고리와 이름
- 매거진형 긴 설명
- 정적 가이드 노트
  - 상세 설명
  - 소요 시간
  - 방문 이유
  - 현장에서 볼 것
  - 방문 팁
  - 다음 장소
- 바텀시트 형태의 빠른 상세 보기 컴포넌트

장소 상세 설명은 앱 실행 중 MCP를 즉시 호출하지 않고, 개발 중 보강된 정적 데이터를 우선 사용합니다.

## 지도 기능

### 단일 지도

파일: `components/osm-map.tsx`

구현 내용:

- 기본은 OpenStreetMap iframe 사용
- `/api/geocode`를 통해 주소/장소명을 좌표와 bbox로 변환
- `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY`와 `NEXT_PUBLIC_ENABLE_GOOGLE_EMBED_MAPS=true`가 있으면 Google Maps Embed 사용
- 지도 검색 실패 시 fallback 메시지 표시

### 다중 마커 지도

파일: `components/multi-osm-map.tsx`

구현 내용:

- 여러 좌표를 Leaflet iframe `srcDoc`으로 렌더링
- CARTO Voyager 타일 사용
- 번호 마커 표시
- 마커 사이 점선 경로 표시
- 마커 클릭 시 페이지 이동 또는 콜백 호출
- 마커가 1~2개이고 Google Maps Embed 설정이 있으면 Google Maps로 렌더링 가능

## API 및 서버 액션

### `/api/travel`

파일: `app/api/travel/route.ts`

역할:

- Stitch MCP에서 여행 payload를 가져옵니다.
- 실패하거나 응답이 없으면 `fallbackTravelPayload`를 반환합니다.
- `dynamic = "force-dynamic"` 설정으로 항상 동적 응답을 사용합니다.

### `/api/geocode`

파일: `app/api/geocode/route.ts`

역할:

- Photon geocoding API를 호출해 장소명을 좌표로 변환합니다.
- 메모리 캐시를 사용합니다.
- 검색 결과가 없으면 쉼표 앞부분 또는 첫 단어로 재시도합니다.
- 지도 표시를 위해 bounding box를 계산합니다.

### MCP 서버 액션

파일: `lib/mcp-actions.ts`

구현된 액션:

- `planTripAction`
  - `plan_trip` MCP 도구 호출
- `optimizeRouteAction`
  - `optimize_daily_route` MCP 도구 호출
- `getWikiAction`
  - `get_attraction_wiki` MCP 도구 호출
- `generateMapLinkAction`
  - `generate_map_links` MCP 도구 호출

SSE 기반 MCP 연결 흐름:

1. `/sse` 연결
2. MCP initialize
3. `notifications/initialized`
4. `tools/call`
5. JSON-RPC 응답 파싱
6. structured content 또는 text content 추출

## MCP 활용 정책

기존 정리 문서인 `mcp-integration-summary.md`의 방향을 유지합니다.

- Stitch MCP는 디자인 브리프와 화면 구조 도출용으로 사용합니다.
- my-travel-mcp는 장소 설명, 역사, 방문 팁, 동선, 지도 링크 후보를 개발 중 보강하는 도구로 사용합니다.
- 런타임에서는 정적 가이드 데이터를 우선 렌더링합니다.
- 실시간성이 필요한 일부 기능만 사용자 트리거로 MCP를 호출합니다.

## 생성/보강 스크립트

현재 확인된 스크립트:

- `scripts/generate-travel-mcp-routes.mjs`
- `scripts/generate-local-attraction-mcp.mjs`
- `scripts/enrich-attractions-from-mcp.mjs`

생성 데이터:

- `data/generated/sicily-route-mcp.json`
- `data/generated/local-attraction-mcp.json`

목적:

- MCP를 통해 경로, 관광지, 장소 설명을 개발 중 생성/보강합니다.
- 결과를 검수한 뒤 정적 TS/JSON 데이터에 반영하는 흐름을 사용합니다.

## 디자인 시스템

Tailwind 확장 토큰은 `tailwind.config.ts`에 정의되어 있습니다.

주요 색상:

- `ink`, `paper`, `stone`, `moss`, `clay`, `wine`, `brass`
- 모바일 필드 가이드용 `field.surface`, `field.ink`, `field.forest`, `field.teal`, `field.brass`, `field.line`

주요 톤:

- 데스크톱: editorial dossier / travel magazine
- 모바일: native app / field guide / story-style daily browsing
- 홈: 여행 포털과 가이드 라이브러리 혼합

## 환경 변수

`.env.example` 기준:

```bash
STITCH_MCP_URL=https://stitch.googleapis.com/mcp
STITCH_MCP_API_KEY=your-key
STITCH_TRAVEL_TOOL=travel_context
```

추가로 코드에서 사용하는 변수:

```bash
TRAVEL_MCP_BASE_URL=https://travelmcp.yejeelee.synology.me
TRAVEL_MCP_SSE_URL=https://travelmcp.yejeelee.synology.me/sse
NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY=
NEXT_PUBLIC_ENABLE_GOOGLE_EMBED_MAPS=true
```

## 현재 남은 작업 후보

- `lib/stitch-mcp.ts`를 런타임 핵심 경로에서 분리하거나 개발 전용 유틸로 정리
- MCP로 보강한 관광지 설명을 `data/generated`에서 정적 가이드 데이터로 더 체계적으로 반영
- 일자별 상세 화면의 동선 최적화 결과를 alert가 아니라 UI 상태로 반영
- `SightsSection`, `LogisticsSection`의 데스크톱 placeholder 영역을 실제 데이터 기반 화면으로 완성
- 지도/장소 데이터가 부족한 날짜의 placeholder 표현을 더 명확히 다듬기
- `/api/geocode` 외부 호출 실패 시 UX와 캐시 전략 개선
- 런타임 MCP 버튼의 라벨을 “최신 확인” 또는 “도구 실행” 성격으로 더 명확히 정리
- 타입 안정성 보강 및 `any` 사용 축소

## 참고 파일

- `README-next.md`: Next.js 실행과 Stitch MCP 환경 변수 안내
- `mcp-integration-summary.md`: MCP 활용 설계와 적용 방향
- `components/travel-home.tsx`: 홈 화면
- `components/trip-detail.tsx`: 여행 상세 데스크톱/모바일 분기
- `components/mobile-trip-app.tsx`: 모바일 앱형 여행 상세
- `components/daily-detail.tsx`: 일자별 상세
- `components/place-detail.tsx`: 장소 상세 및 바텀시트
- `components/osm-map.tsx`: 단일 지도
- `components/multi-osm-map.tsx`: 다중 마커 지도
- `lib/fallback-travel.ts`: 정적 여행 payload
- `lib/trip-guide.ts`: trip ID별 가이드 데이터 선택 및 fallback 생성
- `lib/sicily-guide-data.ts`: 시칠리아/몰타/로마 상세 데이터
- `lib/swiss-guide-data.ts`: 스위스 알프스 상세 데이터
- `lib/mcp-actions.ts`: Travel MCP 서버 액션
