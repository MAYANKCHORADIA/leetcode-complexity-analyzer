function getCodeFromEditor() {
  // 1️⃣ Monaco/CodeMirror (most pages, including submissions) ➜ `.view-lines` collects all code lines
  const viewLines = document.querySelector('.view-lines');
  if (viewLines && viewLines.innerText.trim()) {
    return viewLines.innerText; // already a \n‑separated string
  }

  // 2️⃣ Legacy/textarea fallback (rare)
  const textareas = document.querySelectorAll('textarea');
  let combined = '';
  textareas.forEach(t => (combined += t.value + '\n'));
  if (combined.trim()) return combined;

  return null; // editor not yet loaded
}

/* ---------------- Helper – Detect language ---------------- */
function detectLanguage() {
  const ddl = document.querySelector('select[data-e2e-locator="code-language-select"]');
  if (!ddl) return 'cpp';
  const val = ddl.value.toLowerCase();
  if (val.includes('python')) return 'python';
  if (val.includes('java')) return 'java';
  return 'cpp';
}

/* ---------------- Complexity Estimator ---------------- */
function estimateComplexity(code, lang) {
  // Very lightweight heuristic: count loops & detect recursion, plus brace‑based nesting for C/Java‑style braces.
  let loops = 0;
  let nestDetected = false;
  let recursion = false;
  const lines = code.split(/\n|\r/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/\b(for|while)\b/.test(line)) {
      loops++;
      // ---- brace scan for nested loop ----
      let opens = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      for (let j = i + 1; j < lines.length && opens >= 0; j++) {
        const inner = lines[j];
        opens += (inner.match(/{/g) || []).length;
        opens -= (inner.match(/}/g) || []).length;
        if (/\b(for|while)\b/.test(inner)) {
          nestDetected = true;
          break;
        }
        if (opens === 0) break;
      }
    }
  }

  // ---- recursion detection (simple) ----
  if (lang === 'python') {
    recursion = /def\s+(\w+)\s*\(.*\):[\s\S]*?\b\1\s*\(/.test(code);
  } else {
    // c++ or java style
    recursion = /(\w+)\s*\([^)]*\)\s*{[\s\S]*?\b\1\s*\(/.test(code);
  }

  // ---- decide complexity label ----
  if (recursion) return 'Likely O(2^n) or O(n) (recursive)';
  if (nestDetected) return 'O(n²) (nested loops)';
  if (loops === 1) return 'O(n) (single loop)';
  return 'O(1) or constant';
}

/* ---------------- UI Box ---------------- */
function showComplexityBox(text) {
  // Remove any existing boxes first
  const old = document.querySelector('#lc‑complexity‑box');
  if (old) old.remove();

  const box = document.createElement('div');
  box.id = 'lc‑complexity‑box';
  box.className = 'complexity-box';
  box.innerText = `⏱ Time Complexity: ${text}`;
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 12000);
}

/* ---------------- Observer to wait for editor ---------------- */
function tryAnalyze() {
  const code = getCodeFromEditor();
  if (!code) return; // editor not ready yet
  const lang = detectLanguage();
  const result = estimateComplexity(code, lang);
  showComplexityBox(result);
  return true;
}

// Keep trying until success (max 30 seconds)
const interval = setInterval(() => {
  if (tryAnalyze()) clearInterval(interval);
}, 1000);
setTimeout(() => clearInterval(interval), 30000);

(function ensureStyle() {
  if (document.querySelector('#lc‑complexity‑style')) return;
  const s = document.createElement('style');
  s.id = 'lc‑complexity‑style';
  s.textContent = `.complexity-box{position:fixed;top:20px;right:20px;background:#333;color:#fff;padding:10px 15px;border-radius:8px;font-size:14px;font-family:sans-serif;z-index:9999;box-shadow:0 2px 6px rgba(0,0,0,.3);}`;
  document.head.appendChild(s);
})();
