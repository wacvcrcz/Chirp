// scripts/check-logical-props.mjs (run as `pnpm check:rtl`)
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
const files = execSync("git ls-files 'src/**/*.tsx'", { encoding: "utf8" }).split("\n").filter(Boolean);
const bad = /(?:^|[\s"'`:])-?(?:ml|mr|pl|pr|left|right|border-l|border-r|rounded-l|rounded-r|text-left|text-right|float-left|float-right)(?:-[\w[\]./%]+)?(?=[\s"'`])/;
let failed = false;
for (const f of files) {
  readFileSync(f, "utf8").split("\n").forEach((line, i) => {
    if (line.includes("rtl-ok")) return;
    if (/class(Name)?=|cn\(|clsx\(/.test(line) && bad.test(line)) { console.error(`${f}:${i + 1}  ${line.trim()}`); failed = true; }
  });
}
process.exit(failed ? 1 : 0);
