# Sicily & Malta 2026 오프라인 가이드북 원본

작성 기준: 2026-05-12  
대상 여행: `sicily-malta-rome-17d`  
여행 기간: 2026-05-21 ~ 2026-06-08  
데이터 기준: `Sicily 202605.kml`, confirmed transport, Airbnb 숙소 링크, MCP/LLM 보강 정적 데이터

## 목적

이 문서는 앱에 현재 반영된 여행 데이터를 기준으로, 나중에 `swiss202506.pdf`처럼 하나의 오프라인 가이드북 PDF를 만들기 위한 Markdown 원본입니다.

PDF 변환 시 이 파일은 다음 역할을 합니다.

- 항공권, 야간열차, 숙소, 일자별 일정의 단일 원본
- 모바일 앱에 표시되는 정적 데이터와 PDF 데이터의 비교 기준
- 일자별 지도, 관광지 카드, 상세 설명, 이미지 누락 검수 체크리스트
- 추후 `Export PDF` 기능 구현 시 PDF 템플릿의 콘텐츠 소스 초안

## 현재 앱 구현 상태

### 화면 구조

- Home: 대표 여행 카드, 여행 라이브러리, `Overview`, `Daily`, `Accommodations` 이동
- Overview: 전체 루트, 도시 중심 지도, 항공권, 일자별 요약, Accommodations 요약
- Daily: 일자별 상세 화면, 접을 수 있는 도시 이동 지도, 타임라인형 관광지 카드
- Accommodations: 숙소 전용 페이지, 숙소 위치 지도, 주소, 체크인/체크아웃, Airbnb 링크
- Place Detail: 관광지별 상세 설명, 방문 이유, 볼거리, 팁, 지도 링크

### 최근 반영된 핵심 변경

- Day 1은 서울 출발부터 헬싱키 환승, 로마 도착까지 Finnair 항공권만 표시
- 마지막 항공 이동일은 Day 1과 같은 방식으로 Finnair 귀국 항공권만 표시
- Day 2는 로마 짧은 체류 후 `InterCityNotte 1955` 야간열차 카드 표시
- 야간열차는 관광지 카드 대신 `Cuccetta Comfort · 4인 쿠셋` 정보 카드로 구성
- Day 3~6은 Catania 거점 기준으로 이동 시간과 체류 시간을 고려해 재배치
- 관광지 이미지는 런타임 호출이 아니라 `public/travel-photos` 아래 정적 이미지 중심으로 처리
- 관광지 상세 설명은 역사, 배경, 방문 포인트를 포함한 정적 텍스트로 보강
- Accommodations 페이지와 내비게이션 라벨은 `Accommodations`로 통일
- Accommodations 페이지의 중복 이동 버튼은 제거

## 앱 데이터 소스

주요 파일:

- `lib/sicily-guide-data.ts`: 항공권, 야간열차, 숙소, 마스터 타임라인, 일자별 가이드, 관광지 상세 데이터
- `lib/swiss-guide-data.ts`: 공통 타입과 Swiss 여행 데이터
- `components/daily-detail.tsx`: Daily 페이지 표시 구조, 항공권 전용일 처리, 접이식 지도, 타임라인 카드
- `components/trip-stays.tsx`: Accommodations 페이지
- `components/travel-home.tsx`: Home 화면
- `components/trip-overview.tsx`: Overview 화면
- `components/guide-image.tsx`: 정적 이미지 표시 및 `cover/contain` 처리

보조 데이터:

- `data/generated/sicily-day1-3-mcp.json`
- `data/generated/sicily-route-mcp.json`
- `data/generated/local-attraction-mcp.json`

정적 이미지:

- `public/travel-photos/intercity-notte-cuccetta-comfort.webp`
- `public/travel-photos/sicily-day3-6/*`
- `public/travel-photos/sicily-day5/*`
- `public/travel-photos/sicily-day6/*`
- `public/travel-photos/*.jpg`

## 확정 교통 정보

### Finnair Outbound

예약 번호: `ELV9IT`  
총 소요 시간: 18시간 55분  
경유: Helsinki Airport, 환승 1시간 50분

| 구간 | 항공편 | 항공기 | 출발 | 도착 | 소요 |
|---|---|---|---|---|---|
| Seoul Incheon to Helsinki | AY042 | Airbus A350-900 | 05/21 21:50, ICN Terminal 1 | 05/22 05:30, HEL | 13h 40m |
| Helsinki to Rome | AY1761 | Airbus A321 (Sharklets) | 05/22 07:20, HEL | 05/22 09:45, FCO Terminal 1 | 3h 25m |

PDF 표시 원칙:

- Day 1에는 항공권 카드만 표시
- 도시별 일정, 관광지 카드, 도시 지도는 표시하지 않음
- Finnair 로고와 예약 번호를 함께 표시

### InterCityNotte 1955

| 항목 | 내용 |
|---|---|
| 열차명 | InterCityNotte 1955 |
| 운행사 | Trenitalia InterCityNotte |
| 객실 | Cuccetta Comfort · 4인 쿠셋 |
| 출발 | 05/22 20:16 · Roma Termini |
| 도착 | 05/23 07:40 · Catania Centrale |
| 소요 | 11시간 24분 |

PDF 표시 원칙:

- Day 2의 야간 이동 카드로 표시
- Catania는 관광 일정이 아니라 다음날 도착 지점으로만 표시
- 설명은 여행 가이드 톤으로 유지하고, 개발 설명식 문장은 사용하지 않음

야간열차 안내 문구:

4인 쿠셋 객실에서 밤새 이동하는 구간입니다. 침구 세트가 제공되므로 좌석 이동보다 수면과 짐 정리에 초점을 맞추면 됩니다. 객실에는 전원 콘센트와 USB, 독서등, 에어컨, 내부 잠금장치, 수하물 공간이 마련되어 있습니다. 시칠리아행 Intercity는 Messina 해협에서 열차가 선박에 실리는 구간이 포함됩니다. 당일 안내 방송과 승무원 안내를 우선하세요.

실전 메모:

- Roma Termini에는 19:15 전후로 돌아와 전광판, 플랫폼, 객차 번호를 먼저 확인
- 큰 캐리어는 객실 수하물 공간에 정리
- 여권, 휴대폰, 충전기, 물, 세면도구는 작은 가방에 따로 보관
- 객실 입실 후 침구, 콘센트 위치, 내부 잠금장치, 아침 알림 시간을 확인
- 도착 후 필요한 주소, 교통편, 숙소 정보는 탑승 전 오프라인으로 준비

### Malta Flights

| 구간 | 항공편 | 출발 | 도착 | 소요 |
|---|---|---|---|---|
| Catania to Malta | Ryanair FR2930 | 05/27 09:30, Catania Fontanarossa | 05/27 10:20, Malta International | 50m |
| Malta to Catania | Ryanair FR395 | 05/29 20:45, Malta International | 05/29 21:30, Catania Fontanarossa | 45m |

### Finnair Return

예약 번호: `ELV9IT`  
총 소요 시간: 17시간 50분  
경유: Helsinki Airport

| 구간 | 항공편 | 항공기 | 출발 | 도착 | 소요 |
|---|---|---|---|---|---|
| Rome to Helsinki | AY1762 | Airbus A321 (Sharklets) | 06/07 10:30, FCO Terminal 1 | 06/07 14:55, HEL | 3h 25m |
| Helsinki to Seoul | AY041 | Airbus A350-900 | 06/07 17:30, HEL | 06/08 11:20, ICN | 10h 50m |

PDF 표시 원칙:

- 마지막 항공 이동일에는 귀국 항공권 카드만 표시
- 관광지 카드나 도시 일정은 표시하지 않음

## Accommodations

| 순서 | 숙소 | 주소 | 체크인 | 체크아웃 | 링크 |
|---|---|---|---|---|---|
| 1 | Via II Scacchiere Pisano, 87 | Via II Scacchiere Pisano, 87, Zafferana Etnea, Sicilia 95019 | 05/23 | 05/27 | https://www.airbnb.co.kr/rooms/872911152850695471 |
| 2 | 81 Triq Luqa Briffa | 81 Triq Luqa Briffa, Il-Gżira, GZR 1503 | 05/27 | 05/29 | https://www.airbnb.co.kr/rooms/1148009597574815048 |
| 3 | Contrada San Calogero | Contrada San Calogero, Costa Saracena - Castelluccio, Sicilia 96011 | 05/29 | 05/30 | https://www.airbnb.co.kr/rooms/22480501 |
| 4 | Realmonte | Realmonte, Sicily 92010 | 05/30 | 06/01 | https://www.airbnb.co.kr/rooms/1579874644140762578 |
| 5 | Contrada Piano Milano | Contrada Piano Milano, Balestrate, Sicilia 90041 | 06/01 | 06/04 | https://www.airbnb.co.kr/rooms/1134114069912154600 |
| 6 | Via Metauro | Via Metauro, Gioia Tauro, Calabria 89013 | 06/04 | 06/05 | https://www.airbnb.co.kr/rooms/1159892446583624701 |
| 7 | Strada Provinciale 24b | Strada Provinciale 24b, Calvanico, Campania 84080 | 06/05 | 06/06 | https://www.airbnb.co.kr/rooms/1636217964927171988 |
| 8 | Via della Riserva dell'Albaceto, 25 | Via della Riserva dell'Albaceto, 25, La Massimina-Casal Lumbroso, Lazio 00166 | 06/06 | 06/07 | https://www.airbnb.co.kr/rooms/1236695521356531916 |

## 전체 일정 요약

| Day | 날짜 | 이동/거점 | 주요 도시 | 교통 | 숙소 |
|---|---|---|---|---|---|
| 1 | 05/21 Thu | Seoul to Rome via Helsinki | Seoul, Incheon, Helsinki, Rome | Flight | - |
| 2 | 05/22 Fri | Rome / Catania | Rome, Fiumicino, Catania | Train | 야간열차 |
| 3 | 05/23 Sat | Catania / Aci Trezza / Adrano | Catania, Aci Trezza, Adrano | Rental car | Zafferana Etnea |
| 4 | 05/24 Sun | Taormina / Castelmola / Forza d'Agro / Savoca | Taormina, Castelmola, Forza d'Agro, Savoca, Giardini Naxos | Rental car | Zafferana Etnea |
| 5 | 05/25 Mon | Syracuse / Ortigia | Syracuse, Ortigia | Rental car | Zafferana Etnea |
| 6 | 05/26 Tue | Noto / Ragusa / Modica / Pozzallo / Marzamemi | Noto, Ragusa, Modica, Pozzallo, Marzamemi | Rental car | Zafferana Etnea |
| 7 | 05/27 Wed | Catania / Luqa / Gzira / Valletta | Catania, Luqa, Gzira, Valletta, Birgu, Cospicua, Senglea | Flight/Taxi/Ferry | Gżira |
| 8 | 05/28 Thu | Gzira / Cirkewwa / Comino / Gozo | Gzira, Cirkewwa, Comino, Mgarr, Victoria, Xaghra | Taxi/Ferry/Boat | Gżira |
| 9 | 05/29 Fri | Blue Grotto / Marsaxlokk / Mdina / Mosta / Catania | Blue Grotto, Marsaxlokk, Mdina, Mosta, Luqa, Catania | Taxi/Flight | Costa Saracena |
| 10 | 05/30 Sat | Costa Saracena / Villa Romana del Casale / Realmonte / Agrigento | Costa Saracena, Piazza Armerina, Realmonte, Agrigento | Rental car | Realmonte |
| 11 | 05/31 Sun | Realmonte / Agrigento | Realmonte, Agrigento | Rental car | Realmonte |
| 12 | 06/01 Mon | Realmonte / Trapani / Erice / Balestrate | Realmonte, Trapani, Erice, Balestrate | Rental car | Balestrate |
| 13 | 06/02 Tue | Balestrate / Segesta / Scopello | Balestrate, Segesta, Scopello | Rental car | Balestrate |
| 14 | 06/03 Wed | Palermo / Monreale | Palermo, Monreale | Rental car | Balestrate |
| 15 | 06/04 Thu | Cefalu / Messina / Scilla / Gioia Tauro | Balestrate, Cefalu, Messina, Villa San Giovanni, Scilla, Gioia Tauro | Rental car | Gioia Tauro |
| 16 | 06/05 Fri | Gioia Tauro / Tropea / Pizzo / Calvanico | Gioia Tauro, Tropea, Pizzo, Calvanico | Rental car | Calvanico |
| 17 | 06/06 Sat | Calvanico / Salerno / Amalfi / Pompeii / Rome | Calvanico, Salerno, Amalfi, Pompeii, Rome, Fiumicino | Rental car/Ferry | Rome |
| 18 | 06/07 Sun | Rome outbound | Rome, Fiumicino, Helsinki | Flight | - |
| 19 | 06/08 Mon | Seoul arrival | Seoul, Incheon | Flight | - |

## Day 1 - Seoul to Rome via Helsinki

표시 방식: 항공권 전용

구성:

- Finnair 예약 번호 `ELV9IT`
- AY042 Seoul Incheon to Helsinki
- Helsinki 환승 1시간 50분
- AY1761 Helsinki to Rome Fiumicino
- 로마 도착 후 Day 2 일정으로 이어짐

PDF 메모:

- 항공권 형태의 한 페이지 구성
- 여정 지도는 선택 사항
- 관광지 카드와 도시별 타임라인은 제외

## Day 2 - Rome Arrival and Night Train

지역: Rome / Catania  
핵심 흐름: 로마 도착, 짧은 도심 산책, Roma Termini 복귀, 야간열차 탑승

Rome 카드:

- Rome Fiumicino Airport
- Roma Termini
- Colosseum
- Roman Forum
- Piazza Venezia
- Pantheon
- Piazza Navona
- Trevi Fountain
- Spanish Steps
- Monti District
- Roma Termini

야간열차 카드:

- InterCityNotte 1955
- Trenitalia InterCityNotte
- Cuccetta Comfort · 4인 쿠셋
- 05/22 20:16 · Roma Termini 출발
- 05/23 07:40 · Catania Centrale 도착
- 11시간 24분

PDF 메모:

- Rome 도심 일정은 짧은 입국일 산책으로 표현
- 야간열차 이미지는 `public/travel-photos/intercity-notte-cuccetta-comfort.webp` 사용
- Catania Centrale는 다음날 도착 지점으로만 사용

## Day 3 - Catania and Etna

지역: Catania  
거점 숙소: Via II Scacchiere Pisano, 87  
핵심 흐름: Catania 도착 정리, 도심 산책, Aci Trezza 해안, 숙소 체크인, Etna/Adrano 선택 동선

도시별 구성:

- Catania: Catania Centrale, Catania Overview, Piazza del Duomo Catania, Basilica Cattedrale di Sant'Agata, Piazza Universita, La Pescheria, Via Etnea
- Aci Trezza: Aci Trezza, Faraglioni Aci Trezza
- East Sicily accommodation: Via II Scacchiere Pisano, 87
- Mount Etna: 에트나 산, Adrano

PDF 메모:

- 야간열차 도착 직후이므로 오전은 이동과 컨디션 회복 중심
- Catania 도심은 도보권으로 묶고, 오후 이후 차량 이동으로 해안과 숙소를 연결
- Etna는 날씨와 피로도에 따라 선택형으로 표현

## Day 4 - Taormina Viewpoints

지역: Taormina / Savoca  
거점 숙소: Via II Scacchiere Pisano, 87  
핵심 흐름: Taormina 전망, 산악 마을, 영화 촬영지, 해안 마무리

도시별 구성:

- Taormina: Piazza IX Aprile, Teatro Antico di Taormina
- Castelmola / Forza d'Agro / Savoca: Castelmola, Forza d'Agro, Chiesa Madre di Santa Maria Annunziata, Savoca, Chiesa di San Nicolo
- Naxos / Isola Bella: Naxos, Isola Bella

PDF 메모:

- 고저차가 큰 날이므로 도보 구간과 차량 이동 구간을 분명히 나눔
- Taormina는 오전 또는 늦은 오후 빛이 좋고, Isola Bella는 해안 산책 중심
- Castelmola, Forza d'Agro, Savoca는 짧은 체류를 여러 번 나누는 구성

## Day 5 - Syracuse and Ortigia

지역: Syracuse / Ortigia  
거점 숙소: Via II Scacchiere Pisano, 87  
핵심 흐름: Neapolis 고고학 지구, Talete Parking 기준 Ortigia 도보 루프

도시별 구성:

- Syracuse: The Greek Theatre of Syracuse, Ear of Dionysius, Altar of Hieron II, Basilica Santuario Madonna delle Lacrime
- Ortigia: Talete Parking, Mercato di Ortigia / Caseificio Borderi, Piazza Duomo, 시라쿠사 대성당, 산타 루치아 알라 바디아 성당, Fountain of Diana, Archimedes Ortigia Note, Ortigia Jewish Quarter / Synagogue Note, Arethusa Spring, Castello Maniace

PDF 메모:

- Syracuse와 Ortigia는 같은 도시권이지만 성격이 달라 섹션을 분리
- Ortigia는 4인 일행과 짐이 있으면 섬 내부 주차 부담이 크므로, 섬 입구의 Talete Parking을 MyMap 기준점으로 표시
- Mercato di Ortigia는 오전~이른 오후 시장이므로 Neapolis 후 Talete Parking에 세우고 Caseificio Borderi 샌드위치 점심을 먼저 넣는 흐름으로 관리
- Noto는 Day 6 오전 Ragusa 방향 이동 중 들르는 방식이 동선상 더 깔끔하므로 Day 5에서는 제외
- 관광지별 상세 설명은 고대 그리스, 초기 기독교, 바로크 재건, 신화와 도시 기억이 드러나도록 유지

## Day 6 - Southeast Baroque and Fishing Villages

지역: Noto / Ragusa / Modica / Marzamemi  
거점 숙소: Via II Scacchiere Pisano, 87  
핵심 흐름: Noto 오전 바로크 산책, Ragusa와 Modica, 해안 마을, Catania 복귀 준비

도시별 구성:

- Noto: Cattedrale di San Nicolo, Palazzo Ducezio, Chiesa di Montevergine, Chiesa di San Francesco d'Assisi all'Immacolata
- Ragusa / Modica: Ragusa, Cattedrale di San Giovanni Battista, Modica, Duomo di San Giorgio Modica
- Modica food stop: Antica Dolceria Bonajuto
- Pozzallo / Marzamemi: Pozzallo, Marzamemi

PDF 메모:

- 이동량이 큰 날이므로 Noto는 오전 핵심 광장만 짧게 보고, Ragusa, Modica, Pozzallo, Marzamemi를 실제 방문 축으로 유지
- Antica Dolceria Bonajuto는 Modica의 오래된 초콜릿 가게로, 거친 식감의 전통 초콜릿 시식을 4인 일행 이벤트로 넣기 좋음
- Marzamemi와 Pozzallo는 해안 마을 분위기와 이동 휴식 역할
- Catania fallback은 장거리 이동을 줄여야 할 때 쓰는 대안 일정

## Day 7 - Malta Arrival and Valletta

지역: Valletta / Three Cities  
숙소: 81 Triq Luqa Briffa  
주요 장소:

- Malta International Airport
- Gżira
- Sliema-Valletta Ferry
- Valletta
- Upper Barrakka Gardens
- St. John's Co-Cathedral
- Birgu (Vittoriosa)
- Bormla / Cospicua
- Senglea / Gardjola Gardens

PDF 메모:

- Ryanair FR2930: 05/27 09:30 Catania Fontanarossa -> 10:20 Malta International
- Gżira 숙소에 짐을 두고 Valletta 도보 루프를 먼저 구성
- Gżira 숙소 기준으로 버스보다 Sliema-Valletta Ferry를 우선 검토해 Marsamxett Harbour와 발레타 성곽선을 바다에서 보도록 구성
- Upper Barrakka Gardens에서 Grand Harbour와 Three Cities 위치 관계를 먼저 설명
- St. John's Co-Cathedral은 기사단과 바로크 예술의 핵심 설명 블록으로 구성
- Birgu, Bormla/Cospicua, Senglea는 저녁 항구 산책과 전망 중심으로 묶음

## Day 8 - Comino Blue Lagoon and Gozo Heritage

지역: Comino / Gozo  
숙소: 81 Triq Luqa Briffa  
주요 장소:

- Gżira
- Cirkewwa Ferry Terminal
- Blue Lagoon Comino
- Mgarr Harbour Gozo
- Cittadella (Victoria, Gozo)
- Ggantija Archaeological Park
- Gozo Island

PDF 메모:

- MCP 비교 결과: Gozo-first와 Comino-first 두 후보 모두 가능하지만, Blue Lagoon 혼잡도와 방문 시간대 관리를 고려하면 Comino-first가 더 안정적입니다.
- Gżira -> Cirkewwa -> Blue Lagoon Comino -> Mgarr Harbour Gozo -> Cittadella -> Gozo Island Landscape -> Ggantija 순서로 구성합니다.
- 오전 초반은 Comino Blue Lagoon에서 바다색과 석회암 해안 풍경을 먼저 확보합니다.
- 늦은 오전 Mgarr Harbour로 넘어가 점심 이후 Cittadella와 Ggantija로 고조의 중세 방어도시와 선사 거석 유산을 설명합니다.
- 날씨, 바람, 선박 운항 변동성, Blue Lagoon 오전 방문 슬롯/QR 패스 필요 여부, 마지막 귀환편 확인을 주의사항에 포함합니다.

## Day 9 - Mdina, Mosta and Catania Return

지역: Blue Grotto / Marsaxlokk / Mdina / Mosta / Catania  
숙소: Contrada San Calogero  
주요 장소:

- Gżira
- Blue Grotto Malta
- Marsaxlokk
- Ta' Kalbi 또는 Marsaxlokk local market
- Mdina
- Mosta Rotunda
- Malta International Airport
- Catania Fontanarossa Airport
- Contrada San Calogero

PDF 메모:

- 오전~점심은 KML의 Blue Grotto와 Marsaxlokk을 남부 해안 루프로 구성
- Marsaxlokk에서는 일요일 시장이 아니어도 luzzu 보트 배경의 해산물 점심을 넣고, 후보로 Ta' Kalbi 또는 항구 로컬 마켓 주변 식당을 표시
- 오후는 Mdina와 Mosta Rotunda로 몰타 마지막 내륙 루프 구성
- Ryanair FR395: 05/29 20:45 Malta International -> 21:30 Catania Fontanarossa
- 18:45 전후 Malta 공항 도착 기준으로 오후 후반 여유 시간 확보
- Catania 도착 후에는 Contrada San Calogero 숙소 체크인과 다음날 Realmonte 이동 준비 중심

### Day 7~9 PDF 생성용 상세 검수 데이터

검수 기준:

- KML 직접 포함 항목: Malta 폴더의 `블루 라군`, `임디나`, `블루 그로토`, `고조 섬`, `보르믈라`, `마르사실로크`, `비르구`, `셍글레아`와 숙소 폴더의 Gżira 숙소, `Contrada San Calogero` 확인 및 일정 반영 완료.
- docx 직접 포함 항목: Day 7~9 Malta 구간 관광지 메모는 별도 확인되지 않음. 따라서 몰타 주요 관광지는 MCP 경로 산출물(`data/generated/sicily-day7-9-mcp.json`)과 LLM 보강으로 구성.
- 주요 관광지 누락 검수: Valletta, Upper Barrakka Gardens, St. John's Co-Cathedral, Birgu/Vittoriosa, Bormla/Cospicua, Senglea/Gardjola Gardens, Cittadella, Ggantija, Gozo Island, Blue Lagoon, Blue Grotto, Marsaxlokk, Mdina, Mosta Rotunda 반영.
- 이동/체류 검수: Day 7은 항공 도착일이라 Valletta 3~4시간 + Three Cities 2~2.5시간으로 압축. Day 8은 Comino를 먼저 방문해 Blue Lagoon 혼잡을 낮추고, 늦은 오전 Gozo로 넘어가 Cittadella와 Ggantija를 오후 루프로 압축합니다. Day 9는 20:45 항공편 기준 18:45 공항 도착을 목표로 Blue Grotto/Marsaxlokk 남부 해안 루프와 Mdina/Mosta 내륙 루프를 압축.
- 이미지 검수: 앱 정적 이미지 경로 기준 파일 존재 확인 완료. 앱 실행 중 외부 이미지 호출 없이 표시 가능.
- 상세설명 검수: 앱 정적 데이터 기준 Day 7~9 주요 장소 상세설명 400자 이상으로 보강 완료.

#### Day 7 상세 일정

| 시간 | 구간 | 이동/체류 기준 |
| --- | --- | --- |
| 07:00~09:30 | East Sicily 숙소 -> Catania Fontanarossa | 공항 도착 2시간 전 기준 |
| 09:30~10:20 | Ryanair FR2930 CTA -> MLA | 확정 항공편, 50분 |
| 10:20~11:40 | Malta International -> Gżira | 수하물, 택시, 숙소 짐 정리 60~90분 |
| 12:30~16:45 | Valletta | Upper Barrakka, St. John's Co-Cathedral, 중심 골목 |
| 17:10~19:40 | Birgu / Bormla / Senglea | Three Cities 항구 산책, 일몰 전망 |

##### Malta International Airport

- 이미지: `/travel-photos/sicily-day7-9/malta-international-airport.jpg`
- 상세설명: Malta International Airport는 몰타 섬의 관문이자 Day 7과 Day 9 항공 동선의 기준점입니다. 루카 권역에 있어 발레타, 슬리에마, Gzira, Mdina로 이어지는 택시 이동이 비교적 짧고, 짧은 몰타 체류에서는 공항 도착 직후 수하물, 데이터 연결, 택시 승차 위치를 빠르게 정리하는 것이 중요합니다. 이 일정에서는 관광지가 아니라 몰타 여행의 속도를 결정하는 물류 허브로 봅니다. 5/27에는 FR2930편 10:20 도착 후 숙소에 짐을 두고 발레타로 들어가며, 5/29에는 FR395편 20:45 출발 전 여유 있게 돌아오는 기준점입니다. PDF에는 항공편 번호, 출발 2시간 전 도착 기준, 숙소·공항 이동 시간을 함께 넣어야 오프라인에서도 실전성이 살아납니다. 공항에서 바로 관광으로 전환하는 날과 출국 대기일의 성격이 다르다는 점도 구분해둡니다.

##### Gżira

- 이미지: `/travel-photos/sicily-day7-9/valletta-grand-harbour.jpg`
- 상세설명: Gzira는 발레타 북서쪽 Marsamxett Harbour를 마주 보는 숙소 거점입니다. 몰타의 중세 수도나 기사단 도시처럼 강한 랜드마크를 가진 곳은 아니지만, Sliema와 Msida 사이에 있어 택시·페리·버스 동선이 편하고 짧은 체류에서 짐을 두고 움직이기에 안정적입니다. 맞은편 Manoel Island와 발레타 성벽 방향의 항구 풍경이 있어 저녁 산책을 붙이기도 좋습니다. Day 7~9에서는 관광 카드라기보다 몰타 섬 안팎을 오가는 베이스캠프로 두는 것이 정확하며, 발레타, Cirkewwa, Mdina, 공항으로 이동 시간을 판단하는 기준점입니다. PDF에서는 체크인/체크아웃, Airbnb 링크, 짐 보관 여부, 이른 출발 준비 메모를 함께 배치하면 유용합니다. 숙소 거점 설명을 넣어두면 각 관광지의 출발·귀환 시간이 더 현실적으로 읽힙니다.

##### Valletta

- 이미지: `/travel-photos/sicily-day7-9/valletta-grand-harbour.jpg`
- 상세설명: Valletta는 16세기 성 요한 기사단이 오스만 제국의 공격을 막아낸 뒤 세운 성벽 도시이자 오늘날 몰타의 수도입니다. 그랜드 하버와 Marsamxett Harbour 사이의 좁은 반도 위에 계획적으로 조성되어, 직선 도로와 방어 성벽, 교회와 궁전이 촘촘하게 맞물립니다. 도시 전체가 유네스코 세계유산으로 지정된 이유도 단일 랜드마크보다 군사도시, 바로크 수도, 항구 도시의 층위가 압축되어 있기 때문입니다. Day 7에는 공항 도착 후 무리한 장거리 이동 대신 발레타 안에서 Upper Barrakka Gardens, St. John's Co-Cathedral, 중심 골목을 도보로 묶어 몰타의 첫인상을 잡는 구성이 가장 안정적입니다. PDF 설명에는 기사단의 해상 방어, 바로크 도시계획, 항구 전망을 함께 넣어야 발레타가 단순한 구시가지가 아니라 몰타 역사의 핵심 무대라는 점이 살아납니다.

##### Upper Barrakka Gardens

- 이미지: `/travel-photos/sicily-day7-9/upper-barrakka-gardens.jpg`
- 상세설명: Upper Barrakka Gardens는 발레타 동쪽 성벽 위에 조성된 정원 전망대로, 그랜드 하버와 Three Cities를 한눈에 내려다보는 몰타 최고의 도시 전망 지점입니다. 원래는 기사단의 이탈리아계 기사들이 사용하던 사적 휴식 공간에서 출발했고, 지금은 항구와 방어 도시의 구조를 가장 쉽게 읽을 수 있는 공공 정원입니다. 정원 아래 Saluting Battery에서는 전통적인 대포 발사 의식이 열리기도 해, 발레타가 단순한 구시가지가 아니라 해상 방어와 의례의 도시였음을 보여줍니다. Day 7에서는 발레타 산책 초반에 이곳을 먼저 보면 Birgu와 Senglea가 어디에 놓이는지 공간 감각이 잡혀 이후 Three Cities 이동이 훨씬 이해하기 쉽습니다. PDF에서는 전망 사진과 함께 항구, 성벽, Three Cities 위치 관계를 지도 설명처럼 붙이면 좋습니다.

##### St. John's Co-Cathedral

- 이미지: `/travel-photos/sicily-day7-9/st-johns-co-cathedral.jpg`
- 상세설명: St. John's Co-Cathedral은 성 요한 기사단의 수도원 교회로 지어졌고, 몰타 바로크 예술의 밀도가 가장 높은 장소입니다. 외관은 성벽 도시의 절제된 군사 건축처럼 비교적 단정하지만 내부에 들어가면 황금 장식, 대리석 묘판, 측면 예배당이 압도적으로 펼쳐집니다. 기사단 각 언어권이 자신들의 예배당을 장식했기 때문에 이 성당은 종교 공간이면서 동시에 기사단의 국제 정치와 권위를 보여주는 무대였습니다. Caravaggio의 작품으로도 유명하지만, 이 일정에서는 긴 미술관 관람보다 내부 장식이 왜 발레타의 권력과 신앙을 상징하는지 이해하는 것이 핵심입니다. PDF에는 바로크 장식, 기사단 언어권 예배당, 복장 규정, 45~60분 체류 기준을 함께 넣어 관람 우선순위를 명확히 둡니다. 발레타에서 실내 관람 밀도가 가장 높은 장소이므로 운영시간 확인도 같이 적어둡니다.

##### Birgu (Vittoriosa)

- 이미지: `/travel-photos/sicily-day7-9/birgu-waterfront.jpg`
- 상세설명: Birgu, 또는 Vittoriosa는 발레타가 건설되기 전 성 요한 기사단의 핵심 거점이었던 항구 도시입니다. 1565년 몰타 대공성전 당시 방어의 중심지였고, 좁은 골목과 성벽, 항구, Fort St. Angelo가 기사단 시대의 긴장감을 지금도 잘 보여줍니다. 발레타가 계획적으로 지어진 바로크 수도라면 Birgu는 그보다 오래된 항구와 요새의 기억이 살아 있는 도시입니다. Day 7 저녁에는 발레타에서 항구를 건너 짧게 들어가면 그랜드 하버를 반대편에서 바라볼 수 있어, 오전·오후에 본 발레타 풍경이 입체적으로 연결됩니다. 긴 박물관 관람보다 수변 산책, 골목, 요새 외관 중심으로 잡으면 무리 없이 Three Cities의 분위기를 확보할 수 있습니다. PDF에서는 발레타와 비교되는 이전 수도권의 성격을 강조하면 동선의 의미가 분명해집니다.

##### Bormla / Cospicua

- 이미지: `/travel-photos/sicily-day7-9/bormla-cospicua-dock.jpg`
- 상세설명: Bormla, 또는 Cospicua는 Birgu와 Senglea 사이의 내항을 끼고 있는 Three Cities의 한 축입니다. 발레타와 Birgu처럼 여행자에게 바로 떠오르는 대표 랜드마크는 적지만, 그래서 오히려 몰타 항구 도시의 생활감과 방어 도시의 배후 구조를 읽기 좋습니다. 성 요한 기사단과 이후 영국 해군 시기를 거치며 조선, 수리, 항만 기능이 강하게 남았고, Dockyard Creek 주변의 수변과 교회 돔, 석회암 주거지가 그 역사를 차분하게 보여줍니다. Day 7에서는 Birgu와 Senglea 사이를 잇는 짧은 산책 또는 차량 통과 카드로 넣으면 KML의 Three Cities 장소가 모두 보존되고, 발레타를 관광 수도로만 보지 않게 됩니다. 긴 체류보다 20~40분 정도 수변과 골목 분위기를 확인하는 방식이 현실적입니다. PDF에서는 숨은 항구 도시로 표시해, 공식 명소보다 지역 맥락을 보강하는 장소임을 분명히 합니다.

##### Senglea / Gardjola Gardens

- 이미지: `/travel-photos/sicily-day7-9/senglea-gardjola-gardens.jpg`
- 상세설명: Senglea, 또는 Isla는 Three Cities 중 하나로, 발레타와 Birgu 사이의 그랜드 하버를 마주 보는 좁은 반도 위에 자리합니다. 특히 Gardjola Gardens는 눈과 귀 모양의 감시 장식이 있는 전망대로 유명하며, 기사단 도시가 바다를 감시하고 항구를 방어하던 방식을 상징적으로 보여줍니다. 이곳은 대형 명소보다 전망과 위치감이 중요한 장소입니다. 발레타의 Upper Barrakka에서 내려다본 항구를 이번에는 반대편에서 올려다보게 되므로, 하루 안에서 몰타의 방어 지형을 양쪽 시선으로 이해할 수 있습니다. 해질 무렵에는 성벽과 항구의 색이 부드러워 사진과 짧은 휴식 포인트로도 좋습니다. PDF에서는 Birgu와 한 블록으로 묶어 30~45분 체류, 귀환 페리·택시 확인, 일몰 전망 포인트를 함께 적는 구성이 적절합니다.

#### Day 8 상세 일정

| 시간 | 구간 | 이동/체류 기준 |
| --- | --- | --- |
| 07:30~08:25 | Gżira -> Cirkewwa Ferry Terminal | 택시 45~60분, 보트 체크인 |
| 09:30~09:50 | Cirkewwa -> Blue Lagoon Comino | Comino 보트 약 20분, 첫 혼잡 전 진입 |
| 09:50~11:10 | Blue Lagoon Comino | 오전 방문 슬롯/QR 패스 확인, 바다색·석회암 해안 중심 1시간 15분 |
| 11:15~11:35 | Comino -> Mgarr Harbour Gozo | Gozo 연결 보트 약 15~20분 |
| 12:05~13:20 | Cittadella | 성벽 전망과 중심 골목 1~1.25시간 |
| 14:00~14:20 | Gozo Island Landscape | 고조 내부 풍경 짧은 정차 |
| 14:35~15:35 | Ggantija Archaeological Park | 선사 거석 유적 45~60분 |
| 16:30~18:30 | Mgarr Harbour -> Cirkewwa -> Gżira | 귀환 페리/택시, 마지막 귀환편 확인 |

##### Cirkewwa Ferry Terminal

- 이미지: `/travel-photos/sicily-day7-9/mgarr-harbour-gozo.jpg`
- 상세설명: Cirkewwa Ferry Terminal은 몰타 본섬 북서쪽 끝에서 Gozo와 Comino 보트 동선이 갈라지는 기준점입니다. Day 8에서는 Gozo 직행보다 Blue Lagoon 혼잡을 줄이기 위해 Cirkewwa에서 Comino로 먼저 들어간 뒤, 늦은 오전 Mgarr Harbour로 넘어가는 흐름이 더 안정적입니다. 관광 명소 자체라기보다 섬 이동의 성공 여부를 결정하는 물류 지점이므로, Gzira에서 45~60분 이동해 도착하면 보트 체크인, 귀환 시간, Mgarr 연결 가능 여부를 먼저 확인해야 합니다. Comino는 날씨와 대기열 변수, Blue Lagoon 방문 인원 관리 영향을 받을 수 있어 첫 보트를 앞당기는 것이 좋습니다. PDF에서는 이동 박스로 분리해 택시 45~60분, Comino 보트 약 20분, Comino->Mgarr 연결, 귀환편 확인을 명시하는 편이 좋습니다.

##### Mgarr Harbour Gozo

- 이미지: `/travel-photos/sicily-day7-9/mgarr-harbour-gozo.jpg`
- 상세설명: Mgarr Harbour는 고조 섬의 관문 항구입니다. Day 8에서는 Comino Blue Lagoon을 먼저 본 뒤 늦은 오전 이곳으로 들어와 Gozo 역사 루프를 시작하는 분기점입니다. 항구 뒤 언덕과 교회 돔, 바다 위 선박이 고조의 느린 리듬을 만들어 주며, 본섬 몰타나 Comino의 해변 분위기와 달리 더 조용하고 농촌적인 섬의 첫인상을 줍니다. 이 항구에서 바로 Victoria와 Xaghra로 이동해야 Cittadella, Gozo Island Landscape, Ggantija를 오후 안에 볼 수 있으므로 오래 머무르는 장소라기보다 차량·택시·보트 동선을 재정리하는 기준점으로 보는 것이 정확합니다. PDF에서는 Comino에서 Gozo로 넘어온 뒤 Victoria, Xaghra, 귀환 페리를 연결하는 실용 지점으로 설명하면 좋습니다.

##### Cittadella (Victoria, Gozo)

- 이미지: `/travel-photos/sicily-day7-9/cittadella-gozo.jpg`
- 상세설명: Cittadella는 고조 섬 Victoria 중심의 언덕 위 성채로, 섬 전체의 역사와 방어 구조를 가장 잘 보여주는 장소입니다. 고대부터 사람들이 모여 살던 고지였고, 중세와 기사단 시대를 거치며 해적과 외부 침입에 대비하는 피난처 역할을 했습니다. 성벽 위에 오르면 고조의 낮은 구릉, 농경지, 마을, 해안 방향이 넓게 열려 섬이 본섬 몰타와 얼마나 다른 지형과 분위기를 가졌는지 바로 보입니다. 성당과 골목, 복원된 성벽 구간은 오래 머물수록 좋지만, Day 8처럼 Comino까지 이어지는 날에는 1시간 안팎으로 성벽 전망과 중심부만 집중해서 보는 편이 현실적입니다. PDF에서는 중세 피난 성채, 고조 전경, 짧은 체류 기준을 함께 넣어 Blue Lagoon까지 이어지는 하루 동선의 균형을 설명합니다. 고조의 지형을 처음 이해하는 전망 지점이라는 점도 꼭 남겨둡니다.

##### Ggantija Archaeological Park

- 이미지: `/travel-photos/sicily-day7-9/ggantija-temple-gozo.jpg`
- 상세설명: Ggantija Archaeological Park는 고조 섬 Xaghra에 있는 거석 신전 유적으로, 몰타 선사문화의 깊이를 보여주는 핵심 장소입니다. 기원전 3600~3200년 무렵 세워진 것으로 알려져 이집트 피라미드보다도 오래된 축에 속하며, 거대한 석재를 세워 만든 신전 구조가 당시 공동체의 조직력과 의례 문화를 짐작하게 합니다. 이름은 '거인'을 뜻하는 말과 연결되는데, 과거 사람들에게 이 돌들이 인간의 힘으로 세워졌다고 믿기 어려울 만큼 컸기 때문입니다. Day 8에서는 Cittadella와 함께 보면 고조가 단순한 휴양 섬이 아니라 선사 시대부터 이어진 독자적 문화의 섬이라는 점이 분명해집니다. 유적은 야외 노출이 많아 햇빛이 강하면 모자와 물을 준비하세요. PDF에서는 KML에 포함된 명소임을 명확히 표시하고, 체류 45~60분 기준으로 잡으면 Comino 이동과 충돌하지 않습니다.

##### Gozo Island

- 이미지: `/travel-photos/gozo.jpg`
- 상세설명: Gozo Island는 몰타 본섬보다 작고 조용하지만, 선사 유적, 중세 성채, 해안 풍경이 밀도 있게 모인 섬입니다. Day 8에서 이 카드는 특정 건물보다 고조라는 섬의 분위기를 보존하는 보조 카드로, Cittadella와 Ggantija 사이에 짧은 풍경 정차를 두어 낮은 구릉, 마을, 농경지, 염전과 해안 풍경을 함께 기억하도록 돕습니다. 몰타 본섬의 발레타가 기사단의 성벽 수도라면, 고조는 더 느리고 농촌적인 리듬 속에 오래된 신앙과 선사문화가 남은 장소입니다. 일정상 깊은 해안 투어까지 넣기 어렵기 때문에 주요 유적 사이에서 섬 전체의 색과 속도를 가볍게 보는 방식으로 잡는 것이 현실적입니다. PDF에서는 독립 체류지보다 짧은 풍경 스톱으로 배치하고, 시간이 남을 때만 사진 정차를 권장하는 식으로 표현하면 동선이 과해 보이지 않습니다.

##### Blue Lagoon Comino

- 이미지: `/travel-photos/sicily-day7-9/blue-lagoon-comino.jpg`
- 상세설명: Blue Lagoon은 Comino 섬과 Cominotto 사이의 얕은 해역으로, 투명한 청록빛 바다 때문에 몰타 자연 풍경을 대표하는 장소입니다. 역사 유적 중심의 발레타나 고조 일정과 달리 이곳의 핵심은 바다색, 석회암 해안, 보트 접근의 섬 이동 경험입니다. 유명한 만큼 사람이 많고 그늘이 적으며, 최근에는 방문 시간대와 인원 관리까지 중요해졌기 때문에 Day 8에서는 Gozo보다 Comino를 먼저 보는 구성이 더 낫습니다. 오전 초반 Blue Lagoon에 들어가 1시간 15분 안팎으로 바다색과 해안 풍경을 확보한 뒤 Mgarr Harbour로 넘어가면, 오후에는 Cittadella와 Ggantija를 비교적 차분하게 볼 수 있습니다. PDF에서는 수영 명소보다 보트·귀환 시간 관리가 필요한 자연 풍경 카드로 다뤄야 일정이 현실적으로 보입니다.

#### Day 9 상세 일정

| 시간 | 구간 | 이동/체류 기준 |
| --- | --- | --- |
| 09:30~10:10 | Gżira 체크아웃 / Blue Grotto 이동 | 짐 정리 후 차량 이동 25~35분 |
| 10:10~11:10 | Blue Grotto Malta | 전망 또는 보트 체험 45~60분 |
| 11:40~13:15 | Marsaxlokk | 항구 산책과 점심 60~75분 |
| 14:00~15:45 | Mdina | 성벽 도시 도보 1.5~2시간 |
| 16:10~16:45 | Mosta Rotunda | 돔 성당 30~45분 |
| 18:45~20:45 | Malta International Airport | FR395 출발 2시간 전 도착 |
| 20:45~21:30 | Ryanair FR395 MLA -> CTA | 확정 항공편, 45분 |
| 22:15 이후 | Contrada San Calogero | 늦은 체크인, 다음날 이동 준비 |

##### Blue Grotto Malta

- 이미지: `/travel-photos/sicily-day7-9/blue-grotto-malta.jpg`
- 상세설명: Blue Grotto는 몰타 남서 해안의 석회암 절벽과 해식 동굴이 만드는 대표 자연 풍경입니다. 이름처럼 동굴 안쪽에서 바닷빛이 푸르게 반사되는 장면이 유명하지만, 실제 만족도는 날씨, 파도, 보트 운항 여부에 크게 좌우됩니다. 그래서 Day 9에서는 긴 해상 투어가 아니라 아침~점심 전 짧은 전망과 가능하면 보트 체험을 넣는 방식이 현실적입니다. 발레타나 Mdina가 기사단과 중세 도시의 기억을 보여준다면, Blue Grotto는 몰타가 석회암 섬이라는 사실을 몸으로 느끼게 하는 자연 카드입니다. KML에 포함된 장소이므로 빠뜨리지 않고, Marsaxlokk과 묶어 남부 해안 루프로 배치하면 이동이 자연스럽습니다. 보트가 취소되면 전망대와 Wied iz-Zurrieq 주변 짧은 산책으로 대체하고, 오후 Mdina와 밤 항공편을 위해 체류를 45~60분 안에서 관리하는 것이 좋습니다.

##### Marsaxlokk

- 이미지: `/travel-photos/sicily-day7-9/marsaxlokk-harbour.jpg`
- 상세설명: Marsaxlokk은 몰타 남동부의 전통 어항으로, 알록달록한 luzzu 보트와 항구 식당, 해산물 시장 분위기로 기억되는 장소입니다. 이름과 풍경이 주는 인상은 평화롭지만, 이 항구는 지중해 해상 교역과 어업, 현대 몰타의 일상적인 식문화가 이어지는 생활 공간이기도 합니다. Day 9에서는 Blue Grotto를 본 뒤 점심과 짧은 항구 산책으로 넣으면 남부 해안 KML 장소를 현실적으로 포함할 수 있습니다. 발레타의 기사단 도시, 고조의 선사 유적, Mdina의 내륙 성벽 도시와 달리 Marsaxlokk은 몰타 사람들이 바다와 생계를 맺는 방식을 보여줍니다. 오래 머물면 밤 비행 전 일정이 밀리므로 60~75분 안팎으로 점심과 사진을 압축하고, 시장이 크게 열리는 날이 아니어도 항구의 색감과 보트 풍경만으로 충분히 의미가 있습니다. PDF에서는 식사 후보와 주차·복귀 시간을 함께 적어 실전성을 높이면 좋습니다.

##### Mdina

- 이미지: `/travel-photos/sicily-day7-9/mdina-main-gate.jpg`
- 상세설명: Mdina는 몰타 내륙 고지에 자리한 옛 수도로, 'Silent City'라는 별칭처럼 성벽 안쪽의 좁은 골목과 귀족 저택, 성당 광장이 차분하게 이어지는 도시입니다. 발레타가 기사단 이후의 해상 수도라면 Mdina는 더 오래된 중세·아랍·노르만 도시의 기억을 품고 있습니다. 성벽 위에서는 몰타 섬 내륙과 해안 방향이 멀리 내려다보이며, 골목 안에서는 석회암 건물의 색과 문장 장식이 도시의 귀족적 분위기를 만듭니다. Day 9는 밤 비행 전 긴 이동을 피해야 하므로, 오전~오후 초반에 Mdina를 중심으로 잡으면 몰타 마지막 날의 역사적 깊이를 확보하면서도 공항 복귀가 안정적입니다. PDF에서는 발레타와 대비되는 옛 수도, 성벽 도시, 조용한 골목 체류 1.5~2시간 기준을 함께 적으면 마지막 몰타 일정의 의미가 분명해집니다.

##### Mosta Rotunda

- 이미지: `/travel-photos/sicily-day7-9/mosta-rotunda.jpg`
- 상세설명: Mosta Rotunda는 거대한 돔으로 유명한 성당으로, 몰타 중부의 상징적인 종교 건축입니다. 정식 명칭은 Basilica of the Assumption of Our Lady이며, 19세기에 로마 Pantheon에서 영감을 받은 원형 돔 구조로 지어졌습니다. 제2차 세계대전 중 폭탄이 성당 내부로 떨어졌지만 폭발하지 않아 많은 사람이 이를 기적으로 기억하고, 이 이야기는 오늘날에도 Mosta를 설명하는 중요한 지역 서사입니다. Day 9에서는 Mdina와 공항 사이에 짧게 넣기 좋은 위치에 있어, 몰타의 중세 수도와 근현대 신앙 기억을 하루 안에서 연결합니다. 내부까지 오래 보기보다는 돔의 규모, 원형 공간, 전쟁 기억을 중심으로 30~45분 정도 잡으면 충분합니다. PDF에서는 늦은 항공편 전 부담 없는 마지막 문화 카드로 배치하면 좋습니다.

##### Contrada San Calogero

- 이미지: `/travel-photos/sicily-day6/catania-fontanarossa-airport.jpg`
- 상세설명: Contrada San Calogero는 5/29 밤 Catania로 돌아온 뒤 하루를 마무리하는 Costa Saracena - Castelluccio 권역의 숙소 기준점입니다. 이 카드는 관광지라기보다 항공 도착 후 늦은 체크인, 주차, 열쇠 수령, 다음날 Realmonte/Agrigento 방향 이동 준비를 관리하는 실용 정보 카드입니다. 몰타에서 돌아오는 FR395편은 21:30 Catania 도착이라 실제 숙소 도착은 밤 시간이 되기 쉽고, 이때는 새로운 관광을 넣기보다 안전한 이동과 휴식이 중요합니다. 오프라인 가이드북에서는 숙소 주소, Airbnb 링크, 체크인 안내, 다음날 출발 준비를 함께 확인하는 기준점으로 쓰면 좋습니다. PDF에는 관광 설명보다 도착 후 할 일, 주차, 열쇠, 다음날 운전 준비를 체크리스트처럼 넣는 편이 실용적입니다.

## Day 10 - Villa Romana del Casale and Valley of the Temples

지역: Piazza Armerina / Realmonte / Agrigento  
숙소: Realmonte  
이동 구조: Costa Saracena 숙소권역 -> Villa Romana del Casale -> Realmonte 숙소 -> Valley of the Temples  
MCP 참조: `data/generated/sicily-day10-12-mcp.json`

일정 설계:

- 08:15 Costa Saracena 숙소권역 체크아웃, Piazza Armerina 방향 출발
- 10:00~11:30 Villa Romana del Casale, 로마 모자이크 유적 관람
- 13:45 Realmonte 숙소권역 도착, 점심과 체크인/짐 정리
- 14:45~15:35 숙소 휴식, 물과 모자 준비
- 16:00~18:45 Agrigento Archaeological Park, 신전의 계곡과 Kolymbethra Garden 골든아워 관람
- 19:20 Realmonte 숙소 복귀, 저녁과 휴식

##### Villa Romana del Casale

- 이미지: `/travel-photos/sicily-day6/villa-romana-del-casale.jpg`
- 상세설명: Villa Romana del Casale는 Piazza Armerina 인근의 로마 후기 빌라 유적으로, 정교한 바닥 모자이크로 유명합니다. Day 6 남동부 해안 루프에 넣으면 Ragusa, Modica, Marzamemi 동선이 과도하게 흔들리므로, 실제 방문지로 포함한다면 Costa Saracena에서 Realmonte로 이동하는 Day 10 중간 정차가 가장 자연스럽습니다. 내부 모자이크는 짧은 사진 정차보다 75~90분 정도 걸으며 사냥, 신화, 일상 장면을 읽을 때 가치가 살아납니다. 특히 운동복 차림 여성들이 묘사된 이른바 '비키니 여인들' 모자이크는 로마 후기 생활문화와 장식 수준을 동시에 보여주는 대표 장면입니다. 관람이 길어지면 오후 신전의 계곡 시간이 줄어드므로, 출발 시간을 앞당기고 Agrigento 입장 마감 시간을 당일 확인하는 것이 좋습니다.

##### Valley of the Temples

- 이미지: `/travel-photos/sicily-day10-12/valley-of-the-temples.jpg`
- 상세설명: Valley of the Temples는 고대 그리스 도시 아크라가스의 성벽 남쪽 능선을 따라 남은 거대한 성역입니다. 오늘의 Agrigento가 중세 이후 언덕 위 도시로 옮겨간 반면, 이곳에는 기원전 6~5세기 지중해 서부에서 번영했던 그리스 식민 도시의 흔적이 넓게 펼쳐져 있습니다. 이름은 계곡이지만 실제로는 바다를 향한 완만한 능선이라, 걸을수록 신전과 올리브나무, 붉은 흙, 지중해 하늘이 층층이 겹칩니다. Day 10에서는 오전 Villa Romana del Casale 관람과 Realmonte 체크인 이후 오후 늦게 들어가도록 설계했습니다. 한낮의 열기를 피하면 Temple of Concordia와 Heracles 구역의 돌 색이 부드러워지고, 고대 도시의 방어선과 의례 공간이 왜 이 위치에 놓였는지 더 잘 보입니다.

##### Giardino della Kolymbethra

- 이미지: `/travel-photos/sicily-day10-12/valley-of-the-temples.jpg`
- 상세설명: Giardino della Kolymbethra는 신전의 계곡 안쪽에 있는 고대 저수지 터의 정원으로, 거대한 신전 유적 사이에서 잠시 숨을 고르기 좋은 장소입니다. 오렌지나무와 레몬나무, 올리브나무가 이어져 돌과 흙의 유적 풍경에 갑자기 물기와 그늘이 더해지는 느낌을 줍니다. Day 10에는 Concordia와 Heracles 구역을 걷는 중간 휴식 지점으로 넣으면 4인 일행의 체력 관리에도 좋습니다. 시간이 부족하면 긴 관람보다 짧은 산책과 사진 정차로 처리하되, Agrigento를 신전만 있는 장소가 아니라 고대 수리시설과 농업 풍경까지 남은 복합 유산으로 이해하게 해주는 보조 핵심지로 남겨둡니다.

##### Temple of Concordia, Agrigento

- 이미지: `/travel-photos/sicily-day10-12/temple-of-concordia.jpg`
- 상세설명: Temple of Concordia는 신전의 계곡에서 가장 완성도 있게 남은 도리스식 신전으로, Agrigento를 상징하는 장면입니다. 기원전 5세기 중반에 세워진 것으로 보이며, 신전 이름은 후대 라틴어 비문에서 온 관습적 명칭이라 실제 봉헌 대상은 확정되지 않았습니다. 보존 상태가 뛰어난 이유는 고대 말기 이후 기독교 성당으로 전용되며 구조가 계속 사용되었기 때문입니다. 그래서 이 건물은 그리스 신전 하나가 아니라, 이교 성역에서 기독교 공간으로 바뀌고 다시 고고학 유산으로 복원된 시칠리아의 긴 변화를 품고 있습니다. 정면에서 기둥의 비례를 보고, 옆면으로 돌아가 엔타시스와 처마선의 균형을 보면 사진보다 건축 자체의 힘이 잘 느껴집니다.

##### Temple of Heracles, Agrigento

- 이미지: `/travel-photos/sicily-day10-12/temple-of-heracles.jpg`
- 상세설명: Temple of Heracles는 신전의 계곡 안에서도 가장 오래된 축에 속하는 도리스식 신전 유적입니다. 오늘날에는 일부 기둥과 기단이 남아 있어 Temple of Concordia처럼 완전한 형태를 기대하면 작게 느껴질 수 있지만, 오히려 이 파편성이 고대 성역의 시간감을 강하게 보여줍니다. 헤라클레스는 그리스 세계에서 힘과 여정, 경계 통과의 영웅으로 이해되었고, 시칠리아의 식민 도시에서 이런 신앙은 도시의 정체성과 정치적 자신감을 드러내는 방식이었습니다. 이 장소를 보면 Agrigento가 단일한 관광지가 아니라 여러 신전과 묘역, 성벽, 길이 묶인 큰 도시였다는 사실이 더 분명해집니다. Concordia를 본 뒤 Heracles 구역으로 이어가며 완전한 신전과 무너진 신전의 대비를 보는 흐름이 좋습니다.

##### Tomb of Theron

- 이미지: `/travel-photos/sicily-day10-12/tomb-of-theron.jpg`
- 상세설명: Tomb of Theron은 신전의 계곡 안에서 고대 그리스 신전들과 다른 성격을 보여주는 장례 기념 건축입니다. 이름은 Agrigento의 참주 Theron과 연결되어 전해지지만, 실제로는 헬레니즘 또는 로마 시기의 장례 기념물로 보는 해석이 일반적입니다. 이 점이 오히려 중요합니다. 신전의 계곡은 한 시대의 유적만 남은 야외 박물관이 아니라, 그리스 도시의 기억 위에 후대의 장례 문화와 로마적 기념 방식이 겹친 장소이기 때문입니다. 직선적인 신전 기둥들 사이에서 이 묘소를 보면, 신에게 바치는 성역과 인간의 죽음을 기념하는 공간이 같은 풍경 안에서 어떻게 공존했는지 느낄 수 있습니다. DOCX의 Theron 메모를 보존하기 위해 신전의 계곡 산책 중 짧은 정차로 넣었습니다.

## Day 11 - Scala dei Turchi and Agrigento Old Town

지역: Realmonte / Agrigento  
숙소: Realmonte  
이동 구조: Realmonte 숙소 -> Scala dei Turchi -> Agrigento Old Town  
MCP 참조: `data/generated/sicily-day10-12-mcp.json`

일정 설계:

- 09:30~11:30 Scala dei Turchi 전망과 Realmonte 해안 산책
- 11:50~14:50 Realmonte 복귀, 점심과 휴식
- 15:30~18:20 Agrigento Old Town, Via Atenea와 Santa Maria dei Greci 산책
- 18:50 Realmonte 숙소 복귀 또는 Agrigento 저녁 식사

##### Scala dei Turchi

- 이미지: `/travel-photos/sicily-day10-12/scala-dei-turchi.jpg`
- 상세설명: Scala dei Turchi는 Realmonte 해안의 흰 석회질 절벽이 계단처럼 바다로 내려가는 자연 명소입니다. 이름은 과거 지중해 해적과 오스만·북아프리카 세력이 이 해안에 접근했다는 지역 기억에서 유래한 것으로 알려져 있지만, 실제 매력은 역사 이름보다 지질과 빛의 장면에 있습니다. 푸른 바다와 밝은 흰 절벽이 강하게 대비되고, 시간대에 따라 절벽이 차갑게 또는 따뜻하게 변해 사진과 산책 모두 만족도가 큽니다. Day 11은 전날 신전의 계곡을 본 뒤 숙소 Realmonte 기준으로 속도를 낮추는 날이라, 오전이나 해질 무렵에 이곳을 배치했습니다. 절벽 자체는 보존 문제와 안전 통제로 접근 범위가 달라질 수 있으므로, 무리하게 내려가기보다 지정된 전망 지점과 해안 산책 중심으로 보는 편이 좋습니다.

##### Via Atenea, Agrigento

- 이미지: `/travel-photos/sicily-day10-12/via-atenea-agrigento.jpg`
- 상세설명: Via Atenea는 Agrigento 구시가지의 중심 보행축으로, 고대 아크라가스의 유적을 본 뒤 오늘의 도시가 어떻게 살아 있는지 확인하는 길입니다. 신전의 계곡이 그리스 도시의 남쪽 성역을 보여준다면, Via Atenea와 주변 골목은 중세 이후 언덕 위로 옮겨온 Girgenti의 생활 중심을 보여줍니다. 거리 이름은 아테나를 떠올리게 하지만, 실제 경험은 상점, 카페, 교회 외관, 좁은 골목과 전망이 이어지는 도시 산책에 가깝습니다. Day 11에서는 전날 대형 유적을 이미 보았기 때문에, 오전 해안 산책 후 오후 늦게 이 거리를 걸으며 도시의 속도를 낮추도록 설계했습니다. 오래된 석조 건물과 현대 상점이 섞이는 장면은 Agrigento가 유적 공원 밖에서도 계속 이어지는 도시라는 점을 보여줍니다.

##### Santa Maria dei Greci, Agrigento

- 이미지: `/travel-photos/sicily-day10-12/santa-maria-dei-greci.jpg`
- 상세설명: Santa Maria dei Greci는 Agrigento 구시가지 안에서 그리스 성역의 기억이 기독교 건축으로 이어진 방식을 보여주는 중요한 장소입니다. 현재 교회는 중세적 외관을 갖고 있지만, 전승상 고대 아테나 신전 터 위에 세워진 것으로 알려져 있어, 신전의 계곡에서 본 고대 세계가 도시 내부의 종교 공간에도 남아 있음을 느끼게 합니다. 시칠리아에서는 오래된 신전과 성당이 완전히 갈라지지 않고, 기존의 성스러운 장소가 새로운 종교와 공동체의 언어로 다시 사용되는 경우가 많습니다. 이 교회는 바로 그 연속성을 작고 조용하게 보여줍니다. Day 11에서는 Via Atenea 산책 뒤 골목을 따라 올라가며 넣기 좋은 보조 핵심지로 배치했습니다. 규모는 크지 않지만, 고대 아크라가스와 중세 Girgenti, 오늘의 Agrigento가 한 장소에서 겹친다는 점 때문에 의미가 큽니다.

## Day 12 - Western Sicily Transfer

지역: Realmonte / Saline di Trapani / Trapani / Erice / Balestrate  
숙소: Contrada Piano Milano  
이동 구조: Realmonte -> Saline di Trapani e Paceco -> Trapani -> Erice -> Balestrate  
MCP 참조: `data/generated/sicily-day10-12-mcp.json`

일정 설계:

- 09:00 Realmonte 숙소 체크아웃, Trapani 방향 이동
- 11:55~12:20 Saline di Trapani e Paceco, 염전과 풍차 짧은 정차
- 12:30~14:45 Trapani Old Town, 항구 점심과 Torre di Ligny 정차
- 15:35~18:10 Erice 산 위 마을 산책, San Giuliano와 Balio Gardens
- 16:10 전후 Maria Grammatico에서 Genovesi 과자 휴식
- 19:40 Contrada Piano Milano, Balestrate 숙소 체크인

##### Saline di Trapani e Paceco

- 이미지: `/travel-photos/sicily-day10-12/trapani-port.jpg`
- 상세설명: Saline di Trapani e Paceco는 Trapani 외곽의 염전과 옛 풍차가 이어지는 서부 시칠리아 대표 풍경입니다. 소금밭의 낮은 수면과 바람, 풍차 실루엣이 어우러져 항구 도시 Trapani가 단순한 해안 도시가 아니라 소금 생산과 해상 교역의 지형 위에 자리했다는 점을 보여줍니다. 해 질 녘에는 물빛이 분홍빛으로 변해 가장 아름답지만, Day 12는 Realmonte에서 Balestrate로 넘어가는 장거리 이동일이므로 점심 전 짧은 정차 또는 Erice 후 석양 정차 중 하나로 선택합니다. 날씨가 맑으면 Erice와 Balio Gardens에서 내려다보는 서부 해안 풍경과도 자연스럽게 연결됩니다.

##### Trapani Old Town

- 이미지: `/travel-photos/sicily-day10-12/trapani-port.jpg`
- 상세설명: Trapani Old Town은 서부 시칠리아의 바다와 도시 생활이 가장 가까이 붙는 항구 중심부입니다. 도시는 낫처럼 휘어진 해안 지형 위에 자리해 고대부터 항해와 어업, 소금, 서부 방어선의 역할을 맡았고, 가까운 Erice와 Egadi 제도, Marsala 방향을 잇는 관문이었습니다. Day 12는 Realmonte에서 Balestrate 숙소로 넘어가는 긴 이동일이므로, Trapani는 깊은 박물관 관람보다 점심과 항구 산책, 구시가지 방향감 확보 중심으로 설계했습니다. Corso Vittorio Emanuele 주변을 짧게 걷고 항구 쪽으로 빠지면, Palermo나 Agrigento와 다른 서부 항만 도시의 실용적인 리듬이 느껴집니다. 이곳을 먼저 보면 오후에 산 위 Erice로 올라갔을 때, 바다와 평야, 항구가 한눈에 내려다보이는 위치감이 훨씬 선명해집니다.

##### Torre di Ligny, Trapani

- 이미지: `/travel-photos/sicily-day10-12/torre-di-ligny.jpg`
- 상세설명: Torre di Ligny는 Trapani 서쪽 끝, 두 바다가 만나는 듯한 지점에 세워진 해안 방어탑입니다. 17세기 스페인 지배기 방어 체계 속에서 세워졌고, Trapani가 단순한 어항이 아니라 지중해 해상로와 군사적 긴장 속에 놓인 도시였음을 보여줍니다. 낮은 도시 중심을 지나 이 탑까지 가면 항구, 바다, Egadi 제도 방향의 시야가 열려 도시의 지형을 몸으로 이해하기 좋습니다. Day 12에서는 Trapani에 오래 머물 수 없으므로, 구시가지 산책 뒤 30~40분 정도의 짧은 해안 정차로 배치했습니다. 탑 자체보다 끝 지점에 섰을 때의 바람, 수평선, 항구와 방어선의 관계가 핵심입니다. 이후 Erice로 올라가면 같은 서부 해안을 위에서 내려다보게 되므로, 낮은 해안 시점에서 하루의 서부 지형을 먼저 열어주는 역할을 합니다.

##### Erice

- 이미지: `/travel-photos/sicily-day10-12/erice-panorama.jpg`
- 상세설명: Erice는 Trapani 위 Monte Erice 정상부에 자리한 중세 산악 마을입니다. 고대에는 에릭스 산의 비너스 신앙과 연결되는 성지로 알려졌고, 이후 노르만과 중세 도시 구조가 겹치며 좁은 돌길과 성벽, 교회, 전망이 촘촘히 남았습니다. 바다와 항구 옆 Trapani에서 차로 올라가면 기온과 빛, 거리의 재료가 갑자기 달라져 서부 시칠리아가 단순한 해안 지역이 아니라 산과 바다를 함께 가진 지역임을 알게 됩니다. Day 12는 Realmonte에서 Balestrate로 이동하는 날이라 Erice 전체를 깊게 파고들기보다, Porta Trapani 진입, San Giuliano 교회, Balio Gardens 전망을 중심으로 2시간 안팎에 압축했습니다. 특히 날씨가 맑으면 Trapani 염전과 Egadi 제도 방향이 내려다보여, 오전부터 지나온 서부 해안 동선이 하나의 지도처럼 정리됩니다.

##### Maria Grammatico

- 이미지: `/travel-photos/sicily-day10-12/erice-panorama.jpg`
- 상세설명: Maria Grammatico는 Erice에서 전통 과자를 맛보는 대표 정차지입니다. 특히 따뜻한 크림 필링이 들어간 Genovesi는 산 위 마을 산책 중 짧게 넣기 좋은 간식으로, 4인 일행이 하나씩 들고 Balio Gardens 쪽으로 걸으면 동선의 분위기가 부드럽게 살아납니다. 이 장소는 긴 식사보다 15~25분 정도의 달콤한 휴식으로 잡는 편이 좋고, Trapani에서 올라온 뒤 기온이 낮아지는 Erice의 돌길과 잘 어울립니다.

##### Church of San Giuliano, Erice

- 이미지: `/travel-photos/sicily-day10-12/church-san-giuliano-erice.jpg`
- 상세설명: Church of San Giuliano는 Erice 골목 안쪽에서 마을의 종교적 깊이를 조용히 보여주는 교회입니다. Erice는 전망만으로도 충분히 인상적인 곳이지만, San Giuliano 같은 작은 교회를 넣으면 이 마을이 단순한 포토 전망지가 아니라 오래된 신앙과 공동체의 생활이 남은 장소라는 점이 살아납니다. 성 줄리아노 전승은 중세적 기사와 순교, 방어의 이미지와 연결되어 산 위 마을 Erice의 분위기와도 잘 맞습니다. 건물 규모는 압도적이지 않지만, 좁은 골목과 돌벽, 주변의 낮은 주거 건축 사이에 놓인 모습이 Erice의 실제 결을 보여줍니다. Day 12에서는 Porta Trapani에서 중심부를 걷고 Balio Gardens로 가기 전후에 넣는 짧은 문화 정차로 설계했습니다. 큰 랜드마크 사이에서 20~30분 정도만 보아도 마을의 인상이 더 풍성해집니다.

##### Giardini del Balio, Erice

- 이미지: `/travel-photos/sicily-day10-12/giardini-del-balio-erice.jpg`
- 상세설명: Giardini del Balio는 Erice 동쪽 가장자리의 정원과 전망 구역으로, 산 위 마을의 하루를 시야로 마무리하기 좋은 장소입니다. 근처의 Castello di Venere와 Torretta Pepoli가 고대 비너스 신앙, 중세 방어, 19세기 낭만적 복원 감각을 함께 떠올리게 하고, 정원에서는 Trapani 해안과 염전, 서쪽 바다 방향이 넓게 열립니다. Day 12에서는 Erice 골목을 오래 헤매기보다 이 전망 구역을 마지막에 배치해, 오전 Realmonte 출발부터 Trapani 항구, Erice 산정, Balestrate 숙소까지 이어지는 긴 이동을 한눈에 정리하도록 했습니다. 정원 자체는 짧은 산책으로 충분하지만, 날씨가 맑다면 체류 만족도가 매우 높습니다. 구름이 낮으면 전망이 줄어드니 San Giuliano와 골목 산책 비중을 늘리는 대안도 가능합니다.

## Day 13 - Segesta and Scopello Coast

지역: Balestrate / Segesta / Scopello  
숙소: Contrada Piano Milano  
MCP 참조: `data/generated/sicily-day13-15-mcp.json`  
이미지 소스 참조: `data/generated/sicily-day13-15-image-sources.json`  
이동 구조: Balestrate -> Segesta -> Scopello -> Balestrate  

### 일정표

- 08:50 Contrada Piano Milano, Balestrate 숙소 출발
- 09:50~12:15 Segesta Archaeological Park: Doric Temple, Theater
- 12:15~13:10 Scopello 이동
- 13:10~14:00 Scopello 마을 점심/휴식
- 14:05~15:35 Tonnara di Scopello, Faraglioni di Scopello
- 15:45~16:45 Zingaro Nature Reserve 남쪽 입구 전망, Cala Punta Meno 방향 짧은 산책과 첫 해변 물빛 확인
- 17:15~18:10 Balestrate 숙소 복귀

### 관광지 상세

##### Doric Temple of Segesta

- 이미지: `/travel-photos/sicily-day13-15/segesta-temple.jpg`
- 상세설명: Doric Temple of Segesta는 서부 시칠리아에서 가장 인상적인 고대 유적 중 하나입니다. 이 신전은 그리스 도시가 아니라 엘리미아계 도시 Segesta의 성역에 세워졌다는 점이 흥미롭습니다. 도리스식 기둥과 기단은 거의 완전한 외관을 유지하지만, 내부 신실과 지붕은 완성되지 않았거나 후대에 사라진 것으로 보이며, 그래서 완성된 아름다움과 미완의 역사가 동시에 느껴집니다. Agrigento 신전의 계곡을 이미 본 뒤 이곳을 넣으면, 시칠리아의 고대 세계가 그리스 식민 도시만으로 설명되지 않는다는 점이 선명해집니다. Balestrate에서 접근하기 좋고 Scopello 해안으로 이어지는 중간 지점이라 동선 효율도 높습니다.

##### Theater of Segesta

- 이미지: `/travel-photos/sicily-day13-15/segesta-theatre.jpg`
- 상세설명: Theater of Segesta는 신전과 같은 고고학 공원 안에서도 전혀 다른 장면을 보여주는 언덕 위 극장입니다. 반원형 객석이 자연 지형을 따라 놓여 있고, 무대 뒤로는 서부 시칠리아의 구릉과 바다 방향 풍경이 넓게 열립니다. 이곳은 공연장인 동시에 도시 공동체가 자신을 바라보는 방식, 외부 풍경을 문화 공간 안으로 끌어들이는 방식을 보여줍니다. 신전이 고대 Segesta의 종교적·정치적 상징이라면, 극장은 시민적 모임과 공연, 도시의 시야가 만나는 장소입니다. 신전에서 극장까지는 공원 내부 이동 시간이 필요하므로 두 유적을 분리해 체류 시간을 잡습니다.

##### Scopello

- 이미지: `/travel-photos/sicily-day13-15/scopello-village.jpg`
- 상세설명: Scopello는 Castellammare del Golfo와 Zingaro 해안 사이에 놓인 작은 마을로, 거대한 도시보다 서부 시칠리아의 해안 생활과 느린 리듬을 보여주는 곳입니다. 중심부의 Baglio, 낮은 석조 건물, 작은 광장과 카페는 오래 걷는 관광지라기보다 점심과 산책 사이에 호흡을 낮추는 장소에 가깝습니다. Segesta의 고대 유적을 본 뒤 해안으로 장면을 바꾸는 중간 거점으로 적절합니다. Scopello 자체를 오래 보는 것보다 Tonnara di Scopello, Faraglioni, Zingaro 남쪽 입구와 함께 묶을 때 이 지역의 매력이 살아납니다. 성수기에는 주차와 접근 통제가 변수일 수 있으므로 주차 위치와 해안 접근 가능 여부를 먼저 확인합니다.

##### Tonnara di Scopello

- 이미지: `/travel-photos/sicily-day13-15/tonnara-di-scopello.jpg`
- 상세설명: Tonnara di Scopello는 참치잡이 어장과 가공 시설이 남아 있는 해안 유산입니다. 시칠리아의 tonnara는 단순한 어업 시설이 아니라 지중해 참치 이동, 계절 노동, 해안 공동체의 경제가 결합된 복합 공간이었습니다. 지금은 관광과 사진 명소로 더 유명하지만, 건물과 바위, 작은 만을 함께 보면 이곳이 원래 바다를 생계로 삼던 장소였다는 사실이 드러납니다. Scopello 해안을 단순한 전망 사진으로 소비하지 않고 서부 시칠리아의 어업 문화까지 연결하기 위해 포함합니다. Faraglioni가 솟은 바다와 오래된 tonnara 건물의 대비가 강해 체류 만족도가 높지만, 접근은 계절과 운영 상황에 따라 달라질 수 있습니다.

##### Faraglioni di Scopello

- 이미지: `/travel-photos/sicily-day13-15/faraglioni-di-scopello.jpg`
- 상세설명: Faraglioni di Scopello는 Scopello 앞바다에 솟은 바위 기둥들로, 서부 시칠리아 해안 풍경을 대표하는 장면입니다. 같은 바위 해안이라도 Aci Trezza가 동부의 화산·신화적 분위기를 준다면, Scopello의 Faraglioni는 맑은 물빛과 석회암 절벽, 오래된 tonnara 유산이 함께 놓인 해안 풍경입니다. Segesta의 내륙 유적 이후 오후 빛이 좋아지는 시간에 배치해, 여행의 장면을 고대 유적에서 바다로 자연스럽게 전환합니다. 지정 전망 지점, 해안 접근 가능 구역, Tonnara 주변 시야를 조합해 보는 것이 현실적입니다. 성수기에는 주차와 입장 대기가 길어질 수 있습니다.

##### Zingaro Nature Reserve

- 이미지: `/travel-photos/sicily-day13-15/zingaro-reserve.jpg`
- 상세설명: Zingaro Nature Reserve는 Scopello 북쪽에서 San Vito Lo Capo 방향으로 이어지는 해안 자연보호구역입니다. 절벽, 작은 만, 투명한 바다, 지중해 관목 지대가 이어져 서부 시칠리아 해안의 자연성을 가장 잘 보여줍니다. 다만 전체 트레일을 걷기에는 시간이 많이 필요하고 6월 초에도 햇빛과 더위가 강할 수 있어, 이 일정에서는 남쪽 입구 주변의 짧은 전망과 산책 카드로 잡았습니다. 걷기 좋은 신발, 수영복, 수건, 물을 준비하고 시간이 맞으면 Cala Punta Meno 방향 첫 해변까지 짧게 들어가 물빛을 확인합니다. 바람이나 입장 조건이 좋지 않으면 Faraglioni 전망으로 대체합니다.

##### Cala Punta Meno

- 이미지: `/travel-photos/sicily-day13-15/zingaro-reserve.jpg`
- 상세설명: Cala Punta Meno는 Zingaro 남쪽 입구에서 짧게 걸어 들어갈 수 있는 작은 해변 후보로, 투명한 물빛과 거친 해안 지형을 가까이 느끼기 좋은 정차지입니다. 전체 트레일을 걷지 않아도 수영복과 수건을 준비해두면 짧은 물놀이 또는 발 담그기 정도로 서부 해안의 매력을 체감할 수 있습니다. 단, Day 13은 Segesta와 Scopello를 함께 보는 날이므로 체류는 짧게 잡고, 주차와 입장 조건이 좋지 않으면 Tonnara/Faraglioni 쪽 전망으로 대체합니다.

## Day 14 - Palermo and Monreale

지역: Palermo / Monreale  
숙소: Contrada Piano Milano  
MCP 참조: `data/generated/sicily-day13-15-mcp.json`  
이미지 소스 참조: `data/generated/sicily-day13-15-image-sources.json`  
이동 구조: Balestrate -> Palermo -> Monreale -> Balestrate  

### 일정표

- 08:45 Balestrate 숙소 출발
- 10:10~14:35 Palermo Historic Center 도보 루프
- 10:15 Palermo Cathedral
- 11:15 Quattro Canti
- 11:35 Fontana Pretoria
- 12:00 Monastero di Santa Caterina, 전통 디저트와 카놀리 휴식
- 12:35 Mercato Ballaro 점심/시장 산책
- 13:15 Cappella Palatina
- 14:45~15:30 Monreale 이동
- 15:35~17:15 Cattedrale di Monreale, 옥상 테라스 선택 관람
- 17:30~18:35 Balestrate 숙소 복귀

### 관광지 상세

##### Palermo Cathedral

- 이미지: `/travel-photos/sicily-day13-15/palermo-cathedral.jpg`
- 상세설명: Palermo Cathedral은 시칠리아의 수도 Palermo가 여러 문명권의 교차점이었음을 가장 압축적으로 보여주는 건축입니다. 이 자리는 초기 기독교, 이슬람 지배기, 노르만 왕국, 스페인 지배와 바로크 개조가 겹쳐 온 도시의 중심부이며, 외관에는 노르만, 고딕, 카탈루냐, 신고전주의 요소가 함께 보입니다. 단일 양식의 순수함보다 시대가 겹친 복합성이 매력인 성당입니다. Balestrate에서 Palermo로 들어와 구시가지 도보 루프의 기준점으로 두고, Quattro Canti, Fontana Pretoria, Ballaro 시장, Cappella Palatina와 가까운 점을 활용합니다. 내부와 지붕 관람을 모두 넣으면 시간이 늘어나므로 Monreale까지 가는 날에는 핵심만 압축합니다.

##### Quattro Canti

- 이미지: `/travel-photos/sicily-day13-15/quattro-canti-palermo.jpg`
- 상세설명: Quattro Canti는 Palermo 구시가지의 두 축, Via Maqueda와 Corso Vittorio Emanuele가 만나는 바로크 교차점입니다. 공식 명칭은 Piazza Vigliena에 가깝지만, 네 모서리에 계절, 스페인 왕, Palermo의 수호성인을 상징하는 장식이 놓여 있어 네 모퉁이라는 이름으로 더 잘 알려졌습니다. 이곳은 단순한 광장이 아니라 도시가 자신을 질서 있게 재편하고 권력의 상징을 거리의 중심에 배치한 장면입니다. Cathedral에서 시장과 Fontana Pretoria로 이어지는 도보 동선의 방향 전환 지점으로 적합합니다. 오래 머무르는 곳은 아니지만, Palermo의 혼잡한 골목 사이에서 도시 구조가 한순간 정리되는 느낌이 강합니다.

##### Fontana Pretoria

- 이미지: `/travel-photos/sicily-day13-15/fontana-pretoria-palermo.jpg`
- 상세설명: Fontana Pretoria는 Palermo 중심의 대표적인 르네상스 분수로, Quattro Canti에서 아주 가까운 Piazza Pretoria에 있습니다. 원래는 피렌체의 정원 장식으로 제작된 뒤 16세기 Palermo로 옮겨졌고, 대리석 조각과 누드 인물상 때문에 한때 수치의 광장이라는 별칭과도 연결되었습니다. 지금 보면 이 분수는 Palermo가 지중해 항구도시이면서 동시에 유럽 예술과 귀족 문화의 흐름을 받아들인 도시였음을 보여줍니다. 주변의 시청, 교회, 골목과 함께 보면 장식적 아름다움뿐 아니라 도시 권력과 공공 공간의 관계가 보입니다. Cathedral과 Quattro Canti를 본 뒤 Ballaro 시장으로 넘어가기 전 짧게 넣는 밀도 높은 정차지입니다.

##### Monastero di Santa Caterina

- 이미지: `/travel-photos/sicily-day13-15/fontana-pretoria-palermo.jpg`
- 상세설명: Monastero di Santa Caterina는 Fontana Pretoria와 매우 가까운 위치에 있어 Palermo 도보 루프에 자연스럽게 붙는 성당·수도원 정차지입니다. 내부 장식도 아름답지만, 이 일정에서는 전통 방식의 수녀원 과자를 파는 베이커리와 카놀리 휴식 포인트로 특히 유용합니다. Ballaro 시장으로 바로 넘어가기 전 20~30분 정도 들르면 팔레르모의 종교 건축과 디저트 문화가 한 장면으로 연결됩니다. 단, Cappella Palatina 예약 시간이 있다면 디저트 휴식은 짧게 관리하고, 운영 시간은 당일 확인이 필요합니다.

##### Mercato Ballaro

- 이미지: `/travel-photos/sicily-day13-15/ballaro-market-palermo.jpg`
- 상세설명: Mercato Ballaro는 Palermo의 시장 문화와 생활감을 가장 직접적으로 느낄 수 있는 골목입니다. 이 시장은 아랍·노르만 시대부터 이어진 도시의 동쪽 생활권과 연결되어 왔고, 오늘날에도 음식, 향신료, 해산물, 채소, 길거리 음식의 소리와 냄새가 강하게 남아 있습니다. Cathedral이나 Cappella Palatina가 권력과 종교의 Palermo를 보여준다면, Ballaro는 사람들이 실제로 먹고 사고 말하는 도시의 리듬을 보여줍니다. 시장 방문은 오전~점심 전후에 배치해 활기를 확보하고, 점심 후보까지 자연스럽게 연결합니다. 혼잡하고 골목이 좁으므로 가방과 카메라를 조심하고, 45~60분 정도 산책하며 대표 먹거리와 분위기를 보는 구성이 좋습니다.

##### Cappella Palatina

- 이미지: `/travel-photos/sicily-day13-15/cappella-palatina-palermo.jpg`
- 상세설명: Cappella Palatina는 Palazzo dei Normanni 안에 있는 왕실 예배당으로, Palermo에서 가장 농도 높은 문화 혼합의 공간입니다. 12세기 노르만 왕국 시기에 조성되었고, 비잔틴 모자이크, 이슬람 장식 어휘, 라틴 기독교 예배 공간이 한 장소에서 결합됩니다. 황금빛 모자이크와 목조 천장, 작은 공간 안에 담긴 정치적 메시지는 시칠리아가 단순히 여러 세력에게 지배당한 섬이 아니라 서로 다른 장인과 언어, 종교가 공존하며 독특한 왕국 문화를 만든 장소였음을 보여줍니다. Palermo Cathedral과 Monreale 사이에 넣어 노르만 시칠리아의 핵심을 도시 안에서 먼저 보고, 오후 Monreale의 더 큰 모자이크 공간으로 이어지게 합니다.

##### Cattedrale di Monreale

- 이미지: `/travel-photos/sicily-day13-15/monreale-cathedral.jpg`
- 상세설명: Cattedrale di Monreale는 Palermo 외곽 언덕 위 Monreale에 있는 노르만 시대 대성당으로, 시칠리아에서 비잔틴 모자이크의 장엄함을 가장 크게 체감할 수 있는 장소입니다. 12세기 굴리엘모 2세가 세운 이 성당은 노르만 왕권, 라틴 교회, 비잔틴 장인, 이슬람 장식 감각이 결합된 왕국 문화의 결정체입니다. 내부의 황금 모자이크는 성서 장면을 거대한 빛의 표면으로 펼쳐 보이고, 그 규모와 밀도는 Palermo 도심의 Cappella Palatina와 비교해 볼 때 더 강하게 다가옵니다. Palermo 구시가지의 혼잡한 시장과 광장을 본 뒤 오후에 Monreale로 올라가면 도시 생활과 왕실·종교 예술이 대비되고, 높은 위치에서 Palermo 평야를 내려다보는 지형감도 생깁니다. 가능하면 옥상 테라스까지 올라 Palermo 시내와 'Conca d'Oro'라 불리는 주변 풍광을 함께 내려다보는 것을 권장합니다.

## Day 15 - Cefalu and Calabria Transfer

지역: Balestrate / Cefalu / Messina Strait / Scilla / Gioia Tauro  
숙소: Via Metauro, Gioia Tauro  
MCP 참조: `data/generated/sicily-day13-15-mcp.json`  
이미지 소스 참조: `data/generated/sicily-day13-15-image-sources.json`  
이동 구조: Balestrate -> Cefalu -> Messina Ferry Port -> Villa San Giovanni -> Scilla -> Gioia Tauro  

### 일정표

- 08:20 Contrada Piano Milano, Balestrate 체크아웃
- 10:15~12:00 Cefalu Cathedral, Cefalu Old Harbour
- 12:15~14:30 Messina Ferry Port 이동
- 14:30~16:15 Messina 해협 페리 탑승/대기/하선
- 16:30~17:50 Scilla: Chianalea di Scilla, Castello Ruffo
- 17:50~19:00 Chianalea 바다 위 테라스 식당 저녁 또는 간단한 해산물 식사
- 19:45 Via Metauro, Gioia Tauro 숙소 체크인

### 관광지 상세

##### Cefalu Cathedral

- 이미지: `/travel-photos/sicily-day13-15/cefalu-cathedral.jpg`
- 상세설명: Cefalu Cathedral은 시칠리아 북부 해안의 작은 도시 Cefalu를 대표하는 노르만 성당입니다. 12세기 루제로 2세가 세운 것으로 알려져 있으며, 바다와 바위산 La Rocca 사이에 놓인 도시 풍경 속에서 강한 중심축을 만듭니다. Palermo와 Monreale의 노르만 유산을 본 다음 날 이곳을 짧게 넣으면, 같은 노르만 왕국의 건축이 대도시와 해안 소도시에서 어떻게 다르게 느껴지는지 비교할 수 있습니다. 성당 내부의 모자이크와 단단한 외관은 규모 면에서 Monreale보다 작지만, 바다와 골목, 광장과 붙어 있어 훨씬 생활 속에 놓인 인상을 줍니다. Calabria로 북상하는 긴 이동일이라 성당 광장, 외관, 가능하면 짧은 내부 확인으로 압축합니다.

##### Cefalu Old Harbour

- 이미지: `/travel-photos/sicily-day13-15/cefalu-old-harbour.jpg`
- 상세설명: Cefalu Old Harbour는 성당과 골목을 본 뒤 바다 쪽으로 내려와 도시의 방향을 바꾸는 작은 항구 공간입니다. Cefalu는 노르만 성당으로 유명하지만, 실제 매력은 성당 광장, 좁은 골목, 바다와 작은 선착장이 가까이 붙어 있다는 데 있습니다. 옛 항구에 서면 La Rocca와 도시의 낮은 집들, 물가의 배와 방파제가 한 장면에 들어와 북부 시칠리아 해안 도시의 생활감이 살아납니다. 장거리 이동일이므로 깊은 해변 체류보다 30~40분 정도의 짧은 산책과 사진 정차가 적절합니다. 이곳을 넣으면 Cefalu가 단순한 성당 방문지가 아니라 산과 바다 사이에 자리 잡은 실제 해안 마을이라는 인상이 분명해집니다.

##### Chianalea di Scilla

- 이미지: `/travel-photos/sicily-day13-15/chianalea-di-scilla.jpg`
- 상세설명: Chianalea di Scilla는 Calabria의 Scilla 해안 아래쪽에 붙어 있는 오래된 어촌 구역입니다. 집들이 바다와 거의 맞닿아 있고, 좁은 골목과 작은 배, 수면에 비친 건물들이 이어져 남부 이탈리아의 작은 베네치아처럼 불리기도 합니다. 신화적으로 Scilla라는 이름은 오디세우스의 항해를 위협한 괴물 스킬라와 연결되어, Messina 해협 일대의 거센 물살과 해상 전설을 떠올리게 합니다. Messina 해협을 건너 본토에 들어온 뒤 곧장 숙소로 가기보다, 짧게라도 Calabria 해안의 첫인상을 남기기 위해 배치했습니다. 가능하면 바다 바로 위에 테라스를 둔 식당에서 이른 저녁을 먹으면, 장거리 이동일의 피로가 해협 풍경으로 부드럽게 마무리됩니다. 페리 지연이 있으면 식사는 줄이고 산책만 남기는 방식으로 조절합니다.

##### Castello Ruffo Scilla

- 이미지: `/travel-photos/sicily-day13-15/castello-ruffo-scilla.jpg`
- 상세설명: Castello Ruffo di Scilla는 Scilla 해안의 바위 지형 위에 자리해 Messina 해협을 내려다보는 성채입니다. 이 위치는 시칠리아와 이탈리아 본토 사이의 좁은 해협을 감시하기에 유리했고, 해상 교통과 방어의 중요성이 컸던 지역의 역사를 잘 보여줍니다. 성 자체의 형태뿐 아니라 아래 Chianalea, Marina Grande, 건너편 시칠리아 방향을 함께 볼 수 있다는 점이 핵심입니다. 긴 운전과 페리 이동 뒤에 과한 박물관 관람을 넣기보다 전망과 지형 이해 중심의 짧은 정차로 설계했습니다. Scilla 신화와 실제 해협의 전략성이 한 장소에서 겹치므로, 시칠리아 여행이 본토 Calabria로 넘어가는 전환점이라는 느낌도 선명해집니다.

## Day 16 - Calabria Coast to Campania

지역: Gioia Tauro / Tropea / Pizzo / Calvanico  
숙소: Strada Provinciale 24b, Calvanico  
MCP 참조: `data/generated/sicily-day16-19-mcp.json`  
이미지 소스 참조: `data/generated/sicily-day16-19-image-sources.json`  
이동 구조: Via Metauro, Gioia Tauro -> Tropea -> Pizzo -> Strada Provinciale 24b, Calvanico  

### 일정표

- 08:20 Via Metauro, Gioia Tauro 체크아웃
- 09:45~11:20 Tropea Coast: Tropea Old Town, Affaccio del Gazzo, Sanctuary of Santa Maria dell'Isola
- 11:20~12:30 Pizzo 이동
- 12:35~14:20 Pizzo: Chiesa di Piedigrotta, Castello Murat, Piazza della Repubblica 주변 Tartufo di Pizzo 디저트
- 14:30~18:30 Calvanico 방향 장거리 이동
- 18:30 Strada Provinciale 24b, Calvanico 체크인

### 관광지 상세

##### Tropea Old Town

- 이미지: `/travel-photos/sicily-day16-19/tropea-old-town.jpg`
- 상세설명: Tropea Old Town은 Calabria의 Tyrrhenian Sea를 내려다보는 절벽 위에 형성된 해안 구시가지입니다. 낮은 골목과 전망 테라스, 바다 쪽으로 떨어지는 절벽이 가까이 붙어 있어 짧은 체류에도 남부 이탈리아 해안 도시의 인상이 강하게 남습니다. Tropea는 중세 이후 해안 방어와 상업, 종교 생활이 겹친 작은 중심지였고, 주변 해변과 Santa Maria dell'Isola 성지가 함께 도시의 상징을 만듭니다. Day16은 Gioia Tauro에서 Calvanico까지 북상하는 긴 이동일이므로, Tropea에서는 박물관이나 해변 체류보다 구시가지의 방향감, 바다 전망, 골목의 생활감을 압축해서 보는 것이 현실적입니다. 특히 Affaccio del Gazzo 전망대는 Santa Maria dell'Isola를 정면에 가깝게 볼 수 있는 사진 포인트라, 구시가지 산책 중 반드시 찍어둘 만합니다.

##### Sanctuary of Santa Maria dell'Isola, Tropea

- 이미지: `/travel-photos/sicily-day16-19/santa-maria-dell-isola-tropea.jpg`
- 상세설명: Sanctuary of Santa Maria dell'Isola는 Tropea 해안의 바위 언덕 위에 자리한 성지로, 도시를 대표하는 가장 상징적인 실루엣입니다. 현재의 모습은 여러 차례 보수와 재건을 거쳤지만, 바다와 절벽 사이에 고립된 듯 놓인 위치 때문에 오래전부터 항해자와 지역 공동체의 신앙, 해안 풍경의 기억이 겹쳐 왔습니다. 성지까지 오르거나 주변 전망 지점에서 바라보면 Tropea가 왜 단순한 해변 마을이 아니라 절벽 위 도시와 바다 성지가 결합된 장소인지 바로 이해됩니다. Day16에서는 내부 관람보다 위치감과 전망을 중심으로 짧게 보는 편이 좋습니다. 구시가지 골목을 지나 이곳을 보면 Calabria 해안의 종교적 상징과 자연 지형이 한 장면으로 묶이고, 이후 Pizzo로 이어지는 해안 이동의 분위기도 자연스럽게 이어집니다.

##### Chiesa di Piedigrotta, Pizzo

- 이미지: `/travel-photos/sicily-day16-19/chiesa-piedigrotta-pizzo.jpg`
- 상세설명: Chiesa di Piedigrotta는 Pizzo 해안의 바위와 동굴 지형 안에 조성된 독특한 성소입니다. 전승에 따르면 난파에서 살아남은 선원들의 감사와 신앙이 이 장소의 기원과 연결되며, 이후 지역 장인들이 석회암 안쪽을 파고 종교 조각과 예배 공간을 더해 오늘의 분위기를 만들었습니다. 거대한 성당처럼 장엄한 장소는 아니지만, 바다 가까운 동굴, 민간 신앙, 조각적 상상력이 한데 모여 Calabria 해안 문화의 매우 지역적인 얼굴을 보여줍니다. Day16처럼 장거리 이동 중에는 규모가 큰 도시보다 이런 압축적인 장소가 체력 대비 만족도가 높습니다. Pizzo 중심부의 Castello Murat과 함께 보면 하나의 마을 안에서도 바다의 위험과 신앙, 권력과 방어의 기억이 서로 다른 방식으로 남아 있음을 읽을 수 있습니다.

##### Castello Murat, Pizzo

- 이미지: `/travel-photos/sicily-day16-19/castello-murat-pizzo.jpg`
- 상세설명: Castello Murat는 Pizzo 중심부의 해안 성채로, 남부 이탈리아 해안 방어와 나폴레옹 시대의 정치사가 함께 겹치는 장소입니다. 성채의 이름은 나폴레옹의 매제이자 나폴리 왕이었던 Joachim Murat가 1815년 이곳에서 체포되고 처형된 사건과 연결됩니다. 중세와 근세의 해안 방어 시설이었던 건물이 유럽 정치 격변의 마지막 장면까지 품게 된 셈입니다. Pizzo는 작은 마을이지만, 이 성을 보면 Tyrrhenian coast가 단순한 휴양 풍경이 아니라 군사, 왕권, 항해의 긴장 속에 놓였던 공간이라는 점이 분명해집니다. Day16에서는 성 내부를 깊게 파기보다 외관, 성벽, 바다 방향 전망, Murat의 역사적 맥락을 30~45분 안에서 압축해 보는 구성이 좋습니다. Piedigrotta와 묶으면 Pizzo가 신앙과 권력의 기억을 동시에 가진 해안 정차지로 살아납니다.

##### Tartufo di Pizzo / Piazza della Repubblica

- 이미지: `/travel-photos/sicily-day16-19/castello-murat-pizzo.jpg`
- 상세설명: Tartufo di Pizzo는 Calabria를 대표하는 디저트로, 초콜릿과 헤이즐넛 젤라토 안에 초코 시럽이 들어간 진한 아이스크림입니다. Pizzo 중심부 Piazza della Repubblica 주변 카페에서 짧은 점심 후 디저트로 넣으면 Piedigrotta와 Castello Murat 중심의 문화 정차에 지역의 맛이 더해집니다. Calvanico까지 긴 이동이 남아 있으므로 카페 체류는 20~30분 안에서 끊고, 포장이나 빠른 테이블 이용이 가능한 곳을 당일 상황에 맞춰 고릅니다.

## Day 17 - Salerno Ferry, Amalfi, Pompeii and Rome Final Night

지역: Calvanico / Salerno / Amalfi / Pompeii / Rome  
숙소: Via della Riserva dell'Albaceto, 25  
MCP 참조: `data/generated/sicily-day16-19-mcp.json`  
이미지 소스 참조: `data/generated/sicily-day16-19-image-sources.json`  
이동 구조: Strada Provinciale 24b, Calvanico -> Salerno parking/port -> Amalfi ferry -> Salerno -> Pompeii Archaeological Park -> Via della Riserva dell'Albaceto, 25 -> Rome Fiumicino  

### 일정표

- 08:30 Strada Provinciale 24b, Calvanico 체크아웃
- 09:10 Salerno 주차 및 항구 이동
- 09:40 Salerno -> Amalfi 페리 탑승
- 10:15~12:30 Amalfi 중심부와 항구 주변 짧은 산책
- 12:45 Amalfi -> Salerno 페리 탑승
- 13:20 Salerno 복귀, Pompeii 이동
- 14:30~17:30 Pompeii Archaeological Park 3시간 핵심 루프
- 14:30 Pompeii Archaeological Park
- 15:10 Forum of Pompeii
- 16:00 Villa of the Mysteries
- 16:50 Amphitheatre of Pompeii
- 17:25 Lungo Garden 근처 레몬 소르베와 휴식
- 18:00 Rome 최종 숙소 방향 이동
- 20:30~21:00 Via della Riserva dell'Albaceto, 25 체크인
- 저녁: 렌트카 반납 위치, FCO 이동 시간, 수하물 정리

### 관광지 상세

##### Pompeii Archaeological Park

- 이미지: `/travel-photos/sicily-day16-19/pompeii-archaeological-park.jpg`
- 상세설명: Pompeii Archaeological Park는 기원후 79년 Vesuvius 화산 폭발로 순식간에 매몰된 로마 도시의 흔적을 보존한 세계적인 고고학 유적입니다. 이곳의 힘은 거대한 기념물 하나가 아니라 거리, 집, 상점, 목욕장, 신전, 공공광장이 도시 전체의 구조로 남아 있다는 데 있습니다. 벽돌과 돌바닥, 문지방과 벽화의 흔적을 따라 걸으면 고대 로마가 추상적인 제국이 아니라 실제 사람들이 먹고 일하고 제사를 지내고 오락을 즐기던 생활 공간이었다는 사실이 생생해집니다. Day17은 Amalfi를 페리로 먼저 보고 오후에 Pompeii로 들어가는 구성입니다. 관람 시간은 3시간 안팎이므로 Forum, Villa of the Mysteries, Amphitheatre처럼 성격이 다른 지점을 골라 도시의 구조와 생활감을 압축해서 보는 것이 좋습니다. 유적이 넓고 그늘이 적어 4인 일행은 마지막에 Lungo Garden 근처 레몬 소르베 휴식을 넣어 당과 수분을 보충합니다.

##### Amalfi

- 이미지: `https://commons.wikimedia.org/wiki/Special:FilePath/Amalfi%20Coast%20(Positano).jpg?width=1600`
- 상세설명: Amalfi는 로마 복귀 전 Campania 해안의 색을 짧게 확보하는 정차지입니다. 이 날은 다음날 FCO 10:30 출국을 앞두고 Rome 최종 숙소까지 들어가야 하므로, Amalfi Coast 전체 드라이브나 Positano/Ravello 확장보다 Amalfi 중심부와 항구 주변을 2시간 안팎으로 압축하는 구성이 현실적입니다. Salerno에서 페리로 접근하면 바다에서 절벽과 항구 라인을 볼 수 있고, 현지 주차 스트레스를 줄일 수 있습니다. 12:45 복귀 페리를 기준으로 움직여야 오후 Pompeii 3시간 관람과 Rome 이동이 무너지지 않습니다. 그래도 이 짧은 정차를 넣으면 Calabria에서 Campania로 넘어온 뒤 곧장 유적과 고속도로로만 끝나는 느낌을 줄이고, 남부 이탈리아 해안의 마지막 장면을 일정 안에 보존할 수 있습니다.

### 실무 메모

- Salerno Ferry Port는 관광지 상세가 아니라 주차/페리 환승 거점으로만 사용합니다.
- 09:40 Salerno 출발, 10:15 Amalfi 도착, 12:45 Amalfi 출발, 13:20 Salerno 복귀 기준이 Pompeii 오후 3시간 관람과 가장 잘 맞습니다.
- 페리 지연이나 매진 가능성이 있으면 Amalfi 체류를 줄이고 Pompeii 입장 시간을 우선합니다.

##### Forum of Pompeii

- 이미지: `/travel-photos/sicily-day16-19/forum-of-pompeii.jpg`
- 상세설명: Forum of Pompeii는 고대 Pompeii의 정치, 종교, 상업 활동이 모였던 중심 광장입니다. 주변에는 신전, 바실리카, 행정 건물의 흔적이 남아 있고, 북쪽으로 Vesuvius가 보이는 구도 덕분에 이 도시의 운명을 떠올리게 하는 상징성이 큽니다. Forum은 단순한 빈 광장이 아니라 시민들이 모여 소식을 듣고 거래하고 재판과 의례를 치르던 공적 무대였습니다. Pompeii 전체를 다 볼 시간이 없는 Day17에는 Forum을 기준점으로 삼아 도시 구조를 먼저 이해하는 편이 좋습니다. 이곳에서 거리망과 건물 방향을 잡은 뒤 Villa of the Mysteries나 Amphitheatre로 이동하면, 각각의 장소가 흩어진 명소가 아니라 하나의 고대 도시 안에 놓인 기능별 공간이라는 점이 분명해집니다. 사진은 Vesuvius 방향과 기둥열, 넓은 포장면을 함께 잡으면 장소의 의미가 잘 살아납니다.

##### Villa of the Mysteries, Pompeii

- 이미지: `/travel-photos/sicily-day16-19/villa-of-the-mysteries.jpg`
- 상세설명: Villa of the Mysteries는 Pompeii 성벽 바깥쪽에 자리한 대형 주거 유적으로, 특히 Dionysus 의례와 관련된 것으로 해석되는 벽화 연작 때문에 유명합니다. 붉은 배경 위 인물들이 이어지는 방은 고대 로마의 사적 주거 공간이 단순한 생활 공간을 넘어 신앙, 사회적 지위, 예술 취향을 드러내는 무대였음을 보여줍니다. 이 빌라는 도시 중심의 Forum과 달리, 부유한 계층의 교외 생활과 포도주, 의례, 가정 장식 문화까지 상상하게 합니다. Day17 일정에서는 공원 내부 이동 거리가 길어질 수 있어 체력과 시간에 따라 선택적으로 조절해야 하지만, 방문한다면 Pompeii를 '폐허 도시'가 아니라 사람들의 사적 세계와 미술이 남아 있는 장소로 기억하게 만드는 핵심 지점입니다. 벽화 앞에서는 세부 장면보다 방 전체의 색감과 인물 배열을 먼저 보는 것이 좋습니다.

##### Amphitheatre of Pompeii

- 이미지: `/travel-photos/sicily-day16-19/amphitheatre-of-pompeii.jpg`
- 상세설명: Amphitheatre of Pompeii는 현존하는 가장 오래된 로마 원형 경기장 가운데 하나로 꼽히며, Pompeii 동쪽 끝에 자리합니다. Colosseum보다 훨씬 이른 시기의 지방 도시 경기장이라는 점에서 의미가 크고, 검투 경기와 군중 오락이 로마 사회에서 어떤 공공 경험이었는지 보여줍니다. 이곳은 도시 중심의 Forum이나 사적 공간인 Villa of the Mysteries와 달리, 시민들이 한꺼번에 모여 경쟁과 흥분을 공유하던 대중문화의 무대였습니다. Day17에는 Rome까지 이동해야 하므로 공원 전체를 깊게 걷기는 어렵지만, Amphitheatre를 넣으면 Pompeii가 행정과 주거만의 도시가 아니라 여가와 spectacle까지 갖춘 완전한 도시였다는 인상이 살아납니다. 위치가 Forum에서 떨어져 있으므로 체력이 부족하면 외관과 관람석 구조를 짧게 확인하고 이동 시간을 확보하는 방식이 안전합니다.

## Day 18 - Rome Outbound

표시 방식: 귀국 항공권 전용  
MCP 참조: `data/generated/sicily-day16-19-mcp.json`

구성:

- Finnair 예약 번호 `ELV9IT`
- AY1762 Rome Fiumicino to Helsinki
- Helsinki 환승
- AY041 Helsinki to Seoul Incheon

PDF 메모:

- Day 1과 동일한 항공권 전용 레이아웃 사용
- 공항 도착 권장 시간, 터미널, 환승 정보를 우선 표시
- 관광 카드는 추가하지 않고 FCO 출국 기준 정보만 유지

## Day 19 - Seoul Arrival

표시 방식: 도착 요약

구성:

- AY041 Seoul Incheon 도착
- 06/08 11:20, ICN

PDF 메모:

- 실제 귀국 항공권은 Day 18과 연결해 한 장 또는 두 장으로 배치 가능
- Day 19는 도착 확인과 여행 종료 페이지로 간단히 구성

## PDF 변환용 구성 제안

권장 챕터 순서:

1. 표지
2. 전체 루트 요약 지도
3. 항공권과 야간열차
4. Accommodations
5. Day 1~19 일자별 가이드
6. 장소별 상세 설명 부록
7. 오프라인 체크리스트

일자별 페이지 기본 템플릿:

- 날짜, 요일, 지역, 숙소
- 오늘의 이동 요약
- 도시 이동 지도
- 도시별 타임라인
- 장소 카드: 이미지, 체류 시간, 상세 설명, 팁
- 다음 이동: 거리, 소요 시간

PDF에서 특히 필요한 추가 데이터:

- 모든 장소의 실제 지도 좌표
- 각 장소별 정적 이미지 경로
- 각 장소별 400자 이상 상세 설명
- 도시 간 이동 거리와 예상 소요 시간
- 운영시간, 입장권, 휴무 여부는 출발 직전 재검수 필요

## 검수 체크리스트

- Day 1은 Finnair 항공권만 표시되는지
- Day 2 야간열차 카드에서 날짜 표기가 `MM/DD 시간` 형식인지
- Day 2 Catania가 관광 카드로 과도하게 표시되지 않는지
- Day 3~6 지도는 도시 이동만 표시하고, 관광지는 도시 내부 카드에서 확인되는지
- Day 3~6 관광지 이미지가 장소와 정확히 맞는지
- Day 3~6 관광지 상세 설명이 충분히 길고 여행 가이드 톤인지
- Accommodations 6번과 7번 숙소 순서가 올바른지
- Accommodations Airbnb 링크가 모두 들어가 있는지
- 모바일 화면에서 카드와 버튼이 잘리지 않는지
- PDF용 이미지가 외부 런타임 호출 없이 정적으로 접근 가능한지
