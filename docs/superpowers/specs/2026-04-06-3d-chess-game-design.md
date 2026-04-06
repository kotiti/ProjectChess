# ProjectChess — 3D Chess Game with AI (MVP Design)

## Overview

3D 체스 게임. Stockfish AI 대전 + 슬라이더 난이도 조절(1~20). 향후 RPG/로그라이크/전략 확장/멀티플레이어로 확장 예정이므로 데이터 드리븐 + 플러그인 아키텍처로 설계.

**MVP 범위:** 3D 보드 + 완전한 체스 룰 + Stockfish AI 대전 + 난이도 슬라이더. 게임 확장 요소는 아키텍처만 준비하고 구현하지 않음.

## Tech Stack

- **Next.js 15** + React 19 + TypeScript
- **React Three Fiber** + Drei (3D 렌더링)
- **Stockfish WASM** (AI, Web Worker)
- **chess.js** (체스 룰 검증 — 엔진 레이어에서 래핑)
- **Zustand** (상태 관리)
- **Tailwind CSS** (UI)
- **Vercel** (배포)

## Project Structure

```
ProjectChess/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # 메인 메뉴
│   │   └── game/
│   │       └── page.tsx        # 게임 화면
│   ├── engine/                 # 순수 로직 레이어 (React 의존 없음)
│   │   ├── types.ts            # 기물, 보드, 이동 등 핵심 타입
│   │   ├── board.ts            # 보드 상태 관리
│   │   ├── rules.ts            # 체스 룰 엔진 (이동 검증, 체크/메이트)
│   │   ├── pieces.ts           # 기물 정의 (데이터 드리븐)
│   │   └── plugin.ts           # 플러그인 인터페이스 (향후 확장점)
│   ├── ai/                     # AI 레이어
│   │   ├── stockfish-worker.ts # Stockfish WASM Web Worker
│   │   └── ai-controller.ts   # 난이도 슬라이더 → Stockfish 설정 매핑
│   ├── renderer/               # 3D 렌더링 레이어
│   │   ├── Board3D.tsx         # 3D 보드 컴포넌트
│   │   ├── Piece3D.tsx         # 3D 기물 컴포넌트
│   │   ├── Camera.tsx          # 카메라 컨트롤
│   │   └── models/             # 3D 모델 에셋 (GLTF)
│   ├── ui/                     # UI 컴포넌트
│   │   ├── GameHUD.tsx         # 난이도 슬라이더, 타이머, 잡힌 기물
│   │   ├── MoveHistory.tsx     # 이동 기록
│   │   └── MainMenu.tsx        # 메인 메뉴
│   └── store/                  # 상태 관리
│       └── game-store.ts       # Zustand 게임 상태
├── public/
│   └── models/                 # 3D 모델 파일
└── package.json
```

## Architecture: Data-Driven + Plugin Layer

### Core Principle

3개의 독립 레이어로 분리:

1. **Engine** — 순수 게임 로직 (React 의존 없음, 테스트 가능)
2. **Renderer** — 3D 시각화 (엔진 상태를 받아 렌더링만)
3. **AI** — Stockfish 통신 (Web Worker 격리)

레이어 간 통신은 Zustand store를 통해 이루어짐.

### Engine Layer

#### Piece Definitions (Data-Driven)

```typescript
interface PieceDefinition {
  id: string;              // 'pawn', 'rook', ... 향후 커스텀 기물 추가 가능
  display: string;         // 표시 이름
  value: number;           // 기물 가치 (AI 평가용)
  movePatterns: MovePattern[];
  // 향후 확장점:
  // abilities?: Ability[];
  // stats?: { hp: number, attack: number, ... }
}

interface MovePattern {
  direction: [number, number];  // [dx, dy]
  range: number;                // 1 = 한 칸, 8 = 무제한
  type: 'move' | 'capture' | 'both';
  conditions?: string[];        // 'first_move', 'en_passant' 등
}
```

기물의 이동 규칙이 코드가 아닌 데이터. 새 기물 = 새 MovePattern 추가.

#### Rule Engine

```typescript
interface RuleEngine {
  getValidMoves(board: BoardState, position: Position): Move[];
  applyMove(board: BoardState, move: Move): BoardState;  // 불변
  getGameStatus(board: BoardState): GameStatus;
}
```

- `chess.js`를 내부에서 사용하되 직접 노출하지 않고 래핑
- 향후 `PluginRuleEngine`이 기본 엔진을 감싸서 특수 규칙 주입

#### Plugin Interface (MVP에서는 껍데기만)

```typescript
interface GamePlugin {
  id: string;
  onBeforeMove?(board: BoardState, move: Move): Move | null;
  onAfterMove?(board: BoardState, move: Move): BoardState;
  modifyValidMoves?(moves: Move[], board: BoardState): Move[];
}
```

### AI Layer

#### Stockfish Integration

- Stockfish WASM을 Web Worker에서 실행 (메인 스레드 블로킹 없음)
- UCI 프로토콜로 통신

```typescript
interface AIController {
  setDifficulty(level: number): void;  // 1~20
  getBestMove(fen: string): Promise<string>;
  stop(): void;
}
```

#### Difficulty Slider Mapping (1~20)

| Slider | Skill Level | Depth | ~ELO | Feel |
|--------|-------------|-------|------|------|
| 1~4    | 0~3         | 1~3   | 800~1200  | 입문자도 이길 수 있음 |
| 5~8    | 4~7         | 4~7   | 1200~1600 | 캐주얼 플레이어 수준 |
| 9~12   | 8~11        | 8~11  | 1600~2000 | 동호회 고수 |
| 13~16  | 12~15       | 12~15 | 2000~2400 | 유단자 |
| 17~20  | 16~20       | 16~20 | 2400~2800+| 그랜드마스터급 |

`Skill Level`(실수 확률) + `depth`(탐색 깊이) 두 파라미터 조합.

#### Future Extension Point

플러그인으로 커스텀 기물/규칙 추가 시, Stockfish 대신 자체 평가 함수로 전환하는 어댑터 패턴.

### Renderer Layer

#### Scene Structure

```
Scene
├── Lighting (Ambient + Directional + Point)
├── Board3D — 8x8 타일 (밝은/어두운)
│   ├── 타일 하이라이트 (선택, 이동 가능, 마지막 이동)
│   └── 좌표 레이블 (a~h, 1~8)
├── Piece3D × 32 — 기물 3D 모델
│   └── 이동 애니메이션 (위치 보간, 잡기 퇴장)
└── Camera — OrbitControls (회전/줌/패닝)
```

#### 3D Model Strategy

초기: 프로시저럴 생성 (기본 지오메트리 조합). GLTF 모델로 교체 가능하도록 추상화.

#### Interactions

1. 기물 클릭 → 선택 + 이동 가능 칸 표시
2. 이동 가능 칸 클릭 → 슬라이드 애니메이션
3. 잡기 → 페이드아웃/보드 밖 퇴장
4. 카메라 — 드래그 회전, 스크롤 줌, 우클릭 패닝

#### Visual Feedback

- 선택 기물: 글로우
- 이동 가능 칸: 반투명 원형 마커
- 마지막 이동: 출발/도착 칸 하이라이트
- 체크: 킹 붉은 글로우
- 프로모션: 선택 UI 팝업

### State Management (Zustand)

```typescript
interface GameStore {
  board: BoardState;
  turn: 'white' | 'black';
  status: GameStatus;
  moveHistory: Move[];
  playerColor: 'white' | 'black';
  aiLevel: number;           // 1~20
  selectedSquare: Position | null;
  validMoves: Position[];

  selectSquare(pos: Position): void;
  makeMove(move: Move): void;
  undoMove(): void;
  resetGame(): void;
}
```

Store는 UI-엔진 접착제. 게임 로직은 엔진에, store는 상태 전달만.

## UI Layout

### Main Menu

- 타이틀 "ProjectChess"
- AI 대전 시작 버튼
- 난이도 슬라이더 (1~20)
- 색상 선택 (백/흑)

### Game Screen

- 좌측: 3D 보드 (화면의 ~70%)
- 우측 사이드바:
  - 상대 정보 (AI 레벨, 타이머)
  - 잡힌 기물 표시
  - 이동 기록 (PGN 표기)
  - 내 정보 (색상, 타이머)
  - 액션 버튼: 되돌리기, 기권, 새 게임

## Future Extension Roadmap (Not in MVP)

- **RPG:** PieceDefinition에 stats/abilities 필드 추가, GamePlugin으로 능력 처리
- **Roguelike:** 런 시스템, 스테이지 진행, 버프 선택 — GamePlugin으로 보드/규칙 변형
- **Strategy:** 새 기물/특수 타일 — PieceDefinition + MovePattern 추가
- **Multiplayer:** 백엔드 + WebSocket, store에 네트워크 동기화 레이어 추가
