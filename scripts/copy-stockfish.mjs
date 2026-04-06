import { cpSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dest = join(root, "public", "stockfish");
const src = join(root, "node_modules", "stockfish", "bin");

mkdirSync(dest, { recursive: true });

cpSync(join(src, "stockfish-18-lite-single.js"), join(dest, "stockfish.js"));
cpSync(
  join(src, "stockfish-18-lite-single.wasm"),
  join(dest, "stockfish.wasm")
);

console.log("Copied Stockfish lite single-threaded to public/stockfish/");
