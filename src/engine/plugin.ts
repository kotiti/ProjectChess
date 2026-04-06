import type { GamePlugin, Move } from "./types";

export class PluginManager {
  private plugins: GamePlugin[] = [];

  register(plugin: GamePlugin): void {
    this.plugins.push(plugin);
  }

  unregister(pluginId: string): void {
    this.plugins = this.plugins.filter((p) => p.id !== pluginId);
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
