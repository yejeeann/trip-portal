# 여행가이드 앱 MCP 활용 설계

이 앱은 사용자가 런타임에 여행지를 입력해 새 일정을 생성하는 앱이 아닙니다. 목표는 MCP 서버들을 개발 도구로 활용해, 미리 준비된 여행 일정과 가이드 콘텐츠를 전문적인 여행가이드 앱으로 다듬는 것입니다.

## 핵심 원칙

- 여행 일정, 상세 설명, 화면 설계처럼 안정적인 정보는 개발 중 MCP로 보강한 뒤 앱 내부 정적 데이터로 제공합니다.
- 앱 실행 중 MCP 호출은 실시간성이 필요한 정보에만 제한합니다.
- 런타임 화면은 빠르고 안정적으로 정적 가이드 데이터를 렌더링합니다.

## MCP 서버 역할

### Stitch MCP

Stitch는 개발 중 디자인 파트너로 사용합니다.

- 홈, 일정, 지도, 장소 상세 화면의 UX 구조 제안
- `uiConfig`, `appStructure`, 카드 스타일, 네비게이션 방향 탐색
- 전문 여행앱 톤앤매너 검토
- 정적 디자인 토큰과 화면 패턴 도출

런타임에서 여행 일정이나 상세 설명을 매번 Stitch로 가져오지 않습니다.

#### 이번 Stitch 설계 산출물

- Project: `projects/7085487830212499712`
- Design System: `assets/12595645014709892290`
- Session: `1134198604808633029`
- Direction: `Atlas Guide`

Stitch에서 생성한 화면 구조는 다음과 같습니다.

- `Home / Trip Library`: 현재 여행, 이어보기, 저장 가이드, 여행 라이브러리
- `Trip Overview`: 전체 루트, 지도 프리뷰, 일자별 요약
- `Daily Plan`: 당일 날씨, 동선 지도, 시간순 장소 카드, 실용 메모
- `Route Map`: 전체 지도, 번호 핀, 하단 장소 리스트
- `Place Detail`: 관광지 사진, 방문 이유, 가이드 노트, 실용 정보, 다음 장소
- `Logistics`: 항공, 숙소, 교통, 예약, 준비사항

이 구조를 기준으로 앱의 정보 구조는 `홈 -> 여행 개요 -> 일자별 일정 -> 관광지 상세 -> 지도/준비정보` 흐름으로 설계합니다.

### my-travel-mcp

`my-travel-mcp`는 여행 지식과 가이드 보강 도구로 사용합니다.

- 기존 일정의 장소 설명, 역사, 방문 팁 보강
- 일자별 동선 최적화 결과를 개발 중 검토
- 지도 링크 후보 생성
- 필요 시 영업시간, 임시 휴무, 최신 동선 같은 실시간성 정보만 앱 실행 중 호출

## 현재 앱 데이터 흐름

```txt
개발 중:
Stitch MCP -> 디자인 브리프와 화면 패턴 도출
my-travel-mcp -> 일정 설명, 장소 정보, 동선 정보 보강

앱 실행 중:
fallback-travel.ts / swiss-guide-data.ts 등 정적 데이터 -> Next.js UI 렌더링
실시간성이 필요한 일부 액션 -> my-travel-mcp 호출
```

## 관광지 상세 보강 정책

관광지 설명은 앱 실행 중 즉시 MCP를 호출하지 않고, 개발 중 보강한 정적 데이터로 제공합니다.

우선순위는 다음과 같습니다.

- 1순위: `my-travel-mcp`의 `get_attraction_wiki` 결과
- 2순위: MCP 응답이 비거나 타임아웃될 경우 공개 요약 소스(Wikipedia summary 등)
- 3순위: 여행앱 톤에 맞춰 작성한 curated fallback 설명

개발 중 보강 스크립트:

```bash
node scripts/enrich-attractions-from-mcp.mjs
```

이 스크립트는 `data/generated/attraction-details.json`에 결과를 저장합니다. 저장된 결과를 검수한 뒤 `lib/swiss-guide-data.ts`의 `cityVisits.spots`에 반영합니다.

## 적용 상태

- 홈 화면은 `fallbackTravelPayload`의 정적 여행가이드 데이터를 사용합니다.
- `fallbackTravelPayload`에는 Stitch에서 도출한 방향에 맞는 `uiConfig`와 `appStructure`가 포함되어 있습니다.
- `lib/stitch-mcp.ts`는 런타임 필수 경로가 아니라, 향후 디자인/콘텐츠 생성 스크립트로 분리할 후보입니다.
- `lib/mcp-actions.ts`의 액션들은 실시간 또는 사용자 트리거 기능에만 제한적으로 사용하는 방향입니다.
- 관광지 상세 시트는 정적 상세 데이터(`detailDescription`, `whyVisit`, `whatToSee`, `tips`, `duration`, `nextStop`)를 우선 표시합니다.

## 다음 작업 후보

- `lib/stitch-mcp.ts`를 `scripts/` 또는 개발 전용 유틸로 이동
- `my-travel-mcp`로 보강한 장소 설명을 정적 JSON/TS 데이터로 저장
- 런타임 MCP 호출 버튼은 "최신 확인" 성격으로 라벨과 사용처 정리
- Stitch 제안에 따라 Daily Plan 화면의 지도 영역을 더 크게 만들기
- Place Detail 화면의 설명 타이포그래피를 매거진형으로 다듬기
