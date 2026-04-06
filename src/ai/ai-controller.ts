export interface DifficultyConfig {
  skillLevel: number;
  depth: number;
}

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
        this.worker = new Worker("/stockfish/stockfish.js");
      } catch {
        reject(
          new Error(
            "Failed to create Stockfish worker. Is stockfish.js in public/?"
          )
        );
        return;
      }

      this.worker.onmessage = (e: MessageEvent) => {
        const line: string =
          typeof e.data === "string" ? e.data : String(e.data);
        if (line === "readyok") {
          this.ready = true;
          resolve();
        }
        this.messageHandler?.(line);
      };

      this.worker.onerror = (e) => {
        reject(new Error(`Stockfish worker error: ${e.message}`));
      };

      this.send("uci");
      this.send("isready");
    });
  }

  private send(command: string): void {
    this.worker?.postMessage(command);
  }

  setDifficulty(level: number): void {
    const { skillLevel } = mapDifficulty(level);
    this.send(`setoption name Skill Level value ${skillLevel}`);
  }

  getBestMove(fen: string, level: number): Promise<string> {
    const { depth } = mapDifficulty(level);

    return new Promise((resolve) => {
      this.messageHandler = (line: string) => {
        const match = line.match(
          /^bestmove\s([a-h][1-8][a-h][1-8][qrbnQRBN]?)/
        );
        if (match) {
          this.messageHandler = null;
          resolve(match[1]);
        }
      };

      this.send("ucinewgame");
      this.send(`position fen ${fen}`);
      this.setDifficulty(level);
      this.send(`go depth ${depth}`);
    });
  }

  stop(): void {
    this.send("stop");
  }

  destroy(): void {
    this.send("quit");
    this.worker?.terminate();
    this.worker = null;
    this.ready = false;
  }

  isReady(): boolean {
    return this.ready;
  }
}
