# 3D Chess Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 3D chess game with Stockfish AI (difficulty slider 1-20), data-driven piece definitions, and plugin-ready architecture.

**Architecture:** Three independent layers — Engine (pure logic, no React), Renderer (React Three Fiber), AI (Stockfish WASM in Web Worker). Zustand store bridges them. Data-driven piece definitions and plugin interfaces enable future RPG/roguelike/strategy extensions.

**Tech Stack:** Next.js 15, React 19, TypeScript, React Three Fiber + Drei, chess.js, Stockfish WASM, Zustand, Tailwind CSS

---

## File Map

### New Files

| File | Responsibility |
|------|---------------|
| `src/engine/types.ts` | Core types: Position, Move, BoardState, PieceDefinition, MovePattern, GameStatus |
| `src/engine/pieces.ts` | Data-driven piece definitions for all 6 standard chess pieces |
| `src/engine/rules.ts` | Rule engine wrapping chess.js — move validation, apply, game status |
| `src/engine/plugin.ts` | Plugin interface (shell only for MVP) |
| `src/ai/ai-controller.ts` | Stockfish Web Worker wrapper — difficulty mapping, getBestMove |
| `src/store/game-store.ts` | Zustand store — game state, actions (select, move, undo, reset) |
| `src/renderer/Scene.tsx` | Canvas + lighting + environment + OrbitControls |
| `src/renderer/Board3D.tsx` | 8x8 board tiles + highlights + coordinate labels |
| `src/renderer/Piece3D.tsx` | Procedural 3D piece geometry (6 piece types) |
| `src/renderer/Highlights.tsx` | Valid move markers, last move highlight, check glow |
| `src/ui/GameHUD.tsx` | Sidebar — player info, captured pieces, action buttons |
| `src/ui/MoveHistory.tsx` | Move history list in algebraic notation |
| `src/ui/MainMenu.tsx` | Main menu — difficulty slider, color select, start button |
| `src/ui/PromotionDialog.tsx` | Pawn promotion piece selection overlay |
| `src/app/page.tsx` | Main menu page (overwrite default) |
| `src/app/game/page.tsx` | Game page — 3D board + sidebar |
| `src/app/layout.tsx` | Root layout (modify existing) |
| `__tests__/engine/rules.test.ts` | Rule engine tests |
| `__tests__/engine/pieces.test.ts` | Piece definition tests |
| `__tests__/store/game-store.test.ts` | Store action tests |
| `__tests__/ai/ai-controller.test.ts` | AI difficulty mapping tests |
| `public/stockfish/` | Stockfish WASM + JS files (copied from npm) |
| `scripts/copy-stockfish.mjs` | Postinstall script to copy Stockfish files |

### Modified Files

| File | Change |
|------|--------|
| `next.config.ts` | Add `transpilePackages: ['three']` |
| `package.json` | Add postinstall script |

---

## Task 1: Project Scaffolding

**Files:**
- Create: `next.config.ts`, `vitest.config.ts`, `scripts/copy-stockfish.mjs`, `tsconfig.json` (modified by create-next-app)
- Modify: `package.json`

- [ ] **Step 1: Initialize Next.js project**

Run from `D:/Project/ProjectChess`:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --yes
```

Note: This will use the existing directory. If it asks to overwrite README.md, say yes.

- [ ] **Step 2: Install dependencies**

```bash
npm install three @react-three/fiber @react-three/drei @react-spring/three chess.js zustand stockfish
npm install -D @types/three vitest @testing-library/react jsdom
```

- [ ] **Step 3: Configure Next.js for Three.js**

Replace `next.config.ts`:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['three'],
};

export default nextConfig;
```

- [ ] **Step 4: Create Vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 5: Create Stockfish copy script**

Create `scripts/copy-stockfish.mjs`:

```javascript
import { cpSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dest = join(root, 'public', 'stockfish');
const src = join(root, 'node_modules', 'stockfish', 'src');

mkdirSync(dest, { recursive: true });

// Find the single-threaded NNUE lite files
const files = readdirSync(src);
const jsFile = files.find(f => /stockfish.*single.*\.js$/.test(f)) || files.find(f => f.endsWith('.js') && !f.includes('multi'));
const wasmFile = files.find(f => /stockfish.*single.*\.wasm$/.test(f)) || files.find(f => f.endsWith('.wasm') && !f.includes('multi'));

if (jsFile) {
  cpSync(join(src, jsFile), join(dest, 'stockfish.js'));
  console.log(`Copied ${jsFile} -> public/stockfish/stockfish.js`);
}
if (wasmFile) {
  cpSync(join(src, wasmFile), join(dest, 'stockfish.wasm'));
  console.log(`Copied ${wasmFile} -> public/stockfish/stockfish.wasm`);
}

if (!jsFile || !wasmFile) {
  console.warn('Warning: Could not find Stockfish files. Check node_modules/stockfish/src/');
  // List available files for debugging
  console.log('Available files:', files.join(', '));
}
```

- [ ] **Step 6: Add scripts to package.json**

Add to `package.json` scripts:

```json
{
  "scripts": {
    "postinstall": "node scripts/copy-stockfish.mjs",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 7: Run postinstall and verify**

```bash
node scripts/copy-stockfish.mjs
ls public/stockfish/
```

Expected: `stockfish.js` and `stockfish.wasm` present in `public/stockfish/`.

- [ ] **Step 8: Verify dev server starts**

```bash
npm run dev
```

Expected: Next.js dev server starts on `http://localhost:3000` without errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with chess dependencies"
```

---

## Task 2: Engine Core Types

**Files:**
- Create: `src/engine/types.ts`

- [ ] **Step 1: Create core type definitions**

Create `src/engine/types.ts`:

```typescript
// --- Position ---

/** Chess square in algebraic notation: 'a1' through 'h8' */
export type Square = string;

/** Board coordinates: file (0-7 = a-h), rank (0-7 = 1-8) */
export interface Position {
  file: number;
  rank: number;
}

// --- Pieces ---

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

// --- Data-Driven Piece Definitions ---

export interface MovePattern {
  direction: [number, number]; // [dx, dy] relative movement
  range: number;               // 1 = one square, 8 = unlimited (until blocked)
  type: 'move' | 'capture' | 'both';
  conditions?: ('first_move' | 'en_passant')[];
}

export interface PieceDefinition {
  id: PieceType;
  display: string;
  symbol: { w: string; b: string }; // Unicode symbols for UI
  value: number;                     // Material value for AI evaluation
  movePatterns: MovePattern[];
  // Future extension points:
  // abilities?: Ability[];
  // stats?: { hp: number; attack: number; defense: number };
}

// --- Moves ---

export interface Move {
  from: Square;
  to: Square;
  piece: PieceType;
  color: PieceColor;
  captured?: PieceType;
  promotion?: PieceType;
  san: string;             // Standard Algebraic Notation (e.g., 'Nf3')
  flags: string;           // chess.js flags
}

// --- Board State ---

export interface BoardSquare {
  square: Square;
  piece: Piece | null;
}

export type GameStatus =
  | 'playing'
  | 'check'
  | 'checkmate'
  | 'stalemate'
  | 'draw_repetition'
  | 'draw_insufficient'
  | 'draw_fifty_move';

// --- Plugin Interface ---

export interface GamePlugin {
  id: string;
  name: string;
  onBeforeMove?(fen: string, move: Move): Move | null;
  onAfterMove?(fen: string, move: Move): string; // returns new FEN
  modifyValidMoves?(moves: Move[], fen: string): Move[];
}

// --- Utility ---

export function squareToPosition(square: Square): Position {
  return {
    file: square.charCodeAt(0) - 97, // 'a' = 0, 'h' = 7
    rank: parseInt(square[1]) - 1,    // '1' = 0, '8' = 7
  };
}

export function positionToSquare(pos: Position): Square {
  return String.fromCharCode(97 + pos.file) + (pos.rank + 1);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/engine/types.ts
git commit -m "feat: add engine core type definitions"
```

---

## Task 3: Piece Definitions (Data-Driven)

**Files:**
- Create: `src/engine/pieces.ts`, `__tests__/engine/pieces.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/engine/pieces.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { PIECE_DEFINITIONS, getPieceDefinition } from '@/engine/pieces';
import type { PieceType } from '@/engine/types';

describe('Piece Definitions', () => {
  const allTypes: PieceType[] = ['p', 'n', 'b', 'r', 'q', 'k'];

  it('defines all 6 standard chess pieces', () => {
    expect(Object.keys(PIECE_DEFINITIONS)).toHaveLength(6);
    for (const type of allTypes) {
      expect(PIECE_DEFINITIONS[type]).toBeDefined();
    }
  });

  it('each piece has correct value', () => {
    expect(PIECE_DEFINITIONS.p.value).toBe(1);
    expect(PIECE_DEFINITIONS.n.value).toBe(3);
    expect(PIECE_DEFINITIONS.b.value).toBe(3);
    expect(PIECE_DEFINITIONS.r.value).toBe(5);
    expect(PIECE_DEFINITIONS.q.value).toBe(9);
    expect(PIECE_DEFINITIONS.k.value).toBe(0); // king is invaluable
  });

  it('each piece has Unicode symbols for both colors', () => {
    for (const type of allTypes) {
      const def = PIECE_DEFINITIONS[type];
      expect(def.symbol.w).toBeTruthy();
      expect(def.symbol.b).toBeTruthy();
      expect(def.symbol.w).not.toBe(def.symbol.b);
    }
  });

  it('each piece has at least one move pattern', () => {
    for (const type of allTypes) {
      expect(PIECE_DEFINITIONS[type].movePatterns.length).toBeGreaterThan(0);
    }
  });

  it('getPieceDefinition returns correct definition', () => {
    expect(getPieceDefinition('q').display).toBe('Queen');
  });

  it('knight has exactly 8 L-shaped move patterns', () => {
    const knight = PIECE_DEFINITIONS.n;
    const moves = knight.movePatterns.filter(m => m.type === 'both');
    expect(moves).toHaveLength(8);
  });

  it('rook moves in 4 straight directions with unlimited range', () => {
    const rook = PIECE_DEFINITIONS.r;
    const straightMoves = rook.movePatterns.filter(m => m.range === 8);
    expect(straightMoves).toHaveLength(4);
  });

  it('pawn has forward-only move and diagonal-only capture patterns', () => {
    const pawn = PIECE_DEFINITIONS.p;
    const moveOnly = pawn.movePatterns.filter(m => m.type === 'move');
    const captureOnly = pawn.movePatterns.filter(m => m.type === 'capture');
    expect(moveOnly.length).toBeGreaterThan(0);
    expect(captureOnly.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/engine/pieces.test.ts
```

Expected: FAIL — module `@/engine/pieces` not found.

- [ ] **Step 3: Write piece definitions**

Create `src/engine/pieces.ts`:

```typescript
import type { PieceType, PieceDefinition } from './types';

export const PIECE_DEFINITIONS: Record<PieceType, PieceDefinition> = {
  p: {
    id: 'p',
    display: 'Pawn',
    symbol: { w: '\u2659', b: '\u265F' },
    value: 1,
    movePatterns: [
      { direction: [0, 1], range: 1, type: 'move' },
      { direction: [0, 2], range: 1, type: 'move', conditions: ['first_move'] },
      { direction: [-1, 1], range: 1, type: 'capture' },
      { direction: [1, 1], range: 1, type: 'capture' },
      { direction: [-1, 1], range: 1, type: 'capture', conditions: ['en_passant'] },
      { direction: [1, 1], range: 1, type: 'capture', conditions: ['en_passant'] },
    ],
  },
  n: {
    id: 'n',
    display: 'Knight',
    symbol: { w: '\u2658', b: '\u265E' },
    value: 3,
    movePatterns: [
      { direction: [1, 2], range: 1, type: 'both' },
      { direction: [2, 1], range: 1, type: 'both' },
      { direction: [2, -1], range: 1, type: 'both' },
      { direction: [1, -2], range: 1, type: 'both' },
      { direction: [-1, -2], range: 1, type: 'both' },
      { direction: [-2, -1], range: 1, type: 'both' },
      { direction: [-2, 1], range: 1, type: 'both' },
      { direction: [-1, 2], range: 1, type: 'both' },
    ],
  },
  b: {
    id: 'b',
    display: 'Bishop',
    symbol: { w: '\u2657', b: '\u265D' },
    value: 3,
    movePatterns: [
      { direction: [1, 1], range: 8, type: 'both' },
      { direction: [1, -1], range: 8, type: 'both' },
      { direction: [-1, -1], range: 8, type: 'both' },
      { direction: [-1, 1], range: 8, type: 'both' },
    ],
  },
  r: {
    id: 'r',
    display: 'Rook',
    symbol: { w: '\u2656', b: '\u265C' },
    value: 5,
    movePatterns: [
      { direction: [0, 1], range: 8, type: 'both' },
      { direction: [0, -1], range: 8, type: 'both' },
      { direction: [1, 0], range: 8, type: 'both' },
      { direction: [-1, 0], range: 8, type: 'both' },
    ],
  },
  q: {
    id: 'q',
    display: 'Queen',
    symbol: { w: '\u2655', b: '\u265B' },
    value: 9,
    movePatterns: [
      { direction: [0, 1], range: 8, type: 'both' },
      { direction: [0, -1], range: 8, type: 'both' },
      { direction: [1, 0], range: 8, type: 'both' },
      { direction: [-1, 0], range: 8, type: 'both' },
      { direction: [1, 1], range: 8, type: 'both' },
      { direction: [1, -1], range: 8, type: 'both' },
      { direction: [-1, -1], range: 8, type: 'both' },
      { direction: [-1, 1], range: 8, type: 'both' },
    ],
  },
  k: {
    id: 'k',
    display: 'King',
    symbol: { w: '\u2654', b: '\u265A' },
    value: 0,
    movePatterns: [
      { direction: [0, 1], range: 1, type: 'both' },
      { direction: [0, -1], range: 1, type: 'both' },
      { direction: [1, 0], range: 1, type: 'both' },
      { direction: [-1, 0], range: 1, type: 'both' },
      { direction: [1, 1], range: 1, type: 'both' },
      { direction: [1, -1], range: 1, type: 'both' },
      { direction: [-1, -1], range: 1, type: 'both' },
      { direction: [-1, 1], range: 1, type: 'both' },
    ],
  },
};

export function getPieceDefinition(type: PieceType): PieceDefinition {
  return PIECE_DEFINITIONS[type];
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/engine/pieces.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/pieces.ts __tests__/engine/pieces.test.ts
git commit -m "feat: add data-driven piece definitions with tests"
```

---

## Task 4: Rule Engine (chess.js Wrapper)

**Files:**
- Create: `src/engine/rules.ts`, `__tests__/engine/rules.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/engine/rules.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ChessRuleEngine } from '@/engine/rules';

describe('ChessRuleEngine', () => {
  let engine: ChessRuleEngine;

  beforeEach(() => {
    engine = new ChessRuleEngine();
  });

  describe('initial state', () => {
    it('returns starting FEN', () => {
      expect(engine.getFen()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    });

    it('white moves first', () => {
      expect(engine.getTurn()).toBe('w');
    });

    it('game status is playing', () => {
      expect(engine.getGameStatus()).toBe('playing');
    });
  });

  describe('getValidMoves', () => {
    it('returns valid moves for e2 pawn at start', () => {
      const moves = engine.getValidMoves('e2');
      const destinations = moves.map(m => m.to);
      expect(destinations).toContain('e3');
      expect(destinations).toContain('e4');
      expect(destinations).toHaveLength(2);
    });

    it('returns empty array for empty square', () => {
      expect(engine.getValidMoves('e4')).toHaveLength(0);
    });

    it('returns empty array for opponent piece', () => {
      // White to move, asking for black pawn
      expect(engine.getValidMoves('e7')).toHaveLength(0);
    });
  });

  describe('applyMove', () => {
    it('applies a valid move and switches turn', () => {
      const move = engine.applyMove('e2', 'e4');
      expect(move).not.toBeNull();
      expect(move!.san).toBe('e4');
      expect(engine.getTurn()).toBe('b');
    });

    it('returns null for invalid move', () => {
      const move = engine.applyMove('e2', 'e5');
      expect(move).toBeNull();
    });
  });

  describe('undo', () => {
    it('undoes the last move', () => {
      engine.applyMove('e2', 'e4');
      const undone = engine.undo();
      expect(undone).not.toBeNull();
      expect(engine.getTurn()).toBe('w');
      expect(engine.getFen()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    });

    it('returns null when no moves to undo', () => {
      expect(engine.undo()).toBeNull();
    });
  });

  describe('game status detection', () => {
    it('detects check', () => {
      // Scholar's mate setup — just before mate, white queen gives check
      const engine = new ChessRuleEngine('rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2');
      engine.applyMove('d8', 'h4'); // Qh4+ check
      expect(engine.getGameStatus()).toBe('checkmate');
    });

    it('detects checkmate', () => {
      // Fool's mate position — black already mated white
      const mated = new ChessRuleEngine('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3');
      expect(mated.getGameStatus()).toBe('checkmate');
    });
  });

  describe('getBoard', () => {
    it('returns 8x8 board array', () => {
      const board = engine.getBoard();
      expect(board).toHaveLength(8);
      expect(board[0]).toHaveLength(8);
    });

    it('has white rook at a1', () => {
      const board = engine.getBoard();
      // board[7][0] = a1 (rank 1, file a) — chess.js returns rank 8 first
      const a1 = board[7][0];
      expect(a1).toEqual({ type: 'r', color: 'w' });
    });

    it('has null for empty squares', () => {
      const board = engine.getBoard();
      expect(board[4][0]).toBeNull(); // e4 at start is empty — wait, board[4] is rank 4 from top = rank 4
      // board[3][0] = rank 5 from top = rank 4 in chess... let me check
      // chess.js board(): row 0 = rank 8, row 7 = rank 1
      // So board[4][0] = rank 4, file a = a4 — empty at start
      expect(board[4][0]).toBeNull();
    });
  });

  describe('load', () => {
    it('loads a FEN position', () => {
      engine.load('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
      expect(engine.getTurn()).toBe('b');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/engine/rules.test.ts
```

Expected: FAIL — module `@/engine/rules` not found.

- [ ] **Step 3: Implement the rule engine**

Create `src/engine/rules.ts`:

```typescript
import { Chess } from 'chess.js';
import type { Square, Move, PieceColor, GameStatus, Piece } from './types';

export class ChessRuleEngine {
  private chess: Chess;

  constructor(fen?: string) {
    this.chess = fen ? new Chess(fen) : new Chess();
  }

  getFen(): string {
    return this.chess.fen();
  }

  getTurn(): PieceColor {
    return this.chess.turn();
  }

  getValidMoves(square: Square): Move[] {
    const moves = this.chess.moves({ square, verbose: true });
    return moves.map(m => ({
      from: m.from,
      to: m.to,
      piece: m.piece,
      color: m.color,
      captured: m.captured,
      promotion: m.promotion,
      san: m.san,
      flags: m.flags,
    }));
  }

  applyMove(from: Square, to: Square, promotion?: string): Move | null {
    try {
      const result = this.chess.move({ from, to, promotion });
      return {
        from: result.from,
        to: result.to,
        piece: result.piece,
        color: result.color,
        captured: result.captured,
        promotion: result.promotion,
        san: result.san,
        flags: result.flags,
      };
    } catch {
      return null;
    }
  }

  undo(): Move | null {
    const result = this.chess.undo();
    if (!result) return null;
    return {
      from: result.from,
      to: result.to,
      piece: result.piece,
      color: result.color,
      captured: result.captured,
      promotion: result.promotion,
      san: result.san,
      flags: result.flags,
    };
  }

  getGameStatus(): GameStatus {
    if (this.chess.isCheckmate()) return 'checkmate';
    if (this.chess.isStalemate()) return 'stalemate';
    if (this.chess.isThreefoldRepetition()) return 'draw_repetition';
    if (this.chess.isDraw()) return 'draw_fifty_move';
    if (this.chess.isCheck()) return 'check';
    return 'playing';
  }

  getBoard(): (Piece | null)[][] {
    return this.chess.board();
  }

  getPiece(square: Square): Piece | null {
    const piece = this.chess.get(square);
    return piece || null;
  }

  load(fen: string): void {
    this.chess.load(fen);
  }

  reset(): void {
    this.chess.reset();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/engine/rules.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/rules.ts __tests__/engine/rules.test.ts
git commit -m "feat: add chess rule engine wrapping chess.js with tests"
```

---

## Task 5: Plugin Interface (Shell)

**Files:**
- Create: `src/engine/plugin.ts`

- [ ] **Step 1: Create plugin interface**

Create `src/engine/plugin.ts`:

```typescript
import type { GamePlugin, Move } from './types';

/**
 * Plugin-aware rule engine wrapper.
 * MVP: passes through to base engine with no plugins active.
 * Future: plugins can modify moves, inject abilities, alter board state.
 */
export class PluginManager {
  private plugins: GamePlugin[] = [];

  register(plugin: GamePlugin): void {
    this.plugins.push(plugin);
  }

  unregister(pluginId: string): void {
    this.plugins = this.plugins.filter(p => p.id !== pluginId);
  }

  getPlugins(): GamePlugin[] {
    return [...this.plugins];
  }

  applyBeforeMove(fen: string, move: Move): Move | null {
    let current: Move | null = move;
    for (const plugin of this.plugins) {
      if (!current) break;
      if (plugin.onBeforeMove) {
        current = plugin.onBeforeMove(fen, current);
      }
    }
    return current;
  }

  applyAfterMove(fen: string, move: Move): string {
    let currentFen = fen;
    for (const plugin of this.plugins) {
      if (plugin.onAfterMove) {
        currentFen = plugin.onAfterMove(currentFen, move);
      }
    }
    return currentFen;
  }

  modifyValidMoves(moves: Move[], fen: string): Move[] {
    let current = moves;
    for (const plugin of this.plugins) {
      if (plugin.modifyValidMoves) {
        current = plugin.modifyValidMoves(current, fen);
      }
    }
    return current;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/engine/plugin.ts
git commit -m "feat: add plugin manager shell for future extensibility"
```

---

## Task 6: Zustand Game Store

**Files:**
- Create: `src/store/game-store.ts`, `__tests__/store/game-store.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/store/game-store.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/store/game-store';

describe('Game Store', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  describe('initial state', () => {
    it('starts with white to move', () => {
      expect(useGameStore.getState().turn).toBe('w');
    });

    it('starts with playing status', () => {
      expect(useGameStore.getState().status).toBe('playing');
    });

    it('has no selected square', () => {
      expect(useGameStore.getState().selectedSquare).toBeNull();
    });

    it('has empty move history', () => {
      expect(useGameStore.getState().moveHistory).toHaveLength(0);
    });

    it('default AI level is 10', () => {
      expect(useGameStore.getState().aiLevel).toBe(10);
    });

    it('default player color is white', () => {
      expect(useGameStore.getState().playerColor).toBe('w');
    });
  });

  describe('selectSquare', () => {
    it('selects a square with own piece', () => {
      useGameStore.getState().selectSquare('e2');
      const state = useGameStore.getState();
      expect(state.selectedSquare).toBe('e2');
      expect(state.validMoves.length).toBeGreaterThan(0);
    });

    it('deselects when clicking same square', () => {
      useGameStore.getState().selectSquare('e2');
      useGameStore.getState().selectSquare('e2');
      expect(useGameStore.getState().selectedSquare).toBeNull();
      expect(useGameStore.getState().validMoves).toHaveLength(0);
    });

    it('does not select empty square', () => {
      useGameStore.getState().selectSquare('e4');
      expect(useGameStore.getState().selectedSquare).toBeNull();
    });

    it('does not select opponent piece', () => {
      useGameStore.getState().selectSquare('e7');
      expect(useGameStore.getState().selectedSquare).toBeNull();
    });
  });

  describe('makeMove', () => {
    it('makes a valid move', () => {
      const move = useGameStore.getState().makeMove('e2', 'e4');
      expect(move).not.toBeNull();
      expect(useGameStore.getState().turn).toBe('b');
      expect(useGameStore.getState().moveHistory).toHaveLength(1);
    });

    it('clears selection after move', () => {
      useGameStore.getState().selectSquare('e2');
      useGameStore.getState().makeMove('e2', 'e4');
      expect(useGameStore.getState().selectedSquare).toBeNull();
      expect(useGameStore.getState().validMoves).toHaveLength(0);
    });

    it('records last move', () => {
      useGameStore.getState().makeMove('e2', 'e4');
      const state = useGameStore.getState();
      expect(state.lastMove).toEqual({ from: 'e2', to: 'e4' });
    });

    it('returns null for invalid move', () => {
      const move = useGameStore.getState().makeMove('e2', 'e5');
      expect(move).toBeNull();
    });
  });

  describe('undoMove', () => {
    it('undoes the last move', () => {
      useGameStore.getState().makeMove('e2', 'e4');
      useGameStore.getState().undoMove();
      expect(useGameStore.getState().turn).toBe('w');
      expect(useGameStore.getState().moveHistory).toHaveLength(0);
    });

    it('does nothing when no moves to undo', () => {
      useGameStore.getState().undoMove();
      expect(useGameStore.getState().turn).toBe('w');
    });
  });

  describe('settings', () => {
    it('sets AI level', () => {
      useGameStore.getState().setAiLevel(15);
      expect(useGameStore.getState().aiLevel).toBe(15);
    });

    it('clamps AI level to 1-20', () => {
      useGameStore.getState().setAiLevel(25);
      expect(useGameStore.getState().aiLevel).toBe(20);
      useGameStore.getState().setAiLevel(0);
      expect(useGameStore.getState().aiLevel).toBe(1);
    });

    it('sets player color', () => {
      useGameStore.getState().setPlayerColor('b');
      expect(useGameStore.getState().playerColor).toBe('b');
    });
  });

  describe('resetGame', () => {
    it('resets to initial state', () => {
      useGameStore.getState().makeMove('e2', 'e4');
      useGameStore.getState().resetGame();
      expect(useGameStore.getState().turn).toBe('w');
      expect(useGameStore.getState().moveHistory).toHaveLength(0);
      expect(useGameStore.getState().status).toBe('playing');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/store/game-store.test.ts
```

Expected: FAIL — module `@/store/game-store` not found.

- [ ] **Step 3: Implement the store**

Create `src/store/game-store.ts`:

```typescript
import { create } from 'zustand';
import { ChessRuleEngine } from '@/engine/rules';
import type { Square, Move, PieceColor, GameStatus } from '@/engine/types';

interface GameState {
  // Engine instance
  engine: ChessRuleEngine;

  // Game state (derived from engine, kept in sync)
  fen: string;
  turn: PieceColor;
  status: GameStatus;
  moveHistory: Move[];
  capturedPieces: { w: string[]; b: string[] };
  lastMove: { from: Square; to: Square } | null;

  // UI state
  selectedSquare: Square | null;
  validMoves: Move[];
  isAiThinking: boolean;
  needsPromotion: { from: Square; to: Square } | null;

  // Settings
  playerColor: PieceColor;
  aiLevel: number;

  // Actions
  selectSquare: (square: Square) => void;
  makeMove: (from: Square, to: Square, promotion?: string) => Move | null;
  undoMove: () => void;
  resetGame: () => void;
  setAiLevel: (level: number) => void;
  setPlayerColor: (color: PieceColor) => void;
  setAiThinking: (thinking: boolean) => void;
  setNeedsPromotion: (pending: { from: Square; to: Square } | null) => void;
}

function syncFromEngine(engine: ChessRuleEngine) {
  return {
    fen: engine.getFen(),
    turn: engine.getTurn(),
    status: engine.getGameStatus(),
  };
}

export const useGameStore = create<GameState>((set, get) => {
  const engine = new ChessRuleEngine();

  return {
    engine,
    ...syncFromEngine(engine),
    moveHistory: [],
    capturedPieces: { w: [], b: [] },
    lastMove: null,
    selectedSquare: null,
    validMoves: [],
    isAiThinking: false,
    needsPromotion: null,
    playerColor: 'w',
    aiLevel: 10,

    selectSquare(square: Square) {
      const state = get();
      const { engine, selectedSquare, validMoves } = state;

      // Deselect if clicking same square
      if (selectedSquare === square) {
        set({ selectedSquare: null, validMoves: [] });
        return;
      }

      // If a piece is selected and this square is a valid move target, make the move
      if (selectedSquare && validMoves.some(m => m.to === square)) {
        // Check if this is a pawn promotion
        const move = validMoves.find(m => m.to === square);
        if (move && move.piece === 'p' && (square[1] === '8' || square[1] === '1')) {
          set({ needsPromotion: { from: selectedSquare, to: square } });
          return;
        }
        state.makeMove(selectedSquare, square);
        return;
      }

      // Try to select a new piece
      const piece = engine.getPiece(square);
      if (!piece || piece.color !== engine.getTurn()) {
        set({ selectedSquare: null, validMoves: [] });
        return;
      }

      const moves = engine.getValidMoves(square);
      set({ selectedSquare: square, validMoves: moves });
    },

    makeMove(from: Square, to: Square, promotion?: string) {
      const { engine, moveHistory, capturedPieces } = get();
      const move = engine.applyMove(from, to, promotion);

      if (!move) return null;

      const newCaptured = { ...capturedPieces };
      if (move.captured) {
        // Captured pieces go to the capturing side's list
        newCaptured[move.color] = [...newCaptured[move.color], move.captured];
      }

      set({
        ...syncFromEngine(engine),
        moveHistory: [...moveHistory, move],
        capturedPieces: newCaptured,
        lastMove: { from, to },
        selectedSquare: null,
        validMoves: [],
        needsPromotion: null,
      });

      return move;
    },

    undoMove() {
      const { engine, moveHistory, capturedPieces } = get();
      const undone = engine.undo();
      if (!undone) return;

      const newHistory = moveHistory.slice(0, -1);
      const newCaptured = { ...capturedPieces };
      if (undone.captured) {
        const list = [...newCaptured[undone.color]];
        const idx = list.lastIndexOf(undone.captured);
        if (idx >= 0) list.splice(idx, 1);
        newCaptured[undone.color] = list;
      }

      const prevMove = newHistory.length > 0 ? newHistory[newHistory.length - 1] : null;

      set({
        ...syncFromEngine(engine),
        moveHistory: newHistory,
        capturedPieces: newCaptured,
        lastMove: prevMove ? { from: prevMove.from, to: prevMove.to } : null,
        selectedSquare: null,
        validMoves: [],
      });
    },

    resetGame() {
      const engine = new ChessRuleEngine();
      set({
        engine,
        ...syncFromEngine(engine),
        moveHistory: [],
        capturedPieces: { w: [], b: [] },
        lastMove: null,
        selectedSquare: null,
        validMoves: [],
        isAiThinking: false,
        needsPromotion: null,
      });
    },

    setAiLevel(level: number) {
      set({ aiLevel: Math.max(1, Math.min(20, level)) });
    },

    setPlayerColor(color: PieceColor) {
      set({ playerColor: color });
    },

    setAiThinking(thinking: boolean) {
      set({ isAiThinking: thinking });
    },

    setNeedsPromotion(pending) {
      set({ needsPromotion: pending });
    },
  };
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/store/game-store.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/store/game-store.ts __tests__/store/game-store.test.ts
git commit -m "feat: add Zustand game store with tests"
```

---

## Task 7: Stockfish AI Controller

**Files:**
- Create: `src/ai/ai-controller.ts`, `__tests__/ai/ai-controller.test.ts`

- [ ] **Step 1: Write the failing test for difficulty mapping**

Create `__tests__/ai/ai-controller.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { mapDifficulty } from '@/ai/ai-controller';

describe('AI Difficulty Mapping', () => {
  it('level 1 maps to lowest skill and depth', () => {
    const config = mapDifficulty(1);
    expect(config.skillLevel).toBe(0);
    expect(config.depth).toBe(1);
  });

  it('level 10 maps to mid-range', () => {
    const config = mapDifficulty(10);
    expect(config.skillLevel).toBeGreaterThanOrEqual(8);
    expect(config.skillLevel).toBeLessThanOrEqual(11);
    expect(config.depth).toBeGreaterThanOrEqual(8);
    expect(config.depth).toBeLessThanOrEqual(11);
  });

  it('level 20 maps to maximum skill and depth', () => {
    const config = mapDifficulty(20);
    expect(config.skillLevel).toBe(20);
    expect(config.depth).toBe(20);
  });

  it('clamps out-of-range values', () => {
    expect(mapDifficulty(0).skillLevel).toBe(0);
    expect(mapDifficulty(0).depth).toBe(1);
    expect(mapDifficulty(25).skillLevel).toBe(20);
    expect(mapDifficulty(25).depth).toBe(20);
  });

  it('returns integer values for all levels', () => {
    for (let i = 1; i <= 20; i++) {
      const config = mapDifficulty(i);
      expect(Number.isInteger(config.skillLevel)).toBe(true);
      expect(Number.isInteger(config.depth)).toBe(true);
    }
  });

  it('skill level and depth increase monotonically', () => {
    for (let i = 2; i <= 20; i++) {
      const prev = mapDifficulty(i - 1);
      const curr = mapDifficulty(i);
      expect(curr.skillLevel).toBeGreaterThanOrEqual(prev.skillLevel);
      expect(curr.depth).toBeGreaterThanOrEqual(prev.depth);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/ai/ai-controller.test.ts
```

Expected: FAIL — module `@/ai/ai-controller` not found.

- [ ] **Step 3: Implement the AI controller**

Create `src/ai/ai-controller.ts`:

```typescript
export interface DifficultyConfig {
  skillLevel: number; // Stockfish Skill Level 0-20
  depth: number;      // Search depth 1-20
}

/**
 * Maps slider value (1-20) to Stockfish parameters.
 * Skill Level controls how many "mistakes" the engine makes.
 * Depth controls how far ahead it looks.
 */
export function mapDifficulty(level: number): DifficultyConfig {
  const clamped = Math.max(1, Math.min(20, level));
  return {
    skillLevel: Math.round(((clamped - 1) / 19) * 20),
    depth: Math.max(1, Math.round(((clamped - 1) / 19) * 19) + 1),
  };
}

type MessageHandler = (line: string) => void;

export class AIController {
  private worker: Worker | null = null;
  private messageHandler: MessageHandler | null = null;
  private ready = false;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.worker = new Worker('/stockfish/stockfish.js');
      } catch {
        reject(new Error('Failed to create Stockfish worker. Is stockfish.js in public/?'));
        return;
      }

      this.worker.onmessage = (e: MessageEvent) => {
        const line: string = typeof e.data === 'string' ? e.data : String(e.data);
        if (line === 'readyok') {
          this.ready = true;
          resolve();
        }
        this.messageHandler?.(line);
      };

      this.worker.onerror = (e) => {
        reject(new Error(`Stockfish worker error: ${e.message}`));
      };

      this.send('uci');
      this.send('isready');
    });
  }

  private send(command: string): void {
    this.worker?.postMessage(command);
  }

  setDifficulty(level: number): void {
    const { skillLevel, depth: _depth } = mapDifficulty(level);
    this.send(`setoption name Skill Level value ${skillLevel}`);
  }

  getBestMove(fen: string, level: number): Promise<string> {
    const { depth } = mapDifficulty(level);

    return new Promise((resolve) => {
      this.messageHandler = (line: string) => {
        const match = line.match(/^bestmove\s([a-h][1-8][a-h][1-8][qrbnQRBN]?)/);
        if (match) {
          this.messageHandler = null;
          resolve(match[1]);
        }
      };

      this.send('ucinewgame');
      this.send(`position fen ${fen}`);
      this.setDifficulty(level);
      this.send(`go depth ${depth}`);
    });
  }

  stop(): void {
    this.send('stop');
  }

  destroy(): void {
    this.send('quit');
    this.worker?.terminate();
    this.worker = null;
    this.ready = false;
  }

  isReady(): boolean {
    return this.ready;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/ai/ai-controller.test.ts
```

Expected: All tests PASS (only the `mapDifficulty` pure function is tested; the Worker-based `AIController` class is integration-tested manually).

- [ ] **Step 5: Commit**

```bash
git add src/ai/ai-controller.ts __tests__/ai/ai-controller.test.ts
git commit -m "feat: add Stockfish AI controller with difficulty mapping"
```

---

## Task 8: 3D Scene + Board Rendering

**Files:**
- Create: `src/renderer/Scene.tsx`, `src/renderer/Board3D.tsx`, `src/renderer/Highlights.tsx`

- [ ] **Step 1: Create the Scene wrapper**

Create `src/renderer/Scene.tsx`:

```tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Board3D } from './Board3D';
import { Highlights } from './Highlights';
import { Pieces3D } from './Piece3D';

export function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 8, 8], fov: 45 }}
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-5, 5, -5]} intensity={0.3} />
      <Environment preset="studio" />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2.2}
        target={[3.5, 0, 3.5]}
      />
      <Board3D />
      <Highlights />
      <Pieces3D />
    </Canvas>
  );
}
```

- [ ] **Step 2: Create the 3D board**

Create `src/renderer/Board3D.tsx`:

```tsx
'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/store/game-store';
import * as THREE from 'three';

const LIGHT_COLOR = '#F0D9B5';
const DARK_COLOR = '#B58863';
const BOARD_SIZE = 8;

function Tile({ x, z, isLight }: { x: number; z: number; isLight: boolean }) {
  const store = useGameStore();
  const square = String.fromCharCode(97 + x) + (z + 1);

  const handleClick = (e: THREE.Event) => {
    e.stopPropagation();
    store.selectSquare(square);
  };

  return (
    <mesh
      position={[x, 0, z]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      onClick={handleClick}
    >
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial
        color={isLight ? LIGHT_COLOR : DARK_COLOR}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}

function CoordinateLabels() {
  const labels = useMemo(() => {
    const result: JSX.Element[] = [];
    const files = 'abcdefgh';
    for (let i = 0; i < 8; i++) {
      // File labels (a-h) along the bottom
      result.push(
        <group key={`file-${i}`} position={[i, 0.01, -0.7]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.3, 0.3]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        </group>
      );
      // Rank labels (1-8) along the left
      result.push(
        <group key={`rank-${i}`} position={[-0.7, 0.01, i]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.3, 0.3]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        </group>
      );
    }
    return result;
  }, []);

  return <>{labels}</>;
}

function BoardFrame() {
  return (
    <mesh position={[3.5, -0.1, 3.5]} receiveShadow>
      <boxGeometry args={[9, 0.2, 9]} />
      <meshStandardMaterial color="#5C3A1E" roughness={0.6} metalness={0.2} />
    </mesh>
  );
}

export function Board3D() {
  const tiles = useMemo(() => {
    const result: JSX.Element[] = [];
    for (let x = 0; x < BOARD_SIZE; x++) {
      for (let z = 0; z < BOARD_SIZE; z++) {
        const isLight = (x + z) % 2 === 0;
        result.push(<Tile key={`${x}-${z}`} x={x} z={z} isLight={isLight} />);
      }
    }
    return result;
  }, []);

  return (
    <group>
      <BoardFrame />
      {tiles}
      <CoordinateLabels />
    </group>
  );
}
```

- [ ] **Step 3: Create visual highlights**

Create `src/renderer/Highlights.tsx`:

```tsx
'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/store/game-store';
import { squareToPosition } from '@/engine/types';

const SELECTED_COLOR = '#FFFF00';
const VALID_MOVE_COLOR = '#00FF00';
const LAST_MOVE_COLOR = '#AAD4FF';
const CHECK_COLOR = '#FF0000';

function HighlightTile({ square, color, opacity = 0.4 }: { square: string; color: string; opacity?: number }) {
  const pos = squareToPosition(square);
  return (
    <mesh position={[pos.file, 0.02, pos.rank]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

function ValidMoveMarker({ square, isCapture }: { square: string; isCapture: boolean }) {
  const pos = squareToPosition(square);
  return (
    <mesh position={[pos.file, 0.03, pos.rank]} rotation={[-Math.PI / 2, 0, 0]}>
      {isCapture ? (
        <ringGeometry args={[0.35, 0.45, 32]} />
      ) : (
        <circleGeometry args={[0.15, 32]} />
      )}
      <meshBasicMaterial color={VALID_MOVE_COLOR} transparent opacity={0.6} depthWrite={false} />
    </mesh>
  );
}

export function Highlights() {
  const selectedSquare = useGameStore(s => s.selectedSquare);
  const validMoves = useGameStore(s => s.validMoves);
  const lastMove = useGameStore(s => s.lastMove);
  const status = useGameStore(s => s.status);
  const engine = useGameStore(s => s.engine);

  // Find king square if in check
  const kingInCheck = useMemo(() => {
    if (status !== 'check' && status !== 'checkmate') return null;
    const turn = engine.getTurn();
    const board = engine.getBoard();
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file];
        if (piece && piece.type === 'k' && piece.color === turn) {
          return String.fromCharCode(97 + file) + (8 - rank);
        }
      }
    }
    return null;
  }, [status, engine]);

  return (
    <group>
      {/* Last move highlight */}
      {lastMove && (
        <>
          <HighlightTile square={lastMove.from} color={LAST_MOVE_COLOR} opacity={0.3} />
          <HighlightTile square={lastMove.to} color={LAST_MOVE_COLOR} opacity={0.3} />
        </>
      )}

      {/* Selected square highlight */}
      {selectedSquare && (
        <HighlightTile square={selectedSquare} color={SELECTED_COLOR} opacity={0.5} />
      )}

      {/* Valid move markers */}
      {validMoves.map(move => (
        <ValidMoveMarker
          key={move.to}
          square={move.to}
          isCapture={!!move.captured}
        />
      ))}

      {/* Check glow on king */}
      {kingInCheck && (
        <HighlightTile square={kingInCheck} color={CHECK_COLOR} opacity={0.6} />
      )}
    </group>
  );
}
```

- [ ] **Step 4: Verify it renders**

```bash
npm run dev
```

Open `http://localhost:3000` — create a temporary test page to render the `<Scene />` component (this will be replaced in Task 11). For now just verify the board appears with tiles.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/Scene.tsx src/renderer/Board3D.tsx src/renderer/Highlights.tsx
git commit -m "feat: add 3D board rendering with tile highlights"
```

---

## Task 9: 3D Piece Rendering (Procedural)

**Files:**
- Create: `src/renderer/Piece3D.tsx`

- [ ] **Step 1: Create procedural 3D piece geometries**

Create `src/renderer/Piece3D.tsx`:

```tsx
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';
import { useGameStore } from '@/store/game-store';
import { squareToPosition } from '@/engine/types';
import type { PieceType, PieceColor, Piece } from '@/engine/types';

const WHITE_COLOR = '#E8E0D0';
const BLACK_COLOR = '#2A1A0A';
const WHITE_METAL = { metalness: 0.3, roughness: 0.4 };
const BLACK_METAL = { metalness: 0.4, roughness: 0.3 };

interface PieceProps {
  type: PieceType;
  color: PieceColor;
  square: string;
  isSelected: boolean;
}

function PieceMaterial({ color }: { color: PieceColor }) {
  const c = color === 'w' ? WHITE_COLOR : BLACK_COLOR;
  const metal = color === 'w' ? WHITE_METAL : BLACK_METAL;
  return <meshStandardMaterial color={c} {...metal} />;
}

function PawnMesh({ color }: { color: PieceColor }) {
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.35, 0.2, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      {/* Stem */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.2, 0.4, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <sphereGeometry args={[0.18, 24, 24]} />
        <PieceMaterial color={color} />
      </mesh>
    </group>
  );
}

function RookMesh({ color }: { color: PieceColor }) {
  return (
    <group>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.35, 0.3, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.4, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.25, 0.2, 4]} />
        <PieceMaterial color={color} />
      </mesh>
    </group>
  );
}

function KnightMesh({ color }: { color: PieceColor }) {
  return (
    <group>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.35, 0.3, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.5, 0.05]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 0.4, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      {/* Head - angled box for horse shape */}
      <mesh position={[0, 0.8, 0.1]} rotation={[0.3, 0, 0]} castShadow>
        <boxGeometry args={[0.2, 0.35, 0.3]} />
        <PieceMaterial color={color} />
      </mesh>
    </group>
  );
}

function BishopMesh({ color }: { color: PieceColor }) {
  return (
    <group>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.35, 0.3, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.22, 0.5, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      {/* Pointed top */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <coneGeometry args={[0.12, 0.3, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.1, 0]} castShadow>
        <sphereGeometry args={[0.06, 16, 16]} />
        <PieceMaterial color={color} />
      </mesh>
    </group>
  );
}

function QueenMesh({ color }: { color: PieceColor }) {
  return (
    <group>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.38, 0.3, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.25, 0.5, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow>
        <sphereGeometry args={[0.2, 24, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      {/* Crown points */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <coneGeometry args={[0.08, 0.2, 8]} />
        <PieceMaterial color={color} />
      </mesh>
    </group>
  );
}

function KingMesh({ color }: { color: PieceColor }) {
  return (
    <group>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.38, 0.3, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.25, 0.5, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow>
        <sphereGeometry args={[0.2, 24, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      {/* Cross on top */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[0.06, 0.3, 0.06]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.3, 0]} castShadow>
        <boxGeometry args={[0.2, 0.06, 0.06]} />
        <PieceMaterial color={color} />
      </mesh>
    </group>
  );
}

const PIECE_MESHES: Record<PieceType, React.FC<{ color: PieceColor }>> = {
  p: PawnMesh,
  r: RookMesh,
  n: KnightMesh,
  b: BishopMesh,
  q: QueenMesh,
  k: KingMesh,
};

function ChessPiece({ type, color, square, isSelected }: PieceProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const pos = squareToPosition(square);
  const store = useGameStore();
  const MeshComponent = PIECE_MESHES[type];

  const { posY, scale } = useSpring({
    posY: isSelected ? 0.3 : 0,
    scale: isSelected ? 1.1 : 1,
    config: { mass: 1, tension: 200, friction: 20 },
  });

  // Gentle float animation for selected piece
  useFrame((state) => {
    if (isSelected && groupRef.current) {
      groupRef.current.position.y = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
    }
  });

  const handleClick = (e: THREE.Event) => {
    e.stopPropagation();
    store.selectSquare(square);
  };

  return (
    <animated.group
      ref={groupRef}
      position-x={pos.file}
      position-y={posY}
      position-z={pos.rank}
      scale={scale}
      onClick={handleClick}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <MeshComponent color={color} />
    </animated.group>
  );
}

export function Pieces3D() {
  const engine = useGameStore(s => s.engine);
  const fen = useGameStore(s => s.fen); // subscribe to fen changes to re-render
  const selectedSquare = useGameStore(s => s.selectedSquare);

  const pieces = useMemo(() => {
    const result: { type: PieceType; color: PieceColor; square: string }[] = [];
    const board = engine.getBoard();
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file];
        if (piece) {
          const square = String.fromCharCode(97 + file) + (8 - rank);
          result.push({ type: piece.type as PieceType, color: piece.color as PieceColor, square });
        }
      }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen]);

  return (
    <group>
      {pieces.map(({ type, color, square }) => (
        <ChessPiece
          key={square}
          type={type}
          color={color}
          square={square}
          isSelected={selectedSquare === square}
        />
      ))}
    </group>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/Piece3D.tsx
git commit -m "feat: add procedural 3D chess piece rendering with animations"
```

---

## Task 10: Game Page

**Files:**
- Create: `src/app/game/page.tsx`, `src/ui/GameHUD.tsx`, `src/ui/MoveHistory.tsx`, `src/ui/PromotionDialog.tsx`

- [ ] **Step 1: Create the GameHUD sidebar**

Create `src/ui/GameHUD.tsx`:

```tsx
'use client';

import { useGameStore } from '@/store/game-store';
import { PIECE_DEFINITIONS } from '@/engine/pieces';
import type { PieceColor } from '@/engine/types';

function CapturedPieces({ color, pieces }: { color: PieceColor; pieces: string[] }) {
  const sorted = [...pieces].sort((a, b) => {
    const va = PIECE_DEFINITIONS[a as keyof typeof PIECE_DEFINITIONS]?.value ?? 0;
    const vb = PIECE_DEFINITIONS[b as keyof typeof PIECE_DEFINITIONS]?.value ?? 0;
    return vb - va;
  });

  return (
    <div className="flex flex-wrap gap-0.5 min-h-[24px]">
      {sorted.map((piece, i) => (
        <span key={i} className="text-lg">
          {PIECE_DEFINITIONS[piece as keyof typeof PIECE_DEFINITIONS]?.symbol[color === 'w' ? 'b' : 'w']}
        </span>
      ))}
    </div>
  );
}

function PlayerInfo({ label, color, isActive }: { label: string; color: PieceColor; isActive: boolean }) {
  const capturedPieces = useGameStore(s => s.capturedPieces);

  return (
    <div className={`p-3 rounded-lg ${isActive ? 'bg-amber-900/30 ring-1 ring-amber-500' : 'bg-stone-800/50'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-stone-300">{label}</span>
        {isActive && <span className="text-xs text-amber-400 animate-pulse">Thinking...</span>}
      </div>
      <CapturedPieces color={color} pieces={capturedPieces[color]} />
    </div>
  );
}

export function GameHUD() {
  const status = useGameStore(s => s.status);
  const turn = useGameStore(s => s.turn);
  const playerColor = useGameStore(s => s.playerColor);
  const aiLevel = useGameStore(s => s.aiLevel);
  const isAiThinking = useGameStore(s => s.isAiThinking);
  const undoMove = useGameStore(s => s.undoMove);
  const resetGame = useGameStore(s => s.resetGame);

  const isPlayerTurn = turn === playerColor;
  const opponentColor = playerColor === 'w' ? 'b' : 'w';

  const statusText = {
    playing: isPlayerTurn ? 'Your turn' : 'AI is thinking...',
    check: isPlayerTurn ? 'You are in check!' : 'AI is in check!',
    checkmate: isPlayerTurn ? 'Checkmate — You lose' : 'Checkmate — You win!',
    stalemate: 'Stalemate — Draw',
    draw_repetition: 'Draw — Threefold repetition',
    draw_insufficient: 'Draw — Insufficient material',
    draw_fifty_move: 'Draw — 50-move rule',
  }[status];

  const isGameOver = status === 'checkmate' || status === 'stalemate' ||
    status === 'draw_repetition' || status === 'draw_insufficient' || status === 'draw_fifty_move';

  return (
    <div className="flex flex-col gap-3 p-4 w-72 bg-stone-900 rounded-xl border border-stone-700">
      {/* Opponent info */}
      <PlayerInfo
        label={`AI (Level ${aiLevel})`}
        color={opponentColor}
        isActive={isAiThinking}
      />

      {/* Status */}
      <div className={`text-center py-2 px-3 rounded-lg text-sm font-medium ${
        isGameOver
          ? status === 'checkmate' && !isPlayerTurn
            ? 'bg-green-900/40 text-green-400'
            : 'bg-red-900/40 text-red-400'
          : status === 'check'
            ? 'bg-red-900/30 text-red-300'
            : 'bg-stone-800 text-stone-300'
      }`}>
        {statusText}
      </div>

      {/* Player info */}
      <PlayerInfo
        label="You"
        color={playerColor}
        isActive={isPlayerTurn && !isGameOver}
      />

      {/* Action buttons */}
      <div className="flex flex-col gap-2 mt-2">
        <button
          onClick={undoMove}
          disabled={isAiThinking || isGameOver}
          className="px-4 py-2 text-sm bg-stone-700 hover:bg-stone-600 disabled:opacity-40 disabled:cursor-not-allowed text-stone-200 rounded-lg transition-colors"
        >
          Undo Move
        </button>
        <button
          onClick={resetGame}
          className="px-4 py-2 text-sm bg-stone-700 hover:bg-stone-600 text-stone-200 rounded-lg transition-colors"
        >
          {isGameOver ? 'New Game' : 'Resign & New Game'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the MoveHistory component**

Create `src/ui/MoveHistory.tsx`:

```tsx
'use client';

import { useRef, useEffect } from 'react';
import { useGameStore } from '@/store/game-store';

export function MoveHistory() {
  const moveHistory = useGameStore(s => s.moveHistory);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moveHistory.length]);

  // Group moves into pairs (white + black)
  const movePairs: { number: number; white: string; black?: string }[] = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: moveHistory[i].san,
      black: moveHistory[i + 1]?.san,
    });
  }

  return (
    <div className="bg-stone-900 rounded-xl border border-stone-700 overflow-hidden">
      <div className="px-4 py-2 border-b border-stone-700">
        <span className="text-sm font-medium text-stone-300">Moves</span>
      </div>
      <div ref={scrollRef} className="max-h-60 overflow-y-auto p-2">
        {movePairs.length === 0 ? (
          <p className="text-xs text-stone-500 text-center py-4">No moves yet</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {movePairs.map(pair => (
                <tr key={pair.number} className="hover:bg-stone-800/50">
                  <td className="text-stone-500 w-8 text-right pr-2 py-0.5">{pair.number}.</td>
                  <td className="text-stone-200 w-20 py-0.5">{pair.white}</td>
                  <td className="text-stone-200 w-20 py-0.5">{pair.black ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create the PromotionDialog**

Create `src/ui/PromotionDialog.tsx`:

```tsx
'use client';

import { useGameStore } from '@/store/game-store';
import { PIECE_DEFINITIONS } from '@/engine/pieces';
import type { PieceType, PieceColor } from '@/engine/types';

const PROMOTION_PIECES: PieceType[] = ['q', 'r', 'b', 'n'];

export function PromotionDialog() {
  const needsPromotion = useGameStore(s => s.needsPromotion);
  const playerColor = useGameStore(s => s.playerColor);
  const makeMove = useGameStore(s => s.makeMove);
  const setNeedsPromotion = useGameStore(s => s.setNeedsPromotion);

  if (!needsPromotion) return null;

  const handleSelect = (piece: PieceType) => {
    makeMove(needsPromotion.from, needsPromotion.to, piece);
  };

  const handleCancel = () => {
    setNeedsPromotion(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={handleCancel}>
      <div className="bg-stone-800 rounded-xl p-4 border border-stone-600 shadow-2xl" onClick={e => e.stopPropagation()}>
        <p className="text-sm text-stone-300 mb-3 text-center">Promote pawn to:</p>
        <div className="flex gap-2">
          {PROMOTION_PIECES.map(piece => (
            <button
              key={piece}
              onClick={() => handleSelect(piece)}
              className="w-14 h-14 flex items-center justify-center text-3xl bg-stone-700 hover:bg-stone-600 rounded-lg transition-colors"
            >
              {PIECE_DEFINITIONS[piece].symbol[playerColor]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create the game page**

Create `src/app/game/page.tsx`:

```tsx
'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useCallback } from 'react';
import { GameHUD } from '@/ui/GameHUD';
import { MoveHistory } from '@/ui/MoveHistory';
import { PromotionDialog } from '@/ui/PromotionDialog';
import { useGameStore } from '@/store/game-store';
import { AIController } from '@/ai/ai-controller';

const Scene = dynamic(() => import('@/renderer/Scene').then(m => ({ default: m.Scene })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-stone-950">
      <p className="text-stone-400">Loading 3D engine...</p>
    </div>
  ),
});

export default function GamePage() {
  const aiRef = useRef<AIController | null>(null);
  const turn = useGameStore(s => s.turn);
  const fen = useGameStore(s => s.fen);
  const status = useGameStore(s => s.status);
  const playerColor = useGameStore(s => s.playerColor);
  const aiLevel = useGameStore(s => s.aiLevel);
  const isAiThinking = useGameStore(s => s.isAiThinking);

  // Initialize Stockfish
  useEffect(() => {
    const controller = new AIController();
    controller.init().then(() => {
      aiRef.current = controller;
    }).catch(err => {
      console.error('Failed to initialize Stockfish:', err);
    });

    return () => {
      controller.destroy();
      aiRef.current = null;
    };
  }, []);

  // AI move logic
  const makeAiMove = useCallback(async () => {
    const ai = aiRef.current;
    if (!ai || !ai.isReady()) return;

    const store = useGameStore.getState();
    store.setAiThinking(true);

    try {
      const bestMoveUci = await ai.getBestMove(store.fen, store.aiLevel);
      // Parse UCI move: e.g., "e2e4" or "e7e8q"
      const from = bestMoveUci.slice(0, 2);
      const to = bestMoveUci.slice(2, 4);
      const promotion = bestMoveUci.length > 4 ? bestMoveUci[4] : undefined;

      useGameStore.getState().makeMove(from, to, promotion);
    } catch (err) {
      console.error('AI move failed:', err);
    } finally {
      useGameStore.getState().setAiThinking(false);
    }
  }, []);

  // Trigger AI when it's AI's turn
  useEffect(() => {
    const isGameOver = status === 'checkmate' || status === 'stalemate' ||
      status.startsWith('draw');
    if (turn !== playerColor && !isAiThinking && !isGameOver) {
      makeAiMove();
    }
  }, [turn, playerColor, isAiThinking, status, makeAiMove]);

  return (
    <div className="flex h-screen bg-stone-950 text-white">
      {/* 3D Board — takes remaining width */}
      <div className="flex-1 relative">
        <Scene />
      </div>

      {/* Sidebar */}
      <div className="flex flex-col gap-3 p-4 overflow-y-auto">
        <GameHUD />
        <MoveHistory />
      </div>

      {/* Promotion dialog overlay */}
      <PromotionDialog />
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/game/page.tsx src/ui/GameHUD.tsx src/ui/MoveHistory.tsx src/ui/PromotionDialog.tsx
git commit -m "feat: add game page with HUD, move history, promotion dialog, and AI integration"
```

---

## Task 11: Main Menu Page

**Files:**
- Create: `src/ui/MainMenu.tsx`
- Modify: `src/app/page.tsx`, `src/app/layout.tsx`

- [ ] **Step 1: Create the MainMenu component**

Create `src/ui/MainMenu.tsx`:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/game-store';

export function MainMenu() {
  const router = useRouter();
  const aiLevel = useGameStore(s => s.aiLevel);
  const playerColor = useGameStore(s => s.playerColor);
  const setAiLevel = useGameStore(s => s.setAiLevel);
  const setPlayerColor = useGameStore(s => s.setPlayerColor);
  const resetGame = useGameStore(s => s.resetGame);

  const handleStart = () => {
    resetGame();
    router.push('/game');
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl p-8 w-96 shadow-2xl">
        {/* Title */}
        <h1 className="text-4xl font-bold text-center text-stone-100 mb-2">
          ProjectChess
        </h1>
        <p className="text-sm text-stone-500 text-center mb-8">3D Chess with AI</p>

        {/* Difficulty Slider */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-stone-300">AI Difficulty</label>
            <span className="text-sm font-mono text-amber-400">{aiLevel}/20</span>
          </div>
          <input
            type="range"
            min={1}
            max={20}
            value={aiLevel}
            onChange={e => setAiLevel(Number(e.target.value))}
            className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-xs text-stone-500 mt-1">
            <span>Beginner</span>
            <span>Master</span>
          </div>
        </div>

        {/* Color Selection */}
        <div className="mb-8">
          <label className="text-sm text-stone-300 block mb-2">Play as</label>
          <div className="flex gap-3">
            <button
              onClick={() => setPlayerColor('w')}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
                playerColor === 'w'
                  ? 'bg-stone-100 text-stone-900'
                  : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
              }`}
            >
              White
            </button>
            <button
              onClick={() => setPlayerColor('b')}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
                playerColor === 'b'
                  ? 'bg-stone-800 text-stone-100 ring-1 ring-stone-500'
                  : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
              }`}
            >
              Black
            </button>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors text-lg"
        >
          Start Game
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update the main page**

Replace `src/app/page.tsx`:

```tsx
import { MainMenu } from '@/ui/MainMenu';

export default function Home() {
  return <MainMenu />;
}
```

- [ ] **Step 3: Update root layout**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ProjectChess — 3D Chess with AI',
  description: 'Play chess against Stockfish AI in a 3D environment',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Verify the full flow**

```bash
npm run dev
```

1. Open `http://localhost:3000` — main menu should appear with difficulty slider, color selection, start button
2. Click "Start Game" — should navigate to `/game` with 3D board
3. Click a white piece — should highlight and show valid moves
4. Click a valid move — piece should move, AI should respond

- [ ] **Step 5: Commit**

```bash
git add src/ui/MainMenu.tsx src/app/page.tsx src/app/layout.tsx
git commit -m "feat: add main menu with difficulty slider and color selection"
```

---

## Task 12: Run All Tests & Fix Issues

**Files:**
- Modify: any files with test failures

- [ ] **Step 1: Run all tests**

```bash
npx vitest run
```

Expected: All tests in `__tests__/engine/pieces.test.ts`, `__tests__/engine/rules.test.ts`, `__tests__/store/game-store.test.ts`, and `__tests__/ai/ai-controller.test.ts` pass.

- [ ] **Step 2: Fix any failing tests**

Review failures, fix the root cause in source code or test code.

- [ ] **Step 3: Run the dev server and smoke test**

```bash
npm run dev
```

Manual verification:
1. Main menu loads with correct UI
2. Difficulty slider works (1-20)
3. Color selection toggles
4. Game page renders 3D board with all 32 pieces
5. Clicking white piece shows valid moves (green dots)
6. Making a move triggers AI response
7. Move history updates in sidebar
8. Undo button works
9. Resign & New Game resets

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve test failures and integration issues"
```

---

## Task 13: Build & Deploy

**Files:**
- Modify: any build errors

- [ ] **Step 1: Run production build**

```bash
npm run build
```

Fix any TypeScript or build errors that appear.

- [ ] **Step 2: Test production build locally**

```bash
npm run start
```

Verify the game works the same as in dev mode.

- [ ] **Step 3: Commit any build fixes**

```bash
git add -A
git commit -m "fix: resolve build errors for production"
```

- [ ] **Step 4: Push to GitHub**

```bash
git push origin master
```

- [ ] **Step 5: Deploy to Vercel**

```bash
npx vercel deploy --prod
```

Alternatively, connect the GitHub repo to Vercel for automatic deployments.

- [ ] **Step 6: Verify deployment**

Open the Vercel URL and confirm:
1. Main menu loads
2. Game page renders 3D board
3. Stockfish AI responds to moves
4. All interactions work (select, move, undo, reset)

- [ ] **Step 7: Final commit with deployment URL**

```bash
git add -A
git commit -m "chore: production build verified and deployed"
```
