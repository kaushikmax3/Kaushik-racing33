import fs from "node:fs/promises";
import path from "node:path";

const repo = "https://api.github.com/repos/TUMFTM/racetrack-database/git/trees/master?recursive=1";
const headers = { "User-Agent": "Kaushik-Formula-GT-3D-track-importer", "Accept": "application/vnd.github+json" };
console.log("Fetching open circuit geometry index from TUMFTM/racetrack-database...");
const treeRes = await fetch(repo, { headers });
if (!treeRes.ok) throw new Error(`GitHub index request failed: ${treeRes.status}`);
const tree = await treeRes.json();
const files = (tree.tree || []).filter(x => x.type === "blob" && /^tracks\/.*\.(csv|txt)$/i.test(x.path));
if (!files.length) throw new Error("No track CSV files were found in the upstream repository.");
const outDir = path.resolve("public", "circuits");
await fs.mkdir(outDir, { recursive: true });
const index = [];
for (const file of files) {
  const url = `https://raw.githubusercontent.com/TUMFTM/racetrack-database/master/${file.path}`;
  const res = await fetch(url, { headers });
  if (!res.ok) { console.warn("Skipping", file.path, res.status); continue; }
  const raw = await res.text();
  const points = raw.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
    const a = line.split(/[;,\s]+/).map(Number);
    return a.length >= 2 && Number.isFinite(a[0]) && Number.isFinite(a[1]) ? [a[0], a[1]] : null;
  }).filter(Boolean);
  if (points.length < 40) continue;
  const name = path.basename(file.path).replace(/\.(csv|txt)$/i, "").replace(/[_-]+/g, " ");
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const minX=Math.min(...points.map(p=>p[0])), maxX=Math.max(...points.map(p=>p[0]));
  const minY=Math.min(...points.map(p=>p[1])), maxY=Math.max(...points.map(p=>p[1]));
  const span=Math.max(maxX-minX,maxY-minY);
  const scale=280/(span||1);
  const normalized=points.map(([x,y])=>[(x-(minX+maxX)/2)*scale,(y-(minY+maxY)/2)*scale]);
  await fs.writeFile(path.join(outDir, `${slug}.json`), JSON.stringify({name,source:"TUMFTM racetrack-database / OpenStreetMap-derived centreline",points:normalized}));
  index.push({name,slug,points:normalized.length});
  console.log(`Imported ${name}: ${normalized.length} centreline points`);
}
await fs.writeFile(path.join(outDir,"index.json"), JSON.stringify(index,null,2));
console.log(`Done. Imported ${index.length} circuits into public/circuits.`);
