#!/usr/bin/env node
/**
 * Audits the built site against the standards this project measures in others.
 *
 * Contrast, heading order, landmarks, accessible names, table semantics and
 * focus visibility, in both colour schemes. A site about accessibility that is
 * not accessible would undo the argument before anyone read it.
 *
 * Expects the pages served locally. Defaults to the built site; pass a base URL
 * and paths to audit anything else, which is how the maintainer reports get
 * held to the same standard as the pages they eventually appear on.
 *
 *   npx serve site/dist -p 8097 && node scripts/audit-site.mjs
 *   node scripts/audit-site.mjs http://localhost:5199 /index.html /antd.html
 */
import { chromium } from 'playwright';
import { readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Every page the site actually built, rather than a hardcoded list.
 *
 * A fixed list goes stale silently: while results are withheld no per-library
 * page exists, and auditing one reported "no title" for the 404 body instead of
 * saying the page was missing.
 */
function discover(dir, base = dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? discover(join(dir, e.name), base)
      : e.name.endsWith('.html')
        ? ['/' + relative(base, join(dir, e.name))]
        : [],
  );
}

const lum = ([r,g,b]) => { const f=(c)=>{c/=255;return c<=0.03928?c/12.92:((c+0.055)/1.055)**2.4}; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
const ratio = (a,b) => { const [l1,l2]=[lum(a),lum(b)].sort((x,y)=>y-x); return (l1+0.05)/(l2+0.05); };
const parse = (s) => (s.match(/[\d.]+/g)||[]).slice(0,3).map(Number);

const [baseArg, ...pathArgs] = process.argv.slice(2);
const BASE = baseArg ?? 'http://localhost:8097';
const PATHS = pathArgs.length > 0 ? pathArgs : discover('site/dist').sort();
if (PATHS.length === 0) { console.error('  Nothing to audit. Build the site first.'); process.exit(1); }

const b = await chromium.launch();
const problems = [];
for (const scheme of ['light','dark']) {
  const ctx = await b.newContext({ viewport:{width:1280,height:1000} });
  const p = await ctx.newPage();
  p.on('pageerror', e => problems.push(`[${scheme}] page error: ${e.message}`));
  for (const path of PATHS) {
    const res = await p.goto(BASE+path, { waitUntil:'networkidle' });
    if (!res || !res.ok()) { problems.push(`[${scheme}${path}] not served: HTTP ${res?.status() ?? 'no response'}`); continue; }
    await p.evaluate((s)=>{document.documentElement.setAttribute('data-theme',s)}, scheme);

    const r = await p.evaluate(() => {
      const out = { headings:[], noName:[], lang:document.documentElement.lang, title:document.title,
                    landmarks:{main:!!document.querySelector('main'),header:!!document.querySelector('header'),footer:!!document.querySelector('footer'),nav:document.querySelectorAll('nav').length},
                    tables:[], text:[] };
        const hiddenH=(el)=>{let n=el;while(n){if(n.getAttribute&&n.getAttribute('aria-hidden')==='true')return true;n=n.parentElement}return false};
      document.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h=>{ if(!hiddenH(h)) out.headings.push(+h.tagName[1]); });
      document.querySelectorAll('a,button').forEach(el=>{
        if(hiddenH(el)) return;
        const name=(el.getAttribute('aria-label')||el.textContent||'').trim();
        if(!name) out.noName.push(el.outerHTML.slice(0,70));
      });
      document.querySelectorAll('table').forEach(t=>out.tables.push({
        caption:!!t.querySelector('caption'),
        scoped:t.querySelectorAll('th[scope]').length, ths:t.querySelectorAll('th').length }));
      // Resolving what a pixel of text actually sits on.
      //
      // The old version returned the first non-transparent background-color it
      // met walking up the tree. That is wrong twice over: a translucent colour
      // is not the final colour, and an element on a gradient has no
      // background-color at all, so it fell through to the page ground and
      // reported white text on a light page. Every panel in this design is a
      // gradient, so that produced hundreds of false failures.
      const parse=(c)=>{const n=(c.match(/[\d.]+/g)||[]).map(Number);return n.length>=3?[n[0],n[1],n[2],n.length>3?n[3]:1]:null};
      const over=(fg,bg)=>[0,1,2].map(i=>fg[i]*fg[3]+bg[i]*(1-fg[3]));
      // Composite every stop of a gradient over an assumed base and return the
      // lightest and darkest results, so text can be checked against whichever
      // is worse for its own colour.
      const gradientRange=(img)=>{
        const stops=(img.match(/rgba?\([^)]*\)/g)||[]).map(parse).filter(Boolean);
        if(!stops.length) return null;
        const opaque=stops.filter(s=>s[3]===1);
        const base=opaque.length?opaque.reduce((a,b)=>(a[0]+a[1]+a[2]<b[0]+b[1]+b[2]?a:b)):[255,255,255];
        const composited=stops.map(s=>over(s,base));
        const lum=(c)=>0.2126*c[0]+0.7152*c[1]+0.0722*c[2];
        return {light:composited.reduce((a,b)=>lum(a)>lum(b)?a:b), dark:composited.reduce((a,b)=>lum(a)<lum(b)?a:b)};
      };
      const bgOf=(el)=>{
        const layers=[];
        let n=el;
        while(n){
          const cs=getComputedStyle(n);
          if(cs.backgroundImage && cs.backgroundImage!=='none' && !/^url\(/.test(cs.backgroundImage)){
            const r=gradientRange(cs.backgroundImage);
            if(r) return {layers, range:r};
          }
          const c=parse(cs.backgroundColor);
          if(c && c[3]>0){
            if(c[3]===1) return {layers, solid:[c[0],c[1],c[2]]};
            layers.push(c);
          }
          n=n.parentElement;
        }
        return {layers, solid:[255,255,255]};
      };
      const resolveBg=(el)=>{
        const {layers, solid, range}=bgOf(el);
        const apply=(base)=>layers.reduceRight((acc,l)=>over(l,acc), base);
        if(solid) return {kind:'solid', colours:[apply(solid)]};
        return {kind:'gradient', colours:[apply(range.light), apply(range.dark)]};
      };
      // Anything hidden from assistive technology is decoration; a contrast
      // rule about it would be a rule about nothing.
      const hidden=(el)=>{let n=el;while(n){if(n.getAttribute&&n.getAttribute('aria-hidden')==='true')return true;n=n.parentElement}return false};
      document.querySelectorAll('p,li,h1,h2,h3,h4,span,a,td,th,caption').forEach(el=>{
        if(!el.textContent.trim()||el.children.length) return;
        const cs=getComputedStyle(el);
        if(cs.visibility==='hidden'||cs.display==='none'||cs.opacity==='0') return;
        if(hidden(el)) return;
        const bg=resolveBg(el);
        out.text.push({ fg:cs.color, bgs:bg.colours, onGradient:bg.kind==='gradient', size:parseFloat(cs.fontSize), weight:cs.fontWeight, t:el.textContent.trim().slice(0,32) });
      });
      return out;
    });

    if (r.lang !== 'en') problems.push(`[${scheme}${path}] html lang is "${r.lang}"`);
    if (!r.title) problems.push(`[${scheme}${path}] no title`);
    if (!r.landmarks.main) problems.push(`[${scheme}${path}] no <main>`);
    let prev=0;
    for (const h of r.headings){ if(prev && h>prev+1) problems.push(`[${scheme}${path}] heading jumps h${prev}->h${h}`); prev=h; }
    for (const n of r.noName) problems.push(`[${scheme}${path}] control with no accessible name: ${n}`);
    for (const t of r.tables){ if(!t.caption) problems.push(`[${scheme}${path}] table without caption`);
      if(t.ths && t.scoped<t.ths) problems.push(`[${scheme}${path}] ${t.ths-t.scoped} th without scope`); }
    for (const t of r.text){
      const large = t.size>=24 || (t.size>=18.66 && +t.weight>=700);
      const need = large?3:4.5;
      // Text over a gradient is judged at the worst point of it, not an
      // average, because the worst point is where somebody has to read it.
      const fg = parse(t.fg);
      const fgAlpha = (t.fg.match(/[\d.]+/g)||[]).map(Number)[3];
      const results = t.bgs.map((bg) => {
        const b = bg.map(Math.round);
        // Composite the text's own alpha first: a 70% white label is not white.
        const solid = fgAlpha !== undefined && fgAlpha < 1
          ? fg.map((v,i)=>Math.round(v*fgAlpha + b[i]*(1-fgAlpha)))
          : fg;
        return { ratio: ratio(solid, b), bg: `rgb(${b.join(',')})` };
      });
      const worst = results.reduce((a,b)=>a.ratio<b.ratio?a:b);
      if (worst.ratio < need) {
        const where = t.onGradient ? ' at the worst point of a gradient' : '';
        problems.push(`[${scheme}${path}] contrast ${worst.ratio.toFixed(2)}:1 (needs ${need}) "${t.t}" ${t.fg} on ${worst.bg}${where}`);
      }
    }

    // Focus must be visible: something must change when focused.
    const focusOk = await p.evaluate(() => {
      const el = document.querySelector('a.btn, .masthead nav a'); if(!el) return true;
      const before = getComputedStyle(el).outline + getComputedStyle(el).boxShadow;
      el.focus();
      const after = getComputedStyle(el).outline + getComputedStyle(el).boxShadow;
      return before !== after;
    });
    if (!focusOk) problems.push(`[${scheme}${path}] focus produces no visible change`);
  }
  await ctx.close();
}
await b.close();
console.log(problems.length ? '  ' + problems.length + ' issue(s):\n    ' + [...new Set(problems)].slice(0,14).join('\n    ') : '  no issues found');
