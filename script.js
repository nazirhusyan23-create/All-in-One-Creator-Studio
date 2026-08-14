/* ============================================================
   All-in-One Creator — app logic
   Sections: navigation, calculators, toast system, tool modal
   shell, and the Photo / Video / PDF tool implementations.
   Everything runs locally in the browser using native Canvas,
   MediaRecorder, and File APIs — no external AI/FFmpeg workers.
   ============================================================ */

/* ============================================================
   Navigation — switchTab is defined at the top level (not inside
   a closure) so it is globally available and never undefined.
   ============================================================ */

function switchTab(cat) {
  const navItems = document.querySelectorAll('#top-nav button');
  const panels = document.querySelectorAll('.panel');
  navItems.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === cat);
  });
  panels.forEach(panel => {
    panel.classList.toggle('active', panel.id === 'panel-' + cat);
  });
}
window.switchTab = switchTab;

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#top-nav button').forEach(item => {
    item.addEventListener('click', () => {
      const cat = item.dataset.cat;
      if (cat) switchTab(cat);
    });
  });

  const calcGrid = document.getElementById('calc-grid');
  if (calcGrid) {
    calcGrid.innerHTML = calculators.map((calc, i) => `
      <div class="rounded-2xl border border-brd bg-elev2 p-4 flex flex-col justify-between lift-card">
        <div>
          <span class="text-[10px] font-mono text-faint uppercase">Calculator 0${i + 1}</span>
          <h4 class="font-display font-semibold text-sm text-ink mt-1">${escapeHTML(calc.title)}</h4>
          <p class="text-xs text-dim mt-1 leading-relaxed">${escapeHTML(calc.desc)}</p>
        </div>
        <button onclick="openCalculator(${calc.id})" class="mt-4 py-1.5 px-3 rounded-full bg-elev3 border border-brd text-xs font-semibold text-ink hover:border-primary/50 hover:text-primary transition self-start">Open Calculator</button>
      </div>
    `).join('');
  }
});

/* ============================================================
   Small shared utilities
   ============================================================ */

function escapeHTML(str) {
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024) return bytes + ' B';
  const units = ['KB', 'MB', 'GB'];
  let i = -1;
  do { bytes /= 1024; i++; } while (bytes >= 1024 && i < units.length - 1);
  return bytes.toFixed(1) + ' ' + units[i];
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function showToast(message, type) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const colors = {
    success: 'border-teal/40 text-teal',
    error: 'border-danger/40 text-danger',
    info: 'border-primary/40 text-primary'
  };
  const cls = colors[type] || colors.info;
  const el = document.createElement('div');
  el.className = `toast toast-enter flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-elev border ${cls} text-xs font-medium shadow-lg max-w-xs`;
  el.textContent = message;
  container.appendChild(el);
  requestAnimationFrame(() => el.classList.remove('toast-enter'));
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px) scale(.98)';
    setTimeout(() => el.remove(), 350);
  }, 4200);
}

/* ============================================================
   Revenue calculators (Home panel)
   ============================================================ */

const calculators = [
  { id: 1, title: 'Google AdSense Revenue Estimator', desc: 'Estimate monthly earnings based on page views and CTR.', fields: ['Monthly Page Views', 'Average CTR (%)', 'Cost Per Click ($)'] },
  { id: 2, title: 'Ezoic Earnings Calculator', desc: 'Project uplift from advanced ad layout optimization.', fields: ['Monthly Page Views', 'Current RPM ($)'] },
  { id: 3, title: 'Media.net Contextual Yield', desc: 'Calculate potential revenue from targeted contextual ads.', fields: ['Search Queries / Views', 'RPM ($)'] },
  { id: 4, title: 'AdMob Mobile App Revenue', desc: 'Model in-app banner, interstitial, and rewarded ad income.', fields: ['Daily Active Users (DAU)', 'Impressions per User', 'eCPM ($)'] },
  { id: 5, title: 'Amazon Appstore Royalties', desc: 'Estimate developer payouts for digital app distributions.', fields: ['Paid App Downloads', 'App Price ($)'] },
  { id: 6, title: 'Payoneer Fee & Conversion Calculator', desc: 'Calculate net funds after international transfer fees.', fields: ['Withdrawal Amount ($)', 'Fee Percentage (%)'] },
  { id: 7, title: 'Content Traffic Growth Model', desc: 'Project organic traffic scaling over 12 months.', fields: ['Current Monthly Visitors', 'Monthly Growth Rate (%)'] },
  { id: 8, title: 'Vercel Bandwidth Cost Estimator', desc: 'Monitor static hosting and serverless function limits.', fields: ['Total GB Bandwidth Used', 'Cost per Extra GB ($)'] },
  { id: 9, title: 'App Monetization ROI Calculator', desc: 'Evaluate development cost vs. ad network returns.', fields: ['Total Development Cost ($)', 'Monthly Ad Revenue ($)'] },
  { id: 10, title: 'Author / Researcher Citation Impact', desc: 'Track academic publication metrics and visibility.', fields: ['Total Published Papers', 'Average Citations per Paper'] }
];

function openCalculator(id) {
  const calc = calculators.find(c => c.id === id);
  if (!calc) return;

  const modal = document.getElementById('calc-modal');
  const content = document.getElementById('modal-content');

  const fieldsHTML = calc.fields.map((field, idx) => `
    <div class="mb-3">
      <label class="block text-xs font-mono text-dim mb-1">${escapeHTML(field)}</label>
      <input type="number" id="calc-input-${idx}" value="1000" class="w-full bg-elev3 border border-brd rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-primary">
    </div>
  `).join('');

  content.innerHTML = `
    <h3 class="font-display font-semibold text-lg text-ink mb-1">${escapeHTML(calc.title)}</h3>
    <p class="text-xs text-dim mb-4">${escapeHTML(calc.desc)}</p>
    <div class="space-y-3 mb-5">${fieldsHTML}</div>
    <button onclick="calculateResult(${calc.id})" class="w-full py-2.5 rounded-full bg-primary text-sm font-semibold text-white hover:opacity-90 transition">Calculate Results</button>
    <div id="calc-result" class="mt-4 p-3 rounded-lg bg-elev3 border border-brd text-sm font-mono text-teal text-center hidden"></div>
  `;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeCalculator() {
  const modal = document.getElementById('calc-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function calculateResult(id) {
  const calc = calculators.find(c => c.id === id);
  const v = calc.fields.map((_, idx) => parseFloat(document.getElementById(`calc-input-${idx}`).value) || 0);
  let resText = '';

  if (id === 1) resText = `Estimated Monthly Earnings: $${((v[0] * (v[1] / 100)) * v[2]).toFixed(2)}`;
  else if (id === 2) resText = `Estimated Optimized Earnings: $${((v[0] / 1000) * (v[1] * 1.35)).toFixed(2)} (35% average lift)`;
  else if (id === 3) resText = `Projected Contextual Yield: $${((v[0] / 1000) * v[1]).toFixed(2)}`;
  else if (id === 4) resText = `Monthly AdMob Revenue: $${(((v[0] * v[1] * 30) / 1000) * v[2]).toFixed(2)}`;
  else if (id === 5) resText = `Estimated Net Royalty (70%): $${(v[0] * v[1] * 0.70).toFixed(2)}`;
  else if (id === 6) resText = `Net Received Amount: $${(v[0] - (v[0] * (v[1] / 100))).toFixed(2)}`;
  else if (id === 7) resText = `Projected Visitors (Month 12): ${Math.round(v[0] * Math.pow(1 + (v[1] / 100), 12))}`;
  else if (id === 8) resText = v[0] <= 100 ? `Within Free Tier Limit ($0.00)` : `Estimated Cost: $${((v[0] - 100) * v[1]).toFixed(2)}`;
  else if (id === 9) resText = `Break-even Period: ${(v[0] / (v[1] || 1)).toFixed(1)} Months`;
  else if (id === 10) resText = `Total Citation Impact Score: ${v[0] * v[1]}`;

  const resDiv = document.getElementById('calc-result');
  resDiv.innerText = resText;
  resDiv.classList.remove('hidden');
}

/* ============================================================
   Generic tool modal shell (Photo / Video / PDF)
   ============================================================ */

const TOOL_RENDERERS = {
  'bg-remover': renderBgRemoverTool,
  'img-compressor': renderImgCompressorTool,
  'video-trim': renderVideoTrimTool,
  'video-resize': renderVideoResizeTool,
  'pdf-merge': renderPdfMergeSplitTool,
  'pdf-compress': renderPdfCompressTool
};

function openTool(id) {
  const modal = document.getElementById('tool-modal');
  const content = document.getElementById('tool-modal-content');
  const renderer = TOOL_RENDERERS[id];
  if (!renderer) return;
  content.innerHTML = '';
  renderer(content);
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}
window.openTool = openTool;

function closeTool() {
  const modal = document.getElementById('tool-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.getElementById('tool-modal-content').innerHTML = '';
}
window.closeTool = closeTool;

/** Wires a dropzone element to accept file(s) via click or drag & drop. */
function wireDropzone(zoneEl, inputEl, onFiles) {
  zoneEl.addEventListener('click', () => inputEl.click());
  inputEl.addEventListener('change', () => {
    if (inputEl.files.length) onFiles(Array.from(inputEl.files));
  });
  ['dragenter', 'dragover'].forEach(evt => {
    zoneEl.addEventListener(evt, e => { e.preventDefault(); zoneEl.classList.add('dragover'); });
  });
  ['dragleave', 'drop'].forEach(evt => {
    zoneEl.addEventListener(evt, e => { e.preventDefault(); zoneEl.classList.remove('dragover'); });
  });
  zoneEl.addEventListener('drop', e => {
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) onFiles(files);
  });
}

function dropzoneMarkup(accentClass, label, sublabel) {
  return `
    <div class="dropzone rounded-2xl border-2 border-dashed border-brd hover:${accentClass} bg-elev3/60 p-8 flex flex-col items-center justify-center text-center gap-1" data-role="dropzone">
      <svg class="w-7 h-7 text-dim mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 16V4M12 4l-4 4M12 4l4 4"/><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
      <p class="text-sm font-semibold text-ink">${label}</p>
      <p class="text-xs text-faint">${sublabel}</p>
    </div>
  `;
}

/* ============================================================
   PHOTO TOOL 1 — Background Eraser
   100% native: draws the image to a Canvas, then flood-fills
   from the image border, removing pixels that are within a
   color-distance tolerance of the sampled edge/background color
   and setting their alpha to 0. No AI model, no external CDN —
   works well on flat or gradient studio backgrounds.
   ============================================================ */

function renderBgRemoverTool(root) {
  root.innerHTML = `
    <h3 class="font-display font-semibold text-lg text-ink mb-1">Background Eraser</h3>
    <p class="text-xs text-dim mb-4">Runs a border flood-fill directly on a Canvas in your browser — best for photos with a flat or gradient background (product shots, portraits on a plain backdrop). It won't segment complex scenes the way a full AI model would.</p>
    <div id="bg-drop-wrap">${dropzoneMarkup('border-violet', 'Upload or drag & drop an image', 'PNG or JPG, up to ~15MB')}</div>
    <input type="file" accept="image/png,image/jpeg,image/webp" class="hidden" id="bg-file-input">

    <div id="bg-controls" class="mt-4 hidden space-y-3">
      <div>
        <div class="flex justify-between text-xs mb-1"><span class="text-dim">Tolerance</span><span class="text-ink font-mono" id="bg-tol-val">32</span></div>
        <input type="range" min="4" max="90" value="32" class="w-full accent-violet" id="bg-tolerance">
        <p class="text-[11px] text-faint mt-1">Higher tolerance removes more of the background but can eat into the subject on busy edges.</p>
      </div>
      <button id="bg-run-btn" class="w-full py-2.5 rounded-full bg-violet text-sm font-semibold text-white hover:opacity-90 transition">Erase Background</button>
    </div>

    <div id="bg-status" class="mt-4 hidden">
      <div class="flex items-center gap-2 text-xs text-dim mb-2"><span class="spinner"></span><span id="bg-status-text">Processing…</span></div>
      <div class="progress-track"><div class="progress-fill bg-violet scan-bar" style="width:100%"></div></div>
    </div>
    <div id="bg-result" class="mt-4 hidden">
      <div class="checker rounded-xl p-2 flex items-center justify-center">
        <img id="bg-result-img" class="max-h-64 rounded-lg" alt="Background removed preview">
      </div>
      <button id="bg-download-btn" class="mt-3 w-full py-2.5 rounded-full bg-violet text-sm font-semibold text-white hover:opacity-90 transition">Download PNG</button>
    </div>
  `;

  const dropWrap = root.querySelector('#bg-drop-wrap');
  const zone = dropWrap.querySelector('[data-role="dropzone"]');
  const input = root.querySelector('#bg-file-input');
  const controls = root.querySelector('#bg-controls');
  const tolerance = root.querySelector('#bg-tolerance');
  const tolVal = root.querySelector('#bg-tol-val');
  const runBtn = root.querySelector('#bg-run-btn');
  const statusWrap = root.querySelector('#bg-status');
  const statusText = root.querySelector('#bg-status-text');
  const resultWrap = root.querySelector('#bg-result');

  let currentFile = null;
  tolerance.addEventListener('input', () => tolVal.textContent = tolerance.value);

  wireDropzone(zone, input, (files) => {
    const file = files[0];
    if (!file || !file.type.startsWith('image/')) {
      showToast('Please choose an image file.', 'error');
      return;
    }
    currentFile = file;
    resultWrap.classList.add('hidden');
    controls.classList.remove('hidden');
  });

  runBtn.addEventListener('click', async () => {
    if (!currentFile) return;
    runBtn.disabled = true;
    statusWrap.classList.remove('hidden');
    statusText.textContent = 'Reading pixels…';
    try {
      const blob = await eraseBackgroundCanvas(currentFile, parseInt(tolerance.value, 10), (msg) => {
        statusText.textContent = msg;
      });
      const url = URL.createObjectURL(blob);
      root.querySelector('#bg-result-img').src = url;
      resultWrap.classList.remove('hidden');
      root.querySelector('#bg-download-btn').onclick = () => downloadBlob(blob, currentFile.name.replace(/\.[^.]+$/, '') + '-erased.png');
      showToast('Background erased.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Could not process that image: ' + (err && err.message ? err.message : 'unknown error'), 'error');
    } finally {
      statusWrap.classList.add('hidden');
      runBtn.disabled = false;
    }
  });
}

/**
 * Loads `file` into a Canvas, then BFS-floods inward from every border
 * pixel, clearing (alpha = 0) any pixel whose color is within
 * `tolerance` of the running local reference color. Runs fully
 * client-side with typed arrays — no network calls.
 */
function eraseBackgroundCanvas(file, tolerance, onStatus) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        // Cap working resolution for performance on very large photos.
        const MAX_DIM = 2200;
        let w = img.width, h = img.height;
        const scale = Math.min(1, MAX_DIM / Math.max(w, h));
        w = Math.max(1, Math.round(w * scale));
        h = Math.max(1, Math.round(h * scale));

        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;

        if (onStatus) onStatus('Flood-filling background…');

        const visited = new Uint8Array(w * h);
        const stackX = new Int32Array(w * h);
        const stackY = new Int32Array(w * h);
        let sp = 0;

        const pushSeed = (x, y) => {
          const i = y * w + x;
          if (!visited[i]) { visited[i] = 2; stackX[sp] = x; stackY[sp] = y; sp++; }
        };
        for (let x = 0; x < w; x++) { pushSeed(x, 0); pushSeed(x, h - 1); }
        for (let y = 0; y < h; y++) { pushSeed(0, y); pushSeed(w - 1, y); }

        const tolSq = tolerance * tolerance * 3;

        while (sp > 0) {
          sp--;
          const x = stackX[sp], y = stackY[sp];
          const i = y * w + x;
          const p = i * 4;
          const r = data[p], g = data[p + 1], b = data[p + 2];

          // Clear this pixel's alpha — it matched the flood.
          data[p + 3] = 0;
          visited[i] = 1;

          const neighbors = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
          for (const [nx, ny] of neighbors) {
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
            const ni = ny * w + nx;
            if (visited[ni]) continue;
            const np = ni * 4;
            const dr = data[np] - r, dg = data[np + 1] - g, db = data[np + 2] - b;
            if (dr * dr + dg * dg + db * db <= tolSq) {
              visited[ni] = 2;
              stackX[sp] = nx; stackY[sp] = ny; sp++;
            }
          }
        }

        ctx.putImageData(imageData, 0, 0);
        if (onStatus) onStatus('Encoding PNG…');
        canvas.toBlob(blob => {
          URL.revokeObjectURL(img.src);
          if (blob) resolve(blob); else reject(new Error('Canvas encoding failed'));
        }, 'image/png');
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = URL.createObjectURL(file);
  });
}

/* ============================================================
   PHOTO TOOL 2 — Batch Image Compressor
   Canvas-based resize + re-encode. Works on multiple files;
   zips the output with JSZip when more than one file is used.
   ============================================================ */

function renderImgCompressorTool(root) {
  root.innerHTML = `
    <h3 class="font-display font-semibold text-lg text-ink mb-1">Batch Image Compressor</h3>
    <p class="text-xs text-dim mb-4">Resize and re-encode images in your browser. Drop in one or many files.</p>
    <div id="ic-drop-wrap">${dropzoneMarkup('border-violet', 'Upload or drag & drop images', 'JPG, PNG, or WebP — multiple files supported')}</div>
    <input type="file" accept="image/png,image/jpeg,image/webp" multiple class="hidden" id="ic-file-input">

    <div id="ic-controls" class="mt-4 hidden space-y-4">
      <div>
        <div class="flex justify-between text-xs mb-1"><span class="text-dim">Quality</span><span class="text-ink font-mono" id="ic-quality-val">80%</span></div>
        <input type="range" min="10" max="100" value="80" class="w-full accent-violet" id="ic-quality">
      </div>
      <div>
        <div class="flex justify-between text-xs mb-1"><span class="text-dim">Max width</span><span class="text-ink font-mono" id="ic-width-val">1920px</span></div>
        <input type="range" min="320" max="4000" step="10" value="1920" class="w-full accent-violet" id="ic-width">
      </div>
      <div>
        <label class="block text-xs text-dim mb-1">Output format</label>
        <select id="ic-format" class="w-full bg-elev3 border border-brd rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-violet">
          <option value="image/jpeg">JPEG</option>
          <option value="image/webp">WebP</option>
          <option value="image/png">PNG</option>
        </select>
      </div>
      <div id="ic-file-list" class="tool-thumb-list space-y-1.5 text-xs"></div>
      <button id="ic-run-btn" class="w-full py-2.5 rounded-full bg-violet text-sm font-semibold text-white hover:opacity-90 transition">Compress Images</button>
    </div>
  `;

  let queuedFiles = [];
  const zone = root.querySelector('#ic-drop-wrap [data-role="dropzone"]');
  const input = root.querySelector('#ic-file-input');
  const controls = root.querySelector('#ic-controls');
  const listEl = root.querySelector('#ic-file-list');
  const qualityInput = root.querySelector('#ic-quality');
  const widthInput = root.querySelector('#ic-width');

  qualityInput.addEventListener('input', () => root.querySelector('#ic-quality-val').textContent = qualityInput.value + '%');
  widthInput.addEventListener('input', () => root.querySelector('#ic-width-val').textContent = widthInput.value + 'px');

  wireDropzone(zone, input, (files) => {
    queuedFiles = files.filter(f => f.type.startsWith('image/'));
    if (!queuedFiles.length) { showToast('Please choose image files.', 'error'); return; }
    listEl.innerHTML = queuedFiles.map(f => `
      <div class="tool-file-row px-2.5 py-1.5 rounded-lg bg-elev3 border border-brd">
        <span class="text-ink truncate flex-1">${escapeHTML(f.name)}</span>
        <span class="text-faint font-mono">${formatBytes(f.size)}</span>
      </div>
    `).join('');
    controls.classList.remove('hidden');
  });

  root.querySelector('#ic-run-btn').addEventListener('click', async () => {
    if (!queuedFiles.length) return;
    const btn = root.querySelector('#ic-run-btn');
    btn.disabled = true;
    btn.textContent = 'Compressing…';
    const quality = parseInt(qualityInput.value, 10) / 100;
    const maxWidth = parseInt(widthInput.value, 10);
    const format = root.querySelector('#ic-format').value;
    const ext = format === 'image/png' ? 'png' : (format === 'image/webp' ? 'webp' : 'jpg');

    try {
      const results = [];
      for (const file of queuedFiles) {
        const blob = await compressImageFile(file, quality, maxWidth, format);
        results.push({ name: file.name.replace(/\.[^.]+$/, '') + '-compressed.' + ext, blob, original: file.size });
      }
      if (results.length === 1) {
        downloadBlob(results[0].blob, results[0].name);
      } else {
        const zip = new JSZip();
        results.forEach(r => zip.file(r.name, r.blob));
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(zipBlob, 'compressed-images.zip');
      }
      const savedTotal = results.reduce((s, r) => s + (r.original - r.blob.size), 0);
      showToast(`Done — saved ${formatBytes(Math.max(savedTotal, 0))} total.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Compression failed: ' + (err && err.message ? err.message : 'unknown error'), 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Compress Images';
    }
  });
}

function compressImageFile(file, quality, maxWidth, format) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w > maxWidth) { h = Math.round(h * (maxWidth / w)); w = maxWidth; }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => {
        URL.revokeObjectURL(img.src);
        if (blob) resolve(blob); else reject(new Error('Canvas encoding failed'));
      }, format, format === 'image/png' ? undefined : quality);
    };
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = URL.createObjectURL(file);
  });
}

/* ============================================================
   Shared helpers for the native video tools
   ============================================================ */

function parseTimeToSeconds(str) {
  const parts = String(str).split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

function secondsToTime(sec) {
  sec = Math.max(0, Math.floor(sec));
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function pickSupportedMime() {
  const candidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  for (const c of candidates) {
    if (window.MediaRecorder && MediaRecorder.isTypeSupported(c)) return c;
  }
  return '';
}

function assertRecordingSupported() {
  if (!window.MediaRecorder) {
    throw new Error('This browser does not support MediaRecorder. Try Chrome, Edge, or Firefox.');
  }
}

/* ============================================================
   VIDEO TOOL 1 — Video Trimmer
   100% native: seeks an offscreen <video> element to the start
   time, then records its captureStream() with MediaRecorder
   until the end time is reached. No WASM, no CDN worker.
   ============================================================ */

function renderVideoTrimTool(root) {
  root.innerHTML = `
    <h3 class="font-display font-semibold text-lg text-ink mb-1">Video Trimmer</h3>
    <p class="text-xs text-dim mb-4">Uses your browser's native playback + MediaRecorder APIs — everything happens on your device. Recording runs in real time, so a 20-second clip takes about 20 seconds. Output is a .webm file.</p>
    <div id="vt-drop-wrap">${dropzoneMarkup('border-amber', 'Upload or drag & drop a video', 'MP4, MOV, or WebM')}</div>
    <input type="file" accept="video/*" class="hidden" id="vt-file-input">

    <div id="vt-controls" class="mt-4 hidden space-y-4">
      <video id="vt-preview" class="w-full rounded-lg bg-ink" controls></video>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs text-dim mb-1">Start (mm:ss)</label>
          <input type="text" id="vt-start" value="0:00" class="w-full bg-elev3 border border-brd rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-amber">
        </div>
        <div>
          <label class="block text-xs text-dim mb-1">End (mm:ss)</label>
          <input type="text" id="vt-end" value="0:10" class="w-full bg-elev3 border border-brd rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-amber">
        </div>
      </div>
      <button id="vt-run-btn" class="w-full py-2.5 rounded-full bg-amber text-sm font-semibold text-white hover:opacity-90 transition">Trim Video</button>
      <div id="vt-status" class="hidden">
        <div class="flex items-center gap-2 text-xs text-dim mb-2"><span class="spinner"></span><span id="vt-status-text">Recording…</span></div>
        <div class="progress-track"><div class="progress-fill bg-amber" id="vt-progress" style="width:0%"></div></div>
      </div>
    </div>
  `;

  const zone = root.querySelector('#vt-drop-wrap [data-role="dropzone"]');
  const input = root.querySelector('#vt-file-input');
  let currentFile = null;

  wireDropzone(zone, input, (files) => {
    const file = files[0];
    if (!file || !file.type.startsWith('video/')) { showToast('Please choose a video file.', 'error'); return; }
    currentFile = file;
    const preview = root.querySelector('#vt-preview');
    preview.src = URL.createObjectURL(file);
    preview.onloadedmetadata = () => {
      root.querySelector('#vt-end').value = secondsToTime(Math.min(preview.duration, 10));
    };
    root.querySelector('#vt-controls').classList.remove('hidden');
  });

  root.querySelector('#vt-run-btn').addEventListener('click', async () => {
    if (!currentFile) return;
    const start = parseTimeToSeconds(root.querySelector('#vt-start').value);
    const end = parseTimeToSeconds(root.querySelector('#vt-end').value);
    if (end <= start) { showToast('End time must be after start time.', 'error'); return; }

    const btn = root.querySelector('#vt-run-btn');
    const statusWrap = root.querySelector('#vt-status');
    const statusText = root.querySelector('#vt-status-text');
    const progressBar = root.querySelector('#vt-progress');
    btn.disabled = true;
    statusWrap.classList.remove('hidden');
    statusText.textContent = 'Preparing…';

    try {
      assertRecordingSupported();
      const blob = await trimVideoNative(currentFile, start, end, (cur, total) => {
        const pct = total ? Math.min(100, Math.round(((cur - start) / (total - start)) * 100)) : 0;
        progressBar.style.width = pct + '%';
        statusText.textContent = `Recording… ${pct}%`;
      });
      downloadBlob(blob, currentFile.name.replace(/\.[^.]+$/, '') + '-trimmed.webm');
      showToast('Video trimmed and downloaded.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Trim failed: ' + (err && err.message ? err.message : 'unknown error'), 'error');
    } finally {
      btn.disabled = false;
      statusWrap.classList.add('hidden');
      progressBar.style.width = '0%';
    }
  });
}

/**
 * Seeks a hidden <video> to `start`, then records its captureStream()
 * with MediaRecorder until playback reaches `end`. Resolves with a
 * WebM Blob. Entirely native — no external workers.
 */
function trimVideoNative(file, start, end, onProgress) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = false;
    video.playsInline = true;
    video.src = URL.createObjectURL(file);

    const cleanup = () => URL.revokeObjectURL(video.src);

    video.addEventListener('error', () => { cleanup(); reject(new Error('Could not load that video file.')); });

    video.addEventListener('loadedmetadata', () => {
      if (start >= video.duration) { cleanup(); reject(new Error('Start time is beyond the video duration.')); return; }
      video.currentTime = start;
    });

    video.addEventListener('seeked', function onSeeked() {
      video.removeEventListener('seeked', onSeeked);

      let stream;
      try {
        stream = video.captureStream ? video.captureStream() : video.mozCaptureStream();
      } catch (e) {
        cleanup();
        reject(new Error('This browser does not support captureStream().'));
        return;
      }

      const mimeType = pickSupportedMime();
      let recorder;
      try {
        recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      } catch (e) {
        cleanup();
        reject(new Error('Could not start the recorder for this video format.'));
        return;
      }

      const chunks = [];
      recorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
      recorder.onstop = () => { cleanup(); resolve(new Blob(chunks, { type: mimeType || 'video/webm' })); };
      recorder.onerror = e => { cleanup(); reject(e.error || new Error('Recording failed')); };

      const clampedEnd = Math.min(end, video.duration);
      recorder.start();
      video.play().catch(() => { /* some browsers require user gesture; button click satisfies this */ });

      const tick = () => {
        if (video.paused && video.currentTime === 0) return;
        if (video.currentTime >= clampedEnd || video.ended) {
          video.pause();
          if (recorder.state !== 'inactive') recorder.stop();
          return;
        }
        if (onProgress) onProgress(video.currentTime, clampedEnd);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  });
}

/* ============================================================
   VIDEO TOOL 2 — Resolution Resizer (crop + scale to 9:16)
   100% native: redraws each video frame onto a 1080×1920 Canvas
   (center-cropped), then records canvas.captureStream() combined
   with the source audio track via MediaRecorder.
   ============================================================ */

function renderVideoResizeTool(root) {
  root.innerHTML = `
    <h3 class="font-display font-semibold text-lg text-ink mb-1">Resolution Resizer</h3>
    <p class="text-xs text-dim mb-4">Center-crops and redraws your clip frame-by-frame onto a vertical 9:16 canvas (1080×1920), ready for Shorts/Reels. Recording runs in real time and exports a .webm file.</p>
    <div id="vr-drop-wrap">${dropzoneMarkup('border-amber', 'Upload or drag & drop a video', 'MP4, MOV, or WebM')}</div>
    <input type="file" accept="video/*" class="hidden" id="vr-file-input">

    <div id="vr-controls" class="mt-4 hidden space-y-4">
      <video id="vr-preview" class="w-full rounded-lg bg-ink" controls muted></video>
      <button id="vr-run-btn" class="w-full py-2.5 rounded-full bg-amber text-sm font-semibold text-white hover:opacity-90 transition">Convert to 9:16</button>
      <div id="vr-status" class="hidden">
        <div class="flex items-center gap-2 text-xs text-dim mb-2"><span class="spinner"></span><span id="vr-status-text">Recording…</span></div>
        <div class="progress-track"><div class="progress-fill bg-amber" id="vr-progress" style="width:0%"></div></div>
      </div>
    </div>
  `;

  const zone = root.querySelector('#vr-drop-wrap [data-role="dropzone"]');
  const input = root.querySelector('#vr-file-input');
  let currentFile = null;

  wireDropzone(zone, input, (files) => {
    const file = files[0];
    if (!file || !file.type.startsWith('video/')) { showToast('Please choose a video file.', 'error'); return; }
    currentFile = file;
    root.querySelector('#vr-preview').src = URL.createObjectURL(file);
    root.querySelector('#vr-controls').classList.remove('hidden');
  });

  root.querySelector('#vr-run-btn').addEventListener('click', async () => {
    if (!currentFile) return;
    const btn = root.querySelector('#vr-run-btn');
    const statusWrap = root.querySelector('#vr-status');
    const statusText = root.querySelector('#vr-status-text');
    const progressBar = root.querySelector('#vr-progress');
    btn.disabled = true;
    statusWrap.classList.remove('hidden');
    statusText.textContent = 'Preparing…';

    try {
      assertRecordingSupported();
      const blob = await resizeVideoNative(currentFile, 1080, 1920, (cur, total) => {
        const pct = total ? Math.min(100, Math.round((cur / total) * 100)) : 0;
        progressBar.style.width = pct + '%';
        statusText.textContent = `Recording… ${pct}%`;
      });
      downloadBlob(blob, currentFile.name.replace(/\.[^.]+$/, '') + '-vertical.webm');
      showToast('Converted and downloaded.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Conversion failed: ' + (err && err.message ? err.message : 'unknown error'), 'error');
    } finally {
      btn.disabled = false;
      statusWrap.classList.add('hidden');
      progressBar.style.width = '0%';
    }
  });
}

/**
 * Plays `file` in a hidden <video>, redraws each frame center-cropped
 * onto a `targetW`x`targetH` canvas, and records the canvas stream
 * (with the original audio track attached) via MediaRecorder.
 */
function resizeVideoNative(file, targetW, targetH, onProgress) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true; // muted so autoplay isn't blocked; audio is still captured via the track below
    video.playsInline = true;
    video.src = URL.createObjectURL(file);

    const cleanup = () => URL.revokeObjectURL(video.src);
    video.addEventListener('error', () => { cleanup(); reject(new Error('Could not load that video file.')); });

    video.addEventListener('loadedmetadata', () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetW; canvas.height = targetH;
      const ctx = canvas.getContext('2d');

      let sourceStream;
      try {
        sourceStream = video.captureStream ? video.captureStream() : video.mozCaptureStream();
      } catch (e) {
        cleanup();
        reject(new Error('This browser does not support captureStream().'));
        return;
      }

      let canvasStream;
      try {
        canvasStream = canvas.captureStream(30);
      } catch (e) {
        cleanup();
        reject(new Error('This browser does not support canvas.captureStream().'));
        return;
      }
      sourceStream.getAudioTracks().forEach(t => canvasStream.addTrack(t));

      const mimeType = pickSupportedMime();
      let recorder;
      try {
        recorder = mimeType ? new MediaRecorder(canvasStream, { mimeType }) : new MediaRecorder(canvasStream);
      } catch (e) {
        cleanup();
        reject(new Error('Could not start the recorder for this video format.'));
        return;
      }

      const chunks = [];
      recorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
      recorder.onstop = () => { cleanup(); resolve(new Blob(chunks, { type: mimeType || 'video/webm' })); };
      recorder.onerror = e => { cleanup(); reject(e.error || new Error('Recording failed')); };

      let stopped = false;
      const stopAll = () => {
        if (stopped) return;
        stopped = true;
        video.pause();
        if (recorder.state !== 'inactive') recorder.stop();
      };

      const drawFrame = () => {
        if (stopped) return;
        if (video.paused || video.ended) { stopAll(); return; }
        const vw = video.videoWidth, vh = video.videoHeight;
        const targetAspect = targetW / targetH;
        let sw = vh * targetAspect, sh = vh, sx = (vw - sw) / 2, sy = 0;
        if (sw > vw) { sw = vw; sh = vw / targetAspect; sx = 0; sy = (vh - sh) / 2; }
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, targetW, targetH);
        if (onProgress) onProgress(video.currentTime, video.duration);
        requestAnimationFrame(drawFrame);
      };

      video.addEventListener('play', () => {
        recorder.start();
        drawFrame();
      });
      video.addEventListener('ended', stopAll);

      video.play().catch(err => { cleanup(); reject(new Error('Playback could not start: ' + err.message)); });
    });
  });
}

/* ============================================================
   PDF TOOL 1 — Merge & Split
   ============================================================ */

function renderPdfMergeSplitTool(root) {
  root.innerHTML = `
    <h3 class="font-display font-semibold text-lg text-ink mb-1">Merge &amp; Split PDFs</h3>
    <p class="text-xs text-dim mb-4">Combine PDFs in the order shown, or split a single PDF into one file per page.</p>

    <div class="flex gap-1 mb-4 border-b border-brd" id="pms-tabs">
      <button data-mode="merge" class="tab-underline active text-teal px-3 py-2 text-xs font-semibold">Merge</button>
      <button data-mode="split" class="tab-underline text-teal px-3 py-2 text-xs font-semibold">Split</button>
    </div>

    <div id="pms-merge-panel">
      <div id="pms-merge-drop">${dropzoneMarkup('border-teal', 'Upload or drag & drop PDFs', 'Select two or more files — order below is merge order')}</div>
      <input type="file" accept="application/pdf" multiple class="hidden" id="pms-merge-input">
      <div id="pms-merge-list" class="tool-thumb-list space-y-1.5 text-xs mt-3"></div>
      <button id="pms-merge-btn" class="mt-3 w-full py-2.5 rounded-full bg-teal text-sm font-semibold text-white hover:opacity-90 transition hidden">Merge PDFs</button>
    </div>

    <div id="pms-split-panel" class="hidden">
      <div id="pms-split-drop">${dropzoneMarkup('border-teal', 'Upload or drag & drop a PDF', 'A ZIP with one PDF per page will be downloaded')}</div>
      <input type="file" accept="application/pdf" class="hidden" id="pms-split-input">
      <div id="pms-split-info" class="text-xs text-dim mt-3"></div>
      <button id="pms-split-btn" class="mt-3 w-full py-2.5 rounded-full bg-teal text-sm font-semibold text-white hover:opacity-90 transition hidden">Split into Pages (.zip)</button>
    </div>
  `;

  // Tabs
  const tabs = root.querySelectorAll('#pms-tabs button');
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const mode = tab.dataset.mode;
    root.querySelector('#pms-merge-panel').classList.toggle('hidden', mode !== 'merge');
    root.querySelector('#pms-split-panel').classList.toggle('hidden', mode !== 'split');
  }));

  // Merge
  let mergeFiles = [];
  const mergeZone = root.querySelector('#pms-merge-drop [data-role="dropzone"]');
  const mergeInput = root.querySelector('#pms-merge-input');
  const mergeList = root.querySelector('#pms-merge-list');
  const mergeBtn = root.querySelector('#pms-merge-btn');

  function renderMergeList() {
    mergeList.innerHTML = mergeFiles.map((f, i) => `
      <div class="tool-file-row px-2.5 py-1.5 rounded-lg bg-elev3 border border-brd">
        <span class="text-faint font-mono w-5">${i + 1}.</span>
        <span class="text-ink truncate flex-1">${escapeHTML(f.name)}</span>
        <span class="text-faint font-mono mr-1">${formatBytes(f.size)}</span>
        <button data-idx="${i}" class="pms-remove text-danger text-xs px-1.5">✕</button>
      </div>
    `).join('');
    mergeList.querySelectorAll('.pms-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        mergeFiles.splice(parseInt(btn.dataset.idx, 10), 1);
        renderMergeList();
      });
    });
    mergeBtn.classList.toggle('hidden', mergeFiles.length < 2);
  }

  wireDropzone(mergeZone, mergeInput, (files) => {
    const pdfs = files.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (!pdfs.length) { showToast('Please choose PDF files.', 'error'); return; }
    mergeFiles = mergeFiles.concat(pdfs);
    renderMergeList();
  });

  mergeBtn.addEventListener('click', async () => {
    mergeBtn.disabled = true;
    mergeBtn.textContent = 'Merging…';
    try {
      const { PDFDocument } = PDFLib;
      const merged = await PDFDocument.create();
      for (const file of mergeFiles) {
        const bytes = await file.arrayBuffer();
        const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = await merged.copyPages(src, src.getPageIndices());
        pages.forEach(p => merged.addPage(p));
      }
      const outBytes = await merged.save();
      downloadBlob(new Blob([outBytes], { type: 'application/pdf' }), 'merged.pdf');
      showToast(`Merged ${mergeFiles.length} PDFs.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Merge failed: ' + (err && err.message ? err.message : 'unknown error'), 'error');
    } finally {
      mergeBtn.disabled = false;
      mergeBtn.textContent = 'Merge PDFs';
    }
  });

  // Split
  let splitFile = null;
  const splitZone = root.querySelector('#pms-split-drop [data-role="dropzone"]');
  const splitInput = root.querySelector('#pms-split-input');
  const splitInfo = root.querySelector('#pms-split-info');
  const splitBtn = root.querySelector('#pms-split-btn');

  wireDropzone(splitZone, splitInput, async (files) => {
    const file = files[0];
    if (!file || !(file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
      showToast('Please choose a PDF file.', 'error');
      return;
    }
    splitFile = file;
    try {
      const { PDFDocument } = PDFLib;
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      splitInfo.textContent = `${file.name} — ${doc.getPageCount()} pages, ${formatBytes(file.size)}`;
      splitBtn.classList.remove('hidden');
    } catch (err) {
      showToast('Could not read that PDF.', 'error');
    }
  });

  splitBtn.addEventListener('click', async () => {
    if (!splitFile) return;
    splitBtn.disabled = true;
    splitBtn.textContent = 'Splitting…';
    try {
      const { PDFDocument } = PDFLib;
      const bytes = await splitFile.arrayBuffer();
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const count = src.getPageCount();
      const zip = new JSZip();
      const pad = String(count).length;
      for (let i = 0; i < count; i++) {
        const out = await PDFDocument.create();
        const [page] = await out.copyPages(src, [i]);
        out.addPage(page);
        const b = await out.save();
        zip.file(`page-${String(i + 1).padStart(pad, '0')}.pdf`, b);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, splitFile.name.replace(/\.pdf$/i, '') + '-pages.zip');
      showToast(`Split into ${count} files.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Split failed: ' + (err && err.message ? err.message : 'unknown error'), 'error');
    } finally {
      splitBtn.disabled = false;
      splitBtn.textContent = 'Split into Pages (.zip)';
    }
  });
}

/* ============================================================
   PDF TOOL 2 — Compressor
   Strips unused metadata and re-saves with object streams for
   a real, if modest, size reduction. Honest about limits: this
   does not re-sample embedded images.
   ============================================================ */

function renderPdfCompressTool(root) {
  root.innerHTML = `
    <h3 class="font-display font-semibold text-lg text-ink mb-1">PDF Compressor</h3>
    <p class="text-xs text-dim mb-4">Strips metadata and rebuilds the document with compressed object streams. Works best on text-heavy PDFs; image-heavy PDFs will see smaller gains since embedded images aren't re-sampled.</p>
    <div id="pc-drop-wrap">${dropzoneMarkup('border-teal', 'Upload or drag & drop a PDF', 'Up to ~100MB')}</div>
    <input type="file" accept="application/pdf" class="hidden" id="pc-file-input">
    <div id="pc-info" class="text-xs text-dim mt-3 hidden"></div>
    <button id="pc-run-btn" class="mt-3 w-full py-2.5 rounded-full bg-teal text-sm font-semibold text-white hover:opacity-90 transition hidden">Compress PDF</button>
    <div id="pc-result" class="mt-3 hidden text-xs text-teal font-mono"></div>
  `;

  const zone = root.querySelector('#pc-drop-wrap [data-role="dropzone"]');
  const input = root.querySelector('#pc-file-input');
  const info = root.querySelector('#pc-info');
  const btn = root.querySelector('#pc-run-btn');
  const resultEl = root.querySelector('#pc-result');
  let currentFile = null;

  wireDropzone(zone, input, (files) => {
    const file = files[0];
    if (!file || !(file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
      showToast('Please choose a PDF file.', 'error');
      return;
    }
    currentFile = file;
    info.textContent = `${file.name} — ${formatBytes(file.size)}`;
    info.classList.remove('hidden');
    btn.classList.remove('hidden');
    resultEl.classList.add('hidden');
  });

  btn.addEventListener('click', async () => {
    if (!currentFile) return;
    btn.disabled = true;
    btn.textContent = 'Compressing…';
    try {
      const { PDFDocument } = PDFLib;
      const bytes = await currentFile.arrayBuffer();
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
      doc.setTitle(''); doc.setAuthor(''); doc.setSubject(''); doc.setKeywords([]);
      doc.setProducer('All-in-One Creator'); doc.setCreator('All-in-One Creator');
      const outBytes = await doc.save({ useObjectStreams: true });
      const outBlob = new Blob([outBytes], { type: 'application/pdf' });
      const savedPct = Math.max(0, Math.round((1 - outBlob.size / currentFile.size) * 100));
      downloadBlob(outBlob, currentFile.name.replace(/\.pdf$/i, '') + '-compressed.pdf');
      resultEl.textContent = `${formatBytes(currentFile.size)} → ${formatBytes(outBlob.size)} (${savedPct}% smaller)`;
      resultEl.classList.remove('hidden');
      showToast('PDF compressed and downloaded.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Compression failed: ' + (err && err.message ? err.message : 'unknown error'), 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Compress PDF';
    }
  });
}
