/* ============================================================
   All-in-One Creator — app logic
   Sections: navigation, calculators, toast system, tool modal
   shell, and the Photo / Video / PDF tool implementations.
   All processing happens locally in the browser.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const navItems = document.querySelectorAll('#sidebar-nav button, #mobile-nav button');
  const panels = document.querySelectorAll('.panel');

  function switchTab(cat) {
    navItems.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cat === cat);
    });
    panels.forEach(panel => {
      panel.classList.toggle('active', panel.id === 'panel-' + cat);
    });
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const cat = item.dataset.cat;
      if (cat) switchTab(cat);
    });
  });

  const calcGrid = document.getElementById('calc-grid');
  if (calcGrid) {
    calcGrid.innerHTML = calculators.map((calc, i) => `
      <div class="rounded-xl border border-brd bg-elev2 p-4 flex flex-col justify-between hover:border-violet/40 transition">
        <div>
          <span class="text-[10px] font-mono text-faint uppercase">Calculator 0${i + 1}</span>
          <h4 class="font-display font-semibold text-sm text-ink mt-1">${escapeHTML(calc.title)}</h4>
          <p class="text-xs text-dim mt-1 leading-relaxed">${escapeHTML(calc.desc)}</p>
        </div>
        <button onclick="openCalculator(${calc.id})" class="mt-4 py-1.5 px-3 rounded-lg bg-elev3 border border-brd text-xs font-medium text-ink hover:border-violet/50 transition self-start">Open Calculator</button>
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
    info: 'border-violet/40 text-violet'
  };
  const cls = colors[type] || colors.info;
  const el = document.createElement('div');
  el.className = `toast toast-enter flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-elev2 border ${cls} text-xs font-medium shadow-lg max-w-xs`;
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
      <input type="number" id="calc-input-${idx}" value="1000" class="w-full bg-elev3 border border-brd rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-violet">
    </div>
  `).join('');

  content.innerHTML = `
    <h3 class="font-display font-semibold text-lg text-ink mb-1">${escapeHTML(calc.title)}</h3>
    <p class="text-xs text-dim mb-4">${escapeHTML(calc.desc)}</p>
    <div class="space-y-3 mb-5">${fieldsHTML}</div>
    <button onclick="calculateResult(${calc.id})" class="w-full py-2.5 rounded-lg bg-violet text-sm font-semibold text-base hover:opacity-90 transition">Calculate Results</button>
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

function closeTool() {
  const modal = document.getElementById('tool-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.getElementById('tool-modal-content').innerHTML = '';
}

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
    <div class="dropzone rounded-xl border-2 border-dashed border-brd hover:${accentClass} p-8 flex flex-col items-center justify-center text-center gap-1" data-role="dropzone">
      <svg class="w-7 h-7 text-dim mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 16V4M12 4l-4 4M12 4l4 4"/><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
      <p class="text-sm font-medium text-ink">${label}</p>
      <p class="text-xs text-faint">${sublabel}</p>
    </div>
  `;
}

/* ============================================================
   PHOTO TOOL 1 — AI Background Remover
   Uses @imgly/background-removal: a real segmentation model
   (ONNX + WASM) that runs entirely client-side.
   ============================================================ */

function renderBgRemoverTool(root) {
  root.innerHTML = `
    <h3 class="font-display font-semibold text-lg text-ink mb-1">AI Background Remover</h3>
    <p class="text-xs text-dim mb-4">Runs a real segmentation model locally in your browser. The first run downloads the model (a few MB) and caches it.</p>
    <div id="bg-drop-wrap">${dropzoneMarkup('border-violet', 'Upload or drag & drop an image', 'PNG or JPG, up to ~15MB')}</div>
    <input type="file" accept="image/png,image/jpeg,image/webp" class="hidden" id="bg-file-input">
    <div id="bg-status" class="mt-4 hidden">
      <div class="flex items-center gap-2 text-xs text-dim mb-2"><span class="spinner"></span><span id="bg-status-text">Loading model…</span></div>
      <div class="progress-track"><div class="progress-fill bg-violet" id="bg-progress" style="width:8%"></div></div>
    </div>
    <div id="bg-result" class="mt-4 hidden">
      <div class="checker rounded-xl p-2 flex items-center justify-center">
        <img id="bg-result-img" class="max-h-64 rounded-lg" alt="Background removed preview">
      </div>
      <button id="bg-download-btn" class="mt-3 w-full py-2.5 rounded-lg bg-violet text-sm font-semibold text-white hover:opacity-90 transition">Download PNG</button>
    </div>
  `;

  const dropWrap = root.querySelector('#bg-drop-wrap');
  const zone = dropWrap.querySelector('[data-role="dropzone"]');
  const input = root.querySelector('#bg-file-input');

  wireDropzone(zone, input, async (files) => {
    const file = files[0];
    if (!file || !file.type.startsWith('image/')) {
      showToast('Please choose an image file.', 'error');
      return;
    }
    const statusWrap = root.querySelector('#bg-status');
    const statusText = root.querySelector('#bg-status-text');
    const progressBar = root.querySelector('#bg-progress');
    const resultWrap = root.querySelector('#bg-result');
    resultWrap.classList.add('hidden');
    statusWrap.classList.remove('hidden');
    statusText.textContent = 'Loading AI model…';
    progressBar.style.width = '10%';

    try {
      const mod = await import('https://cdn.jsdelivr.net/npm/@imgly/background-removal/dist/browser.mjs');
      const blob = await mod.removeBackground(file, {
        progress: (key, current, total) => {
          const pct = total ? Math.round((current / total) * 100) : 0;
          statusText.textContent = `Processing (${key}): ${pct}%`;
          progressBar.style.width = Math.max(10, pct) + '%';
        }
      });
      progressBar.style.width = '100%';
      const url = URL.createObjectURL(blob);
      root.querySelector('#bg-result-img').src = url;
      resultWrap.classList.remove('hidden');
      statusWrap.classList.add('hidden');
      root.querySelector('#bg-download-btn').onclick = () => downloadBlob(blob, 'background-removed.png');
      showToast('Background removed.', 'success');
    } catch (err) {
      console.error(err);
      statusWrap.classList.add('hidden');
      showToast('Could not process that image: ' + (err && err.message ? err.message : 'unknown error'), 'error');
    }
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
      <button id="ic-run-btn" class="w-full py-2.5 rounded-lg bg-violet text-sm font-semibold text-white hover:opacity-90 transition">Compress Images</button>
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
   FFmpeg.wasm loader shared by both video tools
   ============================================================ */

let ffmpegSingleton = null;

async function loadFfmpeg(onStatus) {
  if (ffmpegSingleton) return ffmpegSingleton;
  if (!window.FFmpegWASM || !window.FFmpegUtil) {
    throw new Error('FFmpeg engine failed to load from CDN. Check your connection and try again.');
  }
  const { FFmpeg } = window.FFmpegWASM;
  const { toBlobURL } = window.FFmpegUtil;
  const ffmpeg = new FFmpeg();
  ffmpeg.on('log', ({ message }) => { if (onStatus) onStatus(message); });
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
  });
  ffmpegSingleton = ffmpeg;
  return ffmpeg;
}

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

/* ============================================================
   VIDEO TOOL 1 — Video Trimmer
   ============================================================ */

function renderVideoTrimTool(root) {
  root.innerHTML = `
    <h3 class="font-display font-semibold text-lg text-ink mb-1">Video Trimmer</h3>
    <p class="text-xs text-dim mb-4">Powered by a real FFmpeg build compiled to WebAssembly, running entirely in your browser.</p>
    <div id="vt-drop-wrap">${dropzoneMarkup('border-amber', 'Upload or drag & drop a video', 'MP4, MOV, or WebM')}</div>
    <input type="file" accept="video/*" class="hidden" id="vt-file-input">

    <div id="vt-controls" class="mt-4 hidden space-y-4">
      <video id="vt-preview" class="w-full rounded-lg bg-black" controls></video>
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
      <button id="vt-run-btn" class="w-full py-2.5 rounded-lg bg-amber text-sm font-semibold text-base hover:opacity-90 transition">Trim Video</button>
      <div id="vt-status" class="hidden">
        <div class="flex items-center gap-2 text-xs text-dim mb-2"><span class="spinner"></span><span id="vt-status-text">Loading engine…</span></div>
        <div class="progress-track"><div class="progress-fill bg-amber scan-bar" style="width:100%"></div></div>
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
    btn.disabled = true;
    statusWrap.classList.remove('hidden');
    statusText.textContent = 'Loading engine (first run only)…';

    try {
      const ffmpeg = await loadFfmpeg(msg => { statusText.textContent = msg.slice(0, 90); });
      statusText.textContent = 'Trimming…';
      const { fetchFile } = window.FFmpegUtil;
      const inName = 'input' + (currentFile.name.match(/\.[^.]+$/) || ['.mp4'])[0];
      await ffmpeg.writeFile(inName, await fetchFile(currentFile));
      await ffmpeg.exec(['-i', inName, '-ss', String(start), '-to', String(end), '-c', 'copy', 'output.mp4']);
      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      downloadBlob(blob, 'trimmed-video.mp4');
      showToast('Video trimmed and downloaded.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Trim failed: ' + (err && err.message ? err.message : 'unknown error') + '. Some codecs need a re-encode — try a shorter clip or a standard MP4/H.264 source.', 'error');
    } finally {
      btn.disabled = false;
      statusWrap.classList.add('hidden');
    }
  });
}

/* ============================================================
   VIDEO TOOL 2 — Resolution Resizer (crop + scale to 9:16)
   ============================================================ */

function renderVideoResizeTool(root) {
  root.innerHTML = `
    <h3 class="font-display font-semibold text-lg text-ink mb-1">Resolution Resizer</h3>
    <p class="text-xs text-dim mb-4">Center-crops and scales your clip to a vertical 9:16 frame (1080×1920), ready for Shorts/Reels.</p>
    <div id="vr-drop-wrap">${dropzoneMarkup('border-amber', 'Upload or drag & drop a video', 'MP4, MOV, or WebM')}</div>
    <input type="file" accept="video/*" class="hidden" id="vr-file-input">

    <div id="vr-controls" class="mt-4 hidden space-y-4">
      <video id="vr-preview" class="w-full rounded-lg bg-black" controls></video>
      <button id="vr-run-btn" class="w-full py-2.5 rounded-lg bg-amber text-sm font-semibold text-base hover:opacity-90 transition">Convert to 9:16</button>
      <div id="vr-status" class="hidden">
        <div class="flex items-center gap-2 text-xs text-dim mb-2"><span class="spinner"></span><span id="vr-status-text">Loading engine…</span></div>
        <div class="progress-track"><div class="progress-fill bg-amber scan-bar" style="width:100%"></div></div>
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
    btn.disabled = true;
    statusWrap.classList.remove('hidden');
    statusText.textContent = 'Loading engine (first run only)…';

    try {
      const ffmpeg = await loadFfmpeg(msg => { statusText.textContent = msg.slice(0, 90); });
      statusText.textContent = 'Converting to vertical 9:16…';
      const { fetchFile } = window.FFmpegUtil;
      const inName = 'input' + (currentFile.name.match(/\.[^.]+$/) || ['.mp4'])[0];
      await ffmpeg.writeFile(inName, await fetchFile(currentFile));
      await ffmpeg.exec(['-i', inName, '-vf', "crop=ih*9/16:ih,scale=1080:1920", '-c:a', 'copy', 'output.mp4']);
      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      downloadBlob(blob, 'vertical-video.mp4');
      showToast('Converted and downloaded.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Conversion failed: ' + (err && err.message ? err.message : 'unknown error'), 'error');
    } finally {
      btn.disabled = false;
      statusWrap.classList.add('hidden');
    }
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
      <button id="pms-merge-btn" class="mt-3 w-full py-2.5 rounded-lg bg-teal text-sm font-semibold text-base hover:opacity-90 transition hidden">Merge PDFs</button>
    </div>

    <div id="pms-split-panel" class="hidden">
      <div id="pms-split-drop">${dropzoneMarkup('border-teal', 'Upload or drag & drop a PDF', 'A ZIP with one PDF per page will be downloaded')}</div>
      <input type="file" accept="application/pdf" class="hidden" id="pms-split-input">
      <div id="pms-split-info" class="text-xs text-dim mt-3"></div>
      <button id="pms-split-btn" class="mt-3 w-full py-2.5 rounded-lg bg-teal text-sm font-semibold text-base hover:opacity-90 transition hidden">Split into Pages (.zip)</button>
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
    <button id="pc-run-btn" class="mt-3 w-full py-2.5 rounded-lg bg-teal text-sm font-semibold text-base hover:opacity-90 transition hidden">Compress PDF</button>
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
