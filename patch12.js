const fs = require('fs');
let code = fs.readFileSync('inject-supabase-html.js', 'utf8');

// I need to inject a line that mutates the HTML variable dynamically at build time.
// Find the exact line before it writes out the public/index.html file!
const writeLine = "fs.writeFileSync(destFile, html);";
if (code.includes(writeLine)) {
    code = code.replace(
        writeLine,
        `
// FORCE DEEP CLONE RENDER OVERRIDE IN THE VANILLA REACT APP
html = html.replace(/setHistory\\(HistoryManager\\.load\\(\\)\\);/g, "setHistory(JSON.parse(JSON.stringify(HistoryManager.load())));");

fs.writeFileSync(destFile, html);
        `
    );
    fs.writeFileSync('inject-supabase-html.js', code);
    console.log("Patch 12 (Dynamic Build Pipeline Clone) applied!");
} else {
    console.log("Could not find the writeFileSync line!");
}
