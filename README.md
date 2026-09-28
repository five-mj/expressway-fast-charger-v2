# Expressway Fast Charger Miniapp V2

Route-based lowest-price fast charger miniapp.

## Independent V2 deployment

- V2 website: https://five-mj.github.io/expressway-fast-charger-v2/
- V2 repository: https://github.com/five-mj/expressway-fast-charger-v2
- GitHub Pages publishes the root directory of this repository's `main` branch.

The original V1 website remains at https://five-mj.github.io/expressway-fast-charger-miniapp/.
Keep V2 development and deployment in this repository; do not merge V2 changes
into the original repository to publish them.

V2 includes the mobile full-width and vertical-scrolling fix (`e7737af`).
The original version is preserved in this history as `c02c0e4` and in the
separate V1 repository. Asset paths remain relative to support both URLs.

`VERCEL_PUBLIC_URL_5325.txt` is a historical reference from V1, not the V2 URL.

## 반응형 화면 정책 (2026-09-28)

기준값은 제품 해상도나 기종명이 아닌 브라우저 viewport의 CSS px입니다.
첫 화면의 기준 크기는 375×812, 메인 화면은 375×892입니다.

| 조건 | 동작 |
| --- | --- |
| 모바일 대상이며 너비 < 480px 또는 너비/높이 < 0.6 | 가로를 꽉 채우고 필요한 만큼 세로 스크롤 |
| 모바일 대상이며 너비 ≥ 480px이고 너비/높이 ≥ 0.6 | 각 화면 전체가 높이에 들어오도록 비율 유지, 가로 중앙 정렬, 좌우 배경 허용 |
| 일반 PC의 너비 ≥ 768px | 기존 375px 중앙 배치와 데스크톱 여백 유지 |

- 모바일 대상: 너비가 768px 미만이거나, 주 입력이 `pointer: coarse`이고 `hover: none`인 터치 화면. 펼친 폴드/태블릿이 768px 이상이어도 대응합니다. 기종명을 판별하지 않습니다.
- 높이는 브라우저 UI를 제외한 `window.innerHeight`, 확대에 쓰는 너비는 스크롤바를 제외한 `document.documentElement.clientWidth`입니다. 모드 전환은 스크롤바에 의한 반복 전환을 막기 위해 `innerWidth`를 사용합니다.
- 높이 맞춤 배율 = `min(사용 가능 너비 / 375, max(0.85, 화면 높이 / 디자인 높이))`.
- 가로모드처럼 높이가 부족하면 최소 배율 0.85에서 멈추고 세로 스크롤을 허용합니다. 이는 가독성을 위한 초기 조정값이며 사용자 확대 기능은 제한하지 않습니다.
- 일반 모바일의 가로 채움 모드에서는 기존 동작을 유지합니다. 메인 화면 하단은 그라데이션에서 #0099FF 단색으로 이어집니다.
- 접기/펼치기, 회전, 창 크기 변경 시 재계산합니다. 두 화면의 배율과 문서 높이는 각각 계산하므로 화면 전환 후 빈 스크롤 영역이 남지 않도록 합니다.
- 입력 장치 조건은 기기 종류를 완벽하게 식별하지 않습니다. 터치 노트북이나 연결한 마우스에 따라 분류가 달라질 수 있습니다.

초기 확인 예: 390×844 → 가로 채움, 600×900 → 높이 맞춤,
600×1200 → 가로 채움, 터치 화면 840×900 → 높이 맞춤,
일반 PC 1280×900 → 기존 PC 배치. 실제 폴드 사용성에 따라 480px/0.6/0.85를 조정할 수 있습니다.

구현 위치: `mobile-layout.js`, `styles.preview-5281.css`의 마지막 반응형 규칙.
