# 1R — One Room, Your Way

한국 원룸·오피스텔을 2D·간단한 3D로 배치하고, **정확한 옵션과 표기 규격이 확인된 쿠팡 상품만** 추천하는 로컬 우선 웹앱입니다.

## v1.2: 규격 확인 카탈로그

- 기존 20개 구조 템플릿, 가구 이동·회전·크기 변경, 2D/3D 전환, JSON 저장·복원을 유지합니다.
- A 가구별 추천과 B 조건 검색은 **동일한 검증 카탈로그**만 사용합니다. 쿠팡 전체 검색 결과를 사용자에게 바로 공개하지 않습니다.
- 최대 **200개 구매 옵션**, 상품군별 상한을 검사합니다. 수집 우선순위는 쿠팡 카테고리 베스트/검색 신호이며 **판매순이라는 표현은 사용하지 않습니다**.
- 상품 선택 전 정확한 옵션·가로/깊이/높이, 변경 후 겹침을 미리 확인합니다. 적용 시 방 구조와 다른 물건의 좌표를 바꾸지 않습니다.
- 보유 물건은 구매 목록에서 제외합니다. 실제 상품을 연결한 뒤 치수를 바꾸면 ‘사용자 수정 치수’로 표시하고 해당 상품 가격을 구매 소계에서 제외합니다.
- 동일한 `productId + itemId + vendorItemId`를 확인한 API 응답만 가격·이미지로 사용합니다. 다른 옵션의 대표 가격으로 대체하지 않습니다.
- API 키는 서버에만 저장합니다. 후보 수집·연결 테스트는 별도 관리자 토큰으로 보호합니다.
- `/admin/`에 후보 수집 → 규격 근거 검수 → 승인/재확인/중지 → JSON 공개 내보내기 도구가 있습니다.

**현재 실제 승인 상품: 0개.** 가상의 상품이나 확인하지 않은 치수를 넣지 않았습니다. API 키 설정으로 연결·후보 수집 기능을 시작할 수 있지만 **실제 상품의 옵션/규격 검수는 별도로 필요**합니다. 테스트용 가상 상품은 `tests/fixtures/`에만 있고 프로덕션 카탈로그·빌드에 포함하지 않습니다.

## 로컬 실행 (Node.js 22 이상)

```bash
cp .env.example .env.local
# .env.local에 COUPANG_ACCESS_KEY / COUPANG_SECRET_KEY 입력
npm test
npm run build
npm start
```

기본 주소는 `http://127.0.0.1:4173`, 검수 화면은 `/admin/`입니다. 외부 런타임 패키지가 없어 `npm install`은 필요하지 않습니다. 키가 없어도 기존 배치 기능과 JSON 검수 도구는 작동하며, API 호출은 명확한 설정 안내로 중단됩니다.

로컬 시작 시 관리자 토큰이 없으면 **로컬 전용 임시 토큰**을 터미널에 출력합니다. 그 값을 검수 화면에 입력하세요. 쿠팡 API 키를 검수 화면에 넣지 마세요. 편집 중 초안은 탭 메모리에 있으므로 ‘작업 초안 저장’으로 보관하세요.

소스 변경 후 `npm run build`로 정적 파일을 다시 만들고, 카탈로그/서버 변경 후 서버를 재시작합니다. API를 포함한 v1.2는 단일 HTML 파일 더블클릭 방식이 아니라 HTTP 서버에서 실행해야 합니다.

## Vercel 설정

Framework Preset: **Other**, Node.js **22.x**. 저장소의 `vercel.json`이 빌드 명령 `npm run build`, 정적 출력 `dist`, 서버 함수 `api/commerce.mjs`를 지정합니다.

| 환경변수 | 필요성 |
|---|---|
| `COUPANG_ACCESS_KEY` | 파트너스 API Access Key. 필수 |
| `COUPANG_SECRET_KEY` | 파트너스 API Secret Key. 필수. 클라이언트·GitHub에 절대 입력하지 않음 |
| `CATALOG_ADMIN_TOKEN` | 온라인 후보 수집/연결 테스트를 사용하려면 무작위 **24자 이상**. 쿠팡 키와 별개 |
| `COUPANG_SUB_ID` | 선택. 파트너스에 등록한 채널 ID가 있을 때만 지정 |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | 선택. 여러 인스턴스에서 계정 호출 예산을 공유할 때 사용 |

환경변수를 저장한 뒤 **새로 배포**해야 적용됩니다. 프로젝트에 기존 Build/Output override가 있으면 위 설정과 일치시키세요. 실제 Vercel 배포 및 실계정 API 호출은 별도 확인 대상입니다.

연결 테스트: 로컬 `npm run coupang:check`는 키 존재 여부만 검사합니다. 명시적으로 **실제 검색 요청 1회**를 보내려면 `npm run coupang:check -- --live`를 사용하거나 `/admin/`에서 연결 테스트를 누르세요. 키가 ‘설정됨’과 ‘실제 인증 호출 성공’을 구분해서 표시합니다.

## 첫 실제 상품 공개 순서

1. 최종 승인된 쿠팡 파트너스 계정에서 발급한 키를 서버 환경변수에 등록합니다. 판매자 WING API와 구분하세요.
2. `/admin/`에서 관리자 토큰을 입력합니다. 키워드 검색 또는 공식 문서의 4자리 카테고리 코드로 베스트 후보를 가져옵니다. 모두 **검수 대기**로 들어옵니다.
3. 정확한 옵션 URL(상품/아이템/판매 옵션 ID), 모델·옵션 이름, 조립 후 외곽 치수, 제조사/판매자 근거 URL·확인일, 검수자, 판매 가능 상태를 확인하고 기록합니다.
4. ‘규격 검수 승인’을 누릅니다. ㄱ자 책상은 주 상판 깊이·날개 폭·좌우형이 추가로 필요합니다. 박스 수납 여부를 확인하려면 외곽과 별개로 내부 유효 칸 치수를 기록합니다.
5. ‘검수한 카탈로그 내보내기’로 `catalog.json`을 저장한 뒤 다음을 실행합니다.

```bash
npm run catalog:import -- /path/to/catalog.json
npm run catalog:check
npm test
npm run build
git add data/catalog.json
git commit -m "data: publish reviewed furniture options"
git push origin main
```

**검수 화면은 서버 파일이나 GitHub를 자동 수정하지 않습니다.** 런타임 DB·관리자 PAT·유료 서비스 없이 시작하기 위해 카탈로그를 코드 파일로 배포합니다. 버전 관리되는 검수 결과를 공개 원본으로 쓰며, 수정하면 다시 배포합니다. API 키만으로 가구 규격이 자동 확보되는 것처럼 동작하지 않습니다.

## 공개 승인 조건

제조사/판매자 **조립 후 표기 규격**을 확인한 옵션만 사용합니다. 직접 실측하거나 실제 형상을 정밀 검증했다는 의미는 아닙니다.

- `data/catalog.json` schemaVersion 1, 최대 200개 옵션.
- 정확한 `productId`, `itemId`, `vendorItemId`, 정규 쿠팡 옵션 URL이 일치해야 합니다.
- 포장 규격은 거부하며 가로·깊이·높이를 cm로 통일합니다.
- 검수 상태 `verified`, 옵션·치수 확인 체크, 검수자/일자/규격 출처가 필요합니다.
- 내부 운영 기준: 규격/출처 확인 90일, 판매 상태 확인 7일을 넘기면 추천에서 제외합니다. 이는 쿠팡의 API 캐시 규정이 아닙니다.
- `pending`, `needs_review`, `retired`, 품절/판매 상태 미확인 옵션은 양쪽 추천·검색 모두 제외합니다. 기존 배치에서는 해당 가구를 삭제하지 않습니다.
- 같은 옵션을 다른 ID로 중복 등록할 수 없습니다. 인기 신호보다 공간 조건을 먼저 적용합니다.
- 정책과 치수 적합성 검사는 `shared/catalog.mjs`를 서버/브라우저가 공유합니다.

상품군 상한: 책상/테이블 35, 수납 45, 의류 수납 25, 공간분리 25, 침대/좌석 35, 소품 35. 후보 검색 계획은 `data/sourcing-plan.json`에 있습니다. 200개는 채워야 할 목표가 아닌 상한입니다.

## API 및 비용 방어

모든 라우트는 `api/commerce.mjs` 한 함수에서 처리합니다.

| 요청 | 동작 | 인증 |
|---|---|---|
| `GET ?action=catalog` | 현재 승인된 옵션만 반환. 외부 호출 없음 | 공개 |
| `GET ?action=status` | 키 설정 여부/검수 개수. 외부 호출 없음 | 공개 |
| `POST ?action=offer` | `{optionId}` → 해당 검수 옵션의 검색어로 검색 후 **정확한 ID 3종 매칭** | 공개 + 요청/호출 예산 제한 |
| `POST ?action=link` | `{optionId}` → 검수된 URL만 딥링크 변환. 반환된 옵션도 다시 검사 | 공개 + 요청/호출 예산 제한 |
| `GET ?action=admin-catalog` | 운영자 원본 카탈로그와 검수 상태 | 관리자 토큰 |
| `POST ?action=admin-candidates` | `{source:'search',keyword}` 또는 `{source:'bestcategories',categoryId}` | 관리자 토큰 |
| `POST ?action=admin-probe` | 실제 인증된 검색 호출 1회 | 관리자 토큰 |
| `POST ?action=admin-validate` | `{catalog}` 검증 | 관리자 토큰 |

- 사용자 드래그, 타이핑, 카탈로그 보기에는 쿠팡 호출이 없습니다. 가격 확인/구매 버튼과 관리자 수집·테스트에서만 호출합니다.
- 서버는 고정된 공식 API 호스트만 호출합니다. URL 임의 프록시·크롤링·비공개 API·자동 옵션 추정은 없습니다.
- Secret Key는 HMAC 서버 서명에만 쓰며 응답·로그에 출력하지 않습니다. 업스트림 원문 오류를 노출하지 않습니다.
- 기본 내부 예산은 검색/베스트 합계 8회/시간, 딥링크 100회/시간. **쿠팡 공식 한도라는 뜻이 아닙니다.** 계정의 실제 제한을 확인한 뒤 환경변수로 조절하세요.
- 기본 제한기는 인스턴스 메모리에 있습니다. 재시작/멀티 인스턴스에서는 계정 전체 제한을 보장하지 않습니다. 운영 규모가 커지면 선택적인 Upstash 공유 카운터와 Vercel 방화벽을 함께 설정하세요. Upstash를 설정한 상태에서 장애가 나면 외부 호출을 차단합니다.
- 403/429에서 자동 재시도하지 않고 해당 인스턴스를 일시 중지합니다. 네트워크 제한시간 기본 7초.
- 쿠팡 가격/이미지 API 응답은 DB·파일·브라우저 저장소에 영속 저장하지 않습니다. 응답은 `no-store`, UI 메모리의 조회 가격은 최대 5분 표시 후 미확인으로 돌아갑니다. 캐시 권한/재사용 조건은 운영 전 최신 파트너스 약관을 별도 확인해야 합니다.
- 구매 소계는 동일 옵션의 최근 확인 가격만 합산하며 배송비와 미확인 가격은 제외합니다. 최종 가격·할인·재고는 쿠팡에서 확인합니다.
- 외부 분석 SDK·자동 cron·유료 DB 의존성은 추가하지 않았습니다. 방 사진/전체 도면은 쿠팡에 보내지 않습니다.

## 테스트와 파일 구성

`npm test`는 규격 승인 게이트, 정확한 옵션 ID 매칭, HMAC, 호출 예산, 인증, 오류/타임아웃 처리, XSS 관련 입력 조건, 겹침/ㄱ자 형상을 검사합니다. 실제 API 키를 쓰지 않는 모의 응답 테스트입니다.

브라우저 테스트는 `tests/browser_acceptance.py`(일반 로컬 HTTP), `tests/browser_offline.py`(브라우저 네트워크 제한 환경용 메모리 컴포넌트 하네스)에 있습니다. 후자는 정확한 소스 JS/CSS를 메모리에 로드하고 API·스토리지만 테스트 대역으로 바꿉니다. 두 도구에는 테스트 전용 가상 상품이 명시되어 있으며 실제 상품으로 배포하지 않습니다.

- `assets/planner.*`: 기존 편집기와 상품 바인딩 연결
- `assets/commerce.*`: 추천/검색/가격/구매 목록/교체 확인 UI
- `admin/`, `assets/admin.*`: 운영자 검수 도구
- `shared/catalog.mjs`: 공통 검수/검색/형상 규칙
- `server/coupang.mjs`: 서버 HMAC·고정 호스트 호출·안전 예산
- `server/commerce.mjs`, `api/commerce.mjs`: 검증 카탈로그 API
- `data/catalog.json`: 검수된 운영 카탈로그 (현재 비어 있음)
- `.env.example`: 키 이름과 운영 설정. 실제 `.env*`는 Git 제외

`src/`가 기존 저장소에 남아 있다면 이전 구현 자료이며, 현재 실행 원본은 루트 `index.html`과 `assets/`입니다. 이 업데이트는 그 자료나 개인 참고 이미지를 삭제/추가하지 않습니다.

## 공식 문서

- 쿠팡 파트너스 API: https://partners.coupang.com/#help/open-api
- Coupang HMAC 서명 형식: https://partner-developers.coupangcorp.com/hc/en-us/articles/360053719371-Create-HMAC-Signature
- Vercel Node.js Functions: https://vercel.com/docs/functions/runtimes/node-js
- Vercel 환경변수/재배포: https://vercel.com/docs/environment-variables/managing-environment-variables

실제 키로의 승인·응답 스키마·카테고리 코드·광고 표시 및 데이터 재사용 조건은 출시 전 현재 계정의 공식 문서에서 최종 확인하세요. 문서상 제공되지 않는 판매량·자동 치수·실사 3D 모델을 제공한다고 가정하지 않습니다.
