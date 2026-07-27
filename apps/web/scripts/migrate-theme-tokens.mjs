/**
 * One-off migration: replace hardcoded slate Tailwind classes with semantic tokens.
 * Run: node apps/web/scripts/migrate-theme-tokens.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../src');

const REPLACEMENTS = [
  ['border-slate-800/80', 'border-border'],
  ['border-slate-800', 'border-border'],
  ['border-slate-700', 'border-border-strong'],
  ['border-slate-600', 'border-border-strong'],
  ['bg-slate-950/90', 'bg-card/90'],
  ['bg-slate-950/50', 'bg-card/50'],
  ['bg-slate-950/40', 'bg-card/40'],
  ['bg-slate-950/30', 'bg-card/30'],
  ['bg-slate-950', 'bg-card'],
  ['bg-slate-900/90', 'bg-muted/90'],
  ['bg-slate-900/80', 'bg-muted/80'],
  ['bg-slate-900/60', 'bg-muted/60'],
  ['bg-slate-900/50', 'bg-muted/50'],
  ['bg-slate-900/40', 'bg-muted/40'],
  ['bg-slate-900/30', 'bg-muted/30'],
  ['bg-slate-900', 'bg-muted'],
  ['bg-slate-800', 'bg-accent'],
  ['bg-slate-700', 'bg-accent'],
  ['text-slate-600', 'text-muted-foreground/80'],
  ['text-slate-500', 'text-muted-foreground'],
  ['text-slate-400', 'text-muted-foreground'],
  ['text-slate-300', 'text-muted-foreground'],
  ['text-slate-200', 'text-foreground'],
  ['hover:bg-slate-800/80', 'hover:bg-accent/80'],
  ['hover:bg-slate-800', 'hover:bg-accent'],
  ['hover:bg-slate-900/50', 'hover:bg-muted/50'],
  ['hover:bg-slate-900/40', 'hover:bg-muted/40'],
  ['group-hover:text-indigo-300', 'group-hover:text-primary'],
  ['hover:text-indigo-300', 'hover:text-primary'],
  ['text-indigo-300', 'text-primary'],
  ['bg-black/20', 'bg-foreground/10'],
  ['text-white', 'text-foreground'],
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx|scss|css)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function shouldProcess(content) {
  return REPLACEMENTS.some(([from]) => content.includes(from));
}

let touched = 0;
for (const file of walk(ROOT)) {
  let content = fs.readFileSync(file, 'utf8');
  if (!shouldProcess(content)) continue;
  const original = content;
  for (const [from, to] of REPLACEMENTS) {
    content = content.split(from).join(to);
  }
  // Headings and body text — keep primary buttons on indigo with white label
  content = content.replace(
    /(bg-indigo-600[^"']*?)text-foreground/g,
    '$1text-white',
  );
  content = content.replace(
    /(bg-indigo-500[^"']*?)text-foreground/g,
    '$1text-white',
  );
  content = content.replace(
    /(bg-primary[^"']*?)text-foreground/g,
    '$1text-primary-foreground',
  );
  content = content.replace(
    /(\? 'bg-indigo-600 text-foreground')/g,
    "? 'bg-indigo-600 text-white'",
  );
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('updated', path.relative(ROOT, file));
    touched++;
  }
}
console.log(`Done. ${touched} files updated.`);
