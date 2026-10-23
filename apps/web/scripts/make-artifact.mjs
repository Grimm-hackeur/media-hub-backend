// Turns the single-file demo build into an Artifact fragment (no doctype/html/head/body).
import { readFileSync, writeFileSync } from 'node:fs';
const html = readFileSync('dist-preview/index.html', 'utf8');
const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
if (!scripts.length) throw new Error('no script found in build');
const js = scripts.join('\n').replace(/<\/script/gi, '<\\/script');
const out = `<meta charset="utf-8">
<title>Media Hub</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap">
<style>
:root{color-scheme:dark;background:#0A0A0A}
body{background:#0A0A0A;color:#fff}
${styles}
</style>
<div id="root"></div>
<script type="module">${js}</script>
`;
writeFileSync('dist-preview/artifact.html', out);
console.log('artifact.html', (out.length / 1024).toFixed(0) + ' KB');
