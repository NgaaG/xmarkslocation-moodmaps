// scripts/replace-url.js
// Usage: node replace-url.js <vercelUrl> <appsScriptUrl>
import fs from "fs";
import path from "path";

const [,, vercelUrl, appsScriptUrl] = process.argv;
if (!vercelUrl || !appsScriptUrl) {
  console.error("Usage: node replace-url.js <vercelUrl> <appsScriptUrl>");
  process.exit(1);
}

const root = process.cwd(); // run from project root
function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== "node_modules" && e.name !== ".git") walk(full);
    else if (e.isFile() && /\.(js|ts|tsx|jsx|json|pde)$/.test(e.name)) {
      let content = fs.readFileSync(full, "utf8");
      let replaced = content.replace(/https?:\/\/YOUR-VERCEL-APP\.vercel\.app/g, vercelUrl);
      replaced = replaced.replace(/YOUR_APPS_SCRIPT_EXEC_URL_HERE/g, appsScriptUrl);
      if (replaced !== content) {
        fs.writeFileSync(full, replaced, "utf8");
        console.log("Updated", full);
      }
    }
  }
}

walk(root);
console.log("Done.");
