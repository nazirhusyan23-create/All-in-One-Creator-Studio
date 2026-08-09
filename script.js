
/* ============================= LIBRARY SETUP ============================= */
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

/* ============================= UTILITIES ============================= */
function formatBytes(bytes) {
  if (!bytes) return '0 KB';
  const units = ['B','KB','MB','GB'];
  let i = 0; let val = bytes;
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++; }
  return `${val.toFixed(val < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}
function formatTime(s) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60); const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2,'0')}`;
}
function showToast(msg, tone) {
  const el = document.createElement('div');
  const colors = { violet: '#8B7CF6', amber: '#F5A524', teal: '#2DD4BF', danger:'#FB7185' };
  const c = colors[tone] || '#2DD4BF';
  el.className = 'toast pointer-events-auto max-w-xs w-full sm:w-auto rounded-lg border bg-elev2 px-4 py-3 text-sm shadow-xl flex items-center gap-2';
  el.style.borderColor = c + '55';
  el.innerHTML = `<span style="color:${c}">●</span><span class="text-ink">${msg}</span>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(-8px)'; }, 2600);
  setTimeout(() => el.remove(), 3000);
}
function simulateProgress(wrapEl, onDone, duration = 1400) {
  wrapEl.classList.remove('hidden');
  setTimeout(() => { wrapEl.classList.add('hidden'); onDone && onDone(); }, duration);
}
function initDropzone(dropEl, inputEl, onFile) {
  dropEl.addEventListener('click', (e) => { if (e.target !== inputEl) inputEl.click(); });
  ['dragenter','dragover'].forEach(ev => dropEl.addEventListener(ev, (e) => { e.preventDefault(); dropEl.classList.add('dragover'); }));
  ['dragleave','drop'].forEach(ev => dropEl.addEventListener(ev, (e) => { e.preventDefault(); dropEl.classList.remove('dragover'); }));
  dropEl.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files && files.length) onFile(inputEl.multiple ? files : files[0]);
  });
  inputEl.addEventListener('change', () => {
    if (!inputEl.files.length) return;
    onFile(inputEl.multiple ? inputEl.files : inputEl.files[0]);
  });
}
function demoDownload(btn, label, tone) {
  btn.addEventListener('click', () => showToast(`${label} — connect a backend to enable real file export.`, tone));
}

/* ============================= NAVIGATION ============================= */
const panels = { photo: document.getElementById('panel-photo'), video: document.getElementById('panel-video'), pdf: document.getElementById('panel-pdf') };
function setCategory(cat) {
  Object.entries(panels).forEach(([k, el]) => el.classList.toggle('active', k === cat));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
  document.querySelectorAll('.mnav').forEach(b => {
    const isActive = b.dataset.cat === cat;
    b.classList.toggle('active', isActive);
    b.classList.toggle('is-dim', !isActive);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.querySelectorAll('.nav-item, .mnav').forEach(btn => btn.addEventListener('click', () => setCategory(btn.dataset.cat)));

/* ============================= PHOTO: BACKGROUND REMOVER (mock) ============================= */
(() => {
  const drop = document.getElementById('bgr-drop');
  const input = document.getElementById('bgr-input');
  const canvasIn = document.getElementById('bgr-canvas-in');
  const canvasOut = document.getElementById('bgr-canvas-out');
  const placeholder = document.getElementById('bgr-placeholder');
  const runBtn = document.getElementById('bgr-run');
  const dlBtn = document.getElementById('bgr-download');
  const progress = document.getElementById('bgr-progress');
  let img = new Image();

  initDropzone(drop, input, (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      img = new Image();
      img.onload = () => {
        const ctx = canvasIn.getContext('2d');
        const maxW = drop.clientWidth, maxH = drop.clientHeight;
        const scale = Math.min(maxW / img.width, maxH / img.height);
        canvasIn.width = img.width * scale; canvasIn.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvasIn.width, canvasIn.height);
        canvasIn.classList.remove('hidden');
        drop.querySelector('svg').classList.add('hidden');
        drop.querySelector('p').classList.add('hidden');
        runBtn.disabled = false;
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  runBtn.addEventListener('click', () => {
    runBtn.disabled = true;
    simulateProgress(progress, () => {
      const ctx = canvasOut.getContext('2d');
      canvasOut.width = canvasIn.width; canvasOut.height = canvasIn.height;
      ctx.drawImage(canvasIn, 0, 0);
      ctx.globalCompositeOperation = 'destination-in';
      const g = ctx.createRadialGradient(canvasOut.width/2, canvasOut.height/2, canvasOut.width*0.12, canvasOut.width/2, canvasOut.height/2, canvasOut.width*0.62);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.75, 'rgba(255,255,255,1)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvasOut.width, canvasOut.height);
      ctx.globalCompositeOperation = 'source-over';
      canvasOut.classList.remove('hidden');
      placeholder.classList.add('hidden');
      dlBtn.disabled = false;
      runBtn.disabled = false;
      showToast('Background removed (demo preview)', 'violet');
    }, 1600);
  });

  dlBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'background-removed.png';
    link.href = canvasOut.toDataURL('image/png');
    link.click();
  });
})();

/* ============================= PHOTO: CROP & RESIZE ============================= */
(() => {
  const emptyEl = document.getElementById('crop-empty');
  const input = document.getElementById('crop-input');
  const workspace = document.getElementById('crop-workspace');
  const stage = document.getElementById('crop-stage');
  const imgEl = document.getElementById('crop-img');
  const box = document.getElementById('crop-box');
  const resizeHandle = document.getElementById('crop-resize');
  const wInput = document.getElementById('crop-w');
  const hInput = document.getElementById('crop-h');
  const lock = document.getElementById('crop-lock');
  const applyBtn = document.getElementById('crop-apply');
  const resetBtn = document.getElementById('crop-reset');
  const resultWrap = document.getElementById('crop-result');
  const resultCanvas = document.getElementById('crop-canvas');
  const resultDims = document.getElementById('crop-result-dims');
  const downloadLink = document.getElementById('crop-download');

  let natW = 0, natH = 0, scale = 1;
  let cbox = { x: 0, y: 0, w: 0, h: 0 };
  let ratio = 0;

  initDropzone(emptyEl, input, (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      imgEl.onload = () => {
        natW = imgEl.naturalWidth; natH = imgEl.naturalHeight;
        emptyEl.classList.add('hidden');
        workspace.classList.remove('hidden');
        requestAnimationFrame(() => {
          scale = stage.clientWidth / natW;
          stage.style.height = (natH * scale) + 'px';
          cbox = { x: stage.clientWidth * 0.15, y: (natH*scale) * 0.15, w: stage.clientWidth * 0.7, h: (natH*scale) * 0.7 };
          syncInputsFromBox();
          renderBox();
        });
      };
      imgEl.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  function clampBox() {
    const cw = stage.clientWidth, ch = stage.clientHeight;
    cbox.w = Math.min(cbox.w, cw); cbox.h = Math.min(cbox.h, ch);
    cbox.x = Math.max(0, Math.min(cbox.x, cw - cbox.w));
    cbox.y = Math.max(0, Math.min(cbox.y, ch - cbox.h));
  }
  function renderBox() {
    clampBox();
    box.style.left = cbox.x + 'px'; box.style.top = cbox.y + 'px';
    box.style.width = cbox.w + 'px'; box.style.height = cbox.h + 'px';
  }
  function syncInputsFromBox() {
    wInput.value = Math.round(cbox.w / scale);
    hInput.value = Math.round(cbox.h / scale);
  }

  // Move
  let dragging = null;
  box.addEventListener('pointerdown', (e) => {
    if (e.target === resizeHandle) return;
    dragging = { startX: e.clientX, startY: e.clientY, ox: cbox.x, oy: cbox.y };
    box.setPointerCapture(e.pointerId);
  });
  box.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    cbox.x = dragging.ox + (e.clientX - dragging.startX);
    cbox.y = dragging.oy + (e.clientY - dragging.startY);
    renderBox();
  });
  box.addEventListener('pointerup', () => { dragging = null; syncInputsFromBox(); });

  // Resize
  let resizing = null;
  resizeHandle.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    resizing = { startX: e.clientX, startY: e.clientY, ow: cbox.w, oh: cbox.h };
    resizeHandle.setPointerCapture(e.pointerId);
  });
  resizeHandle.addEventListener('pointermove', (e) => {
    if (!resizing) return;
    let nw = resizing.ow + (e.clientX - resizing.startX);
    let nh = ratio ? nw / ratio : resizing.oh + (e.clientY - resizing.startY);
    cbox.w = Math.max(30, nw); cbox.h = Math.max(30, nh);
    renderBox();
    syncInputsFromBox();
  });
  resizeHandle.addEventListener('pointerup', () => { resizing = null; });

  document.querySelectorAll('.ratio-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('border-violet','text-violet'));
      btn.classList.add('border-violet','text-violet');
      ratio = parseFloat(btn.dataset.ratio);
      if (ratio) { cbox.h = cbox.w / ratio; renderBox(); syncInputsFromBox(); lock.checked = true; }
      else { lock.checked = false; }
    });
  });

  function effectiveRatio() {
    return ratio || (cbox.h ? cbox.w / cbox.h : 1) || 1;
  }

  wInput.addEventListener('input', () => {
    const newW = Math.max(1, parseFloat(wInput.value) || 1) * scale;
    if (lock.checked) {
      const r = effectiveRatio();
      cbox.w = newW;
      cbox.h = newW / r;
    } else {
      cbox.w = newW;
    }
    renderBox();
    hInput.value = Math.round(cbox.h / scale);
  });
  hInput.addEventListener('input', () => {
    const newH = Math.max(1, parseFloat(hInput.value) || 1) * scale;
    if (lock.checked) {
      const r = effectiveRatio();
      cbox.h = newH;
      cbox.w = newH * r;
    } else {
      cbox.h = newH;
    }
    renderBox();
    wInput.value = Math.round(cbox.w / scale);
  });

  applyBtn.addEventListener('click', () => {
    const sx = cbox.x / scale, sy = cbox.y / scale, sw = cbox.w / scale, sh = cbox.h / scale;
    const outW = parseInt(wInput.value) || Math.round(sw);
    const outH = parseInt(hInput.value) || Math.round(sh);
    resultCanvas.width = outW; resultCanvas.height = outH;
    const ctx = resultCanvas.getContext('2d');
    ctx.drawImage(imgEl, sx, sy, sw, sh, 0, 0, outW, outH);
    resultWrap.classList.remove('hidden');
    resultDims.textContent = `${outW} × ${outH}px`;
    downloadLink.href = resultCanvas.toDataURL('image/png');
    showToast('Crop applied — result ready to download', 'violet');
  });

  resetBtn.addEventListener('click', () => {
    workspace.classList.add('hidden');
    resultWrap.classList.add('hidden');
    emptyEl.classList.remove('hidden');
    input.value = '';
  });
})();

/* ============================= PHOTO: FILTER & BRIGHTNESS ============================= */
(() => {
  const emptyEl = document.getElementById('filt-empty');
  const input = document.getElementById('filt-input');
  const workspace = document.getElementById('filt-workspace');
  const canvas = document.getElementById('filt-canvas');
  const ctx = canvas.getContext('2d');
  let img = new Image();

  const sliders = ['brightness','contrast','saturate','blur'].map(id => ({
    id, el: document.getElementById('filt-' + id), label: document.getElementById('filt-' + id + '-v')
  }));

  function draw() {
    const b = document.getElementById('filt-brightness').value;
    const c = document.getElementById('filt-contrast').value;
    const s = document.getElementById('filt-saturate').value;
    const bl = document.getElementById('filt-blur').value;
    document.getElementById('filt-brightness-v').textContent = b + '%';
    document.getElementById('filt-contrast-v').textContent = c + '%';
    document.getElementById('filt-saturate-v').textContent = s + '%';
    document.getElementById('filt-blur-v').textContent = bl + 'px';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%) blur(${bl}px)`;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }

  initDropzone(emptyEl, input, (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      img = new Image();
      img.onload = () => {
        const maxW = 640;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = img.width * scale; canvas.height = img.height * scale;
        emptyEl.classList.add('hidden');
        workspace.classList.remove('hidden');
        workspace.classList.add('grid');
        draw();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  sliders.forEach(s => s.el.addEventListener('input', draw));

  document.getElementById('filt-reset').addEventListener('click', () => {
    document.getElementById('filt-brightness').value = 100;
    document.getElementById('filt-contrast').value = 100;
    document.getElementById('filt-saturate').value = 100;
    document.getElementById('filt-blur').value = 0;
    draw();
  });

  document.getElementById('filt-download').addEventListener('click', (e) => {
    e.currentTarget.href = canvas.toDataURL('image/png');
  });
})();

/* ============================= VIDEO: TRIM & CUT ============================= */
(() => {
  const emptyEl = document.getElementById('trim-empty');
  const input = document.getElementById('trim-input');
  const workspace = document.getElementById('trim-workspace');
  const video = document.getElementById('trim-video');
  const startRange = document.getElementById('trim-start');
  const endRange = document.getElementById('trim-end');
  const fill = document.getElementById('trim-range-fill');
  const startLabel = document.getElementById('trim-start-label');
  const endLabel = document.getElementById('trim-end-label');
  const durLabel = document.getElementById('trim-duration-label');
  const progressWrap = document.getElementById('trim-progress-wrap');
  let duration = 0, previewing = false;

  initDropzone(emptyEl, input, (file) => {
    video.src = URL.createObjectURL(file);
    emptyEl.classList.add('hidden');
    workspace.classList.remove('hidden');
  });

  video.addEventListener('loadedmetadata', () => {
    duration = video.duration;
    startRange.value = 0; endRange.value = 100;
    updateLabels();
  });

  function updateLabels() {
    const s = (startRange.value / 100) * duration;
    const en = (endRange.value / 100) * duration;
    startLabel.textContent = formatTime(s);
    endLabel.textContent = formatTime(en);
    durLabel.textContent = 'selected: ' + formatTime(Math.max(0, en - s));
    fill.style.left = startRange.value + '%';
    fill.style.width = Math.max(0, endRange.value - startRange.value) + '%';
    startRange.style.zIndex = startRange.value > 90 ? 5 : 3;
    endRange.style.zIndex = endRange.value < 10 ? 5 : 4;
  }
  [startRange, endRange].forEach(r => r.addEventListener('input', () => {
    if (parseFloat(startRange.value) > parseFloat(endRange.value) - 2) {
      if (r === startRange) startRange.value = endRange.value - 2 < 0 ? 0 : +endRange.value - 2;
      else endRange.value = +startRange.value + 2 > 100 ? 100 : +startRange.value + 2;
    }
    updateLabels();
  }));

  document.getElementById('trim-set-start').addEventListener('click', () => {
    startRange.value = (video.currentTime / duration) * 100; updateLabels();
  });
  document.getElementById('trim-set-end').addEventListener('click', () => {
    endRange.value = (video.currentTime / duration) * 100; updateLabels();
  });

  document.getElementById('trim-preview').addEventListener('click', () => {
    const s = (startRange.value / 100) * duration;
    const en = (endRange.value / 100) * duration;
    video.currentTime = s;
    video.play();
    previewing = true;
    const onTime = () => {
      if (!previewing) return;
      if (video.currentTime >= en) { video.pause(); previewing = false; video.removeEventListener('timeupdate', onTime); }
    };
    video.addEventListener('timeupdate', onTime);
  });

  document.getElementById('trim-export').addEventListener('click', () => {
    simulateProgress(progressWrap, () => showToast('Trimmed clip ready — export requires a backend in this demo.', 'amber'), 1500);
  });
})();

/* ============================= VIDEO: TO GIF ============================= */
(() => {
  const emptyEl = document.getElementById('gif-empty');
  const input = document.getElementById('gif-input');
  const videoEl = document.getElementById('gif-video');
  const thumb = document.getElementById('gif-thumb');
  const placeholder = document.getElementById('gif-placeholder');
  const runBtn = document.getElementById('gif-run');
  const dlBtn = document.getElementById('gif-download');
  const progress = document.getElementById('gif-progress');
  const badge = document.getElementById('gif-badge');

  document.getElementById('gif-fps').addEventListener('input', (e) => document.getElementById('gif-fps-v').textContent = e.target.value);
  document.getElementById('gif-quality').addEventListener('input', (e) => {
    document.getElementById('gif-quality-v').textContent = ['Low','Medium','High'][e.target.value - 1];
  });

  initDropzone(emptyEl, input, (file) => {
    videoEl.src = URL.createObjectURL(file);
    videoEl.classList.remove('hidden');
    emptyEl.querySelector('svg').classList.add('hidden');
    emptyEl.querySelector('p').classList.add('hidden');
    runBtn.disabled = false;
    videoEl.addEventListener('loadeddata', () => { videoEl.currentTime = 0.1; }, { once: true });
  });

  runBtn.addEventListener('click', () => {
    runBtn.disabled = true;
    simulateProgress(progress, () => {
      const ctx = thumb.getContext('2d');
      thumb.width = 320; thumb.height = 180;
      try { ctx.drawImage(videoEl, 0, 0, thumb.width, thumb.height); } catch (e) {}
      thumb.classList.remove('hidden');
      placeholder.classList.add('hidden');
      badge.classList.remove('hidden');
      dlBtn.disabled = false;
      runBtn.disabled = false;
      showToast('GIF generated (demo preview)', 'amber');
    }, 1800);
  });

  demoDownload(dlBtn, 'GIF export', 'amber');
})();

/* ============================= VIDEO: SPEED CONTROLLER ============================= */
(() => {
  const emptyEl = document.getElementById('speed-empty');
  const input = document.getElementById('speed-input');
  const workspace = document.getElementById('speed-workspace');
  const video = document.getElementById('speed-video');
  const range = document.getElementById('speed-range');
  const current = document.getElementById('speed-current');

  initDropzone(emptyEl, input, (file) => {
    video.src = URL.createObjectURL(file);
    emptyEl.classList.add('hidden');
    workspace.classList.remove('hidden');
  });

  function setSpeed(v) {
    video.playbackRate = parseFloat(v);
    current.textContent = parseFloat(v).toFixed(2) + 'x';
    range.value = v;
  }
  range.addEventListener('input', () => setSpeed(range.value));
  document.querySelectorAll('.speed-preset').forEach(btn => btn.addEventListener('click', () => setSpeed(btn.dataset.speed)));
})();

/* ============================= PDF: TO WORD / IMAGE / EXCEL (real conversion) ============================= */
(() => {
  const emptyEl = document.getElementById('p2x-empty');
  const input = document.getElementById('p2x-input');
  const workspace = document.getElementById('p2x-workspace');
  const nameEl = document.getElementById('p2x-name');
  const sizeEl = document.getElementById('p2x-size');
  const clearBtn = document.getElementById('p2x-clear');
  const format = document.getElementById('p2x-format');
  const runBtn = document.getElementById('p2x-run');
  const progressWrap = document.getElementById('p2x-progress-wrap');
  const result = document.getElementById('p2x-result');
  const resultName = document.getElementById('p2x-result-name');
  const downloadBtn = document.getElementById('p2x-download');

  let currentFile = null;
  let outputBlob = null;
  let outputName = '';

  initDropzone(emptyEl, input, (file) => {
    currentFile = file;
    nameEl.textContent = file.name;
    sizeEl.textContent = formatBytes(file.size);
    emptyEl.classList.add('hidden');
    workspace.classList.remove('hidden');
    result.classList.add('hidden');
    outputBlob = null;
  });

  clearBtn.addEventListener('click', () => {
    workspace.classList.add('hidden');
    emptyEl.classList.remove('hidden');
    input.value = '';
    currentFile = null;
    outputBlob = null;
    result.classList.add('hidden');
  });

  // Groups text items on a PDF page into visual lines using their baseline Y position.
  function groupTextIntoLines(items) {
    const lines = [];
    let currentY = null;
    let currentLine = [];
    items.forEach((item) => {
      const y = item.transform[5];
      if (currentY !== null && Math.abs(y - currentY) > 2) {
        const text = currentLine.join(' ').replace(/\s+/g, ' ').trim();
        if (text) lines.push(text);
        currentLine = [];
      }
      currentLine.push(item.str);
      currentY = y;
    });
    const lastText = currentLine.join(' ').replace(/\s+/g, ' ').trim();
    if (lastText) lines.push(lastText);
    return lines;
  }

  async function readPdf(file) {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      pages.push({ page, lines: groupTextIntoLines(textContent.items) });
    }
    return pages;
  }

  function renderPageToBlob(page, mime) {
    return new Promise(async (resolve, reject) => {
      try {
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('canvas export failed'))), mime, 0.92);
      } catch (err) { reject(err); }
    });
  }

  async function buildDocx(pages, baseName) {
    const { Document, Packer, Paragraph, TextRun, PageBreak } = docx;
    const children = [];
    pages.forEach((p, idx) => {
      if (idx > 0) children.push(new Paragraph({ children: [new PageBreak()] }));
      if (!p.lines.length) {
        children.push(new Paragraph({ children: [new TextRun({ text: `(No selectable text found on page ${idx + 1} — it may be a scanned image.)`, italics: true })] }));
      } else {
        p.lines.forEach((line) => children.push(new Paragraph({ children: [new TextRun(line)] })));
      }
    });
    const doc = new Document({ sections: [{ properties: {}, children }] });
    const blob = await Packer.toBlob(doc);
    return { blob, name: `${baseName}.docx` };
  }

  function buildXlsx(pages, baseName) {
    const wb = XLSX.utils.book_new();
    pages.forEach((p, idx) => {
      const rows = p.lines.length ? p.lines.map((l) => [l]) : [['(no selectable text found)']];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, `Page ${idx + 1}`.slice(0, 31));
    });
    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return { blob: new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), name: `${baseName}.xlsx` };
  }

  async function buildImages(pages, baseName, mime, ext) {
    if (pages.length === 1) {
      const blob = await renderPageToBlob(pages[0].page, mime);
      return { blob, name: `${baseName}.${ext}` };
    }
    const zip = new JSZip();
    for (let i = 0; i < pages.length; i++) {
      const blob = await renderPageToBlob(pages[i].page, mime);
      zip.file(`${baseName}-page-${i + 1}.${ext}`, blob);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return { blob: zipBlob, name: `${baseName}.zip` };
  }

  runBtn.addEventListener('click', async () => {
    if (!currentFile) return;
    if (!window.pdfjsLib) { showToast('PDF engine failed to load — check your internet connection', 'danger'); return; }
    result.classList.add('hidden');
    outputBlob = null;
    runBtn.disabled = true;
    progressWrap.classList.remove('hidden');
    try {
      const baseName = (currentFile.name || 'document').replace(/\.pdf$/i, '') || 'document';
      const pages = await readPdf(currentFile);
      let out;
      if (format.value === 'docx') out = await buildDocx(pages, baseName);
      else if (format.value === 'xlsx') out = buildXlsx(pages, baseName);
      else if (format.value === 'jpg') out = await buildImages(pages, baseName, 'image/jpeg', 'jpg');
      else out = await buildImages(pages, baseName, 'image/png', 'png');

      outputBlob = out.blob;
      outputName = out.name;
      resultName.textContent = outputName;
      result.classList.remove('hidden');
      showToast('Conversion complete', 'teal');
    } catch (err) {
      console.error(err);
      showToast('Could not read this PDF — it may be encrypted, scanned, or corrupted.', 'danger');
    } finally {
      progressWrap.classList.add('hidden');
      runBtn.disabled = false;
    }
  });

  downloadBtn.addEventListener('click', () => {
    if (!outputBlob) return;
    const url = URL.createObjectURL(outputBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = outputName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  });
})();

/* ============================= PDF: MERGE ============================= */
(() => {
  const drop = document.getElementById('merge-drop');
  const input = document.getElementById('merge-input');
  const list = document.getElementById('merge-list');
  const footer = document.getElementById('merge-footer');
  const totalEl = document.getElementById('merge-total');
  const sizeEl = document.getElementById('merge-size');
  const runBtn = document.getElementById('merge-run');
  const progressWrap = document.getElementById('merge-progress-wrap');
  const result = document.getElementById('merge-result');
  const downloadBtn = document.getElementById('merge-download');
  let files = [];

  initDropzone(drop, input, (fileList) => {
    files = files.concat(Array.from(fileList));
    render();
  });

  function render() {
    list.innerHTML = '';
    files.forEach((f, i) => {
      const li = document.createElement('li');
      li.className = 'flex items-center gap-2.5 rounded-lg border border-brd bg-elev2 px-3 py-2';
      li.innerHTML = `
        <span class="font-mono text-[11px] text-faint w-5">${i + 1}</span>
        <svg class="w-4 h-4 text-teal shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path d="M14 2v5h5"/></svg>
        <span class="text-sm truncate flex-1">${f.name}</span>
        <span class="text-[11px] text-faint font-mono shrink-0">${formatBytes(f.size)}</span>
        <button data-i="${i}" data-act="up" class="text-faint hover:text-ink text-xs px-1">↑</button>
        <button data-i="${i}" data-act="down" class="text-faint hover:text-ink text-xs px-1">↓</button>
        <button data-i="${i}" data-act="del" class="text-faint hover:text-danger text-xs px-1">✕</button>
      `;
      list.appendChild(li);
    });
    footer.classList.toggle('hidden', files.length === 0);
    totalEl.textContent = files.length;
    sizeEl.textContent = formatBytes(files.reduce((a, f) => a + f.size, 0));
    result.classList.add('hidden');
  }

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const i = parseInt(btn.dataset.i);
    if (btn.dataset.act === 'up' && i > 0) [files[i - 1], files[i]] = [files[i], files[i - 1]];
    if (btn.dataset.act === 'down' && i < files.length - 1) [files[i + 1], files[i]] = [files[i], files[i + 1]];
    if (btn.dataset.act === 'del') files.splice(i, 1);
    render();
  });

  runBtn.addEventListener('click', () => {
    if (files.length < 2) { showToast('Add at least two PDFs to merge', 'danger'); return; }
    simulateProgress(progressWrap, () => {
      result.classList.remove('hidden');
      showToast('PDFs merged successfully', 'teal');
    }, 1700);
  });

  demoDownload(downloadBtn, 'Merged PDF', 'teal');
})();

/* ============================= PDF: COMPRESS ============================= */
(() => {
  const emptyEl = document.getElementById('comp-empty');
  const input = document.getElementById('comp-input');
  const workspace = document.getElementById('comp-workspace');
  const nameEl = document.getElementById('comp-name');
  const sizeEl = document.getElementById('comp-size');
  const clearBtn = document.getElementById('comp-clear');
  const level = document.getElementById('comp-level');
  const runBtn = document.getElementById('comp-run');
  const progressWrap = document.getElementById('comp-progress-wrap');
  const result = document.getElementById('comp-result');
  const originalSizeEl = document.getElementById('comp-original-size');
  const newSizeEl = document.getElementById('comp-new-size');
  const downloadBtn = document.getElementById('comp-download');
  let currentFile = null;

  initDropzone(emptyEl, input, (file) => {
    currentFile = file;
    nameEl.textContent = file.name;
    sizeEl.textContent = formatBytes(file.size);
    emptyEl.classList.add('hidden');
    workspace.classList.remove('hidden');
    result.classList.add('hidden');
  });

  clearBtn.addEventListener('click', () => {
    workspace.classList.add('hidden');
    emptyEl.classList.remove('hidden');
    input.value = '';
  });

  runBtn.addEventListener('click', () => {
    if (!currentFile) return;
    result.classList.add('hidden');
    simulateProgress(progressWrap, () => {
      const reductions = { 1: 0.22, 2: 0.45, 3: 0.68 };
      const reduction = reductions[level.value];
      const newSize = currentFile.size * (1 - reduction);
      originalSizeEl.textContent = formatBytes(currentFile.size);
      newSizeEl.textContent = formatBytes(newSize);
      result.classList.remove('hidden');
      showToast(`Estimated ${Math.round(reduction * 100)}% smaller`, 'teal');
    }, 1600);
  });

  demoDownload(downloadBtn, 'Compressed PDF', 'teal');
})();

/* ============================= PDF: PASSWORD PROTECT / UNLOCK ============================= */
(() => {
  // tabs
  document.querySelectorAll('.pptab').forEach(tab => tab.addEventListener('click', () => {
    document.querySelectorAll('.pptab').forEach(t => { t.classList.remove('active'); t.classList.add('text-dim'); });
    tab.classList.add('active'); tab.classList.remove('text-dim');
    document.getElementById('pp-protect').classList.toggle('hidden', tab.dataset.pptab !== 'protect');
    document.getElementById('pp-protect').classList.toggle('flex', tab.dataset.pptab === 'protect');
    document.getElementById('pp-unlock').classList.toggle('hidden', tab.dataset.pptab !== 'unlock');
    document.getElementById('pp-unlock').classList.toggle('flex', tab.dataset.pptab === 'unlock');
  }));

  // Protect
  const protDrop = document.getElementById('prot-drop');
  const protInput = document.getElementById('prot-input');
  const protDropText = document.getElementById('prot-drop-text');
  const protFileNote = () => {};
  initDropzone(protDrop, protInput, (file) => { protDropText.innerHTML = `<span class="text-teal font-medium">${file.name}</span> selected`; });

  const passEl = document.getElementById('prot-pass');
  const confirmEl = document.getElementById('prot-confirm');
  const toggleBtn = document.getElementById('prot-toggle');
  const strengthBar = document.getElementById('strength-bar');
  const strengthLabel = document.getElementById('strength-label');

  toggleBtn.addEventListener('click', () => {
    const show = passEl.type === 'password';
    passEl.type = show ? 'text' : 'password';
    confirmEl.type = show ? 'text' : 'password';
    toggleBtn.textContent = show ? 'Hide' : 'Show';
  });

  function scorePassword(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  }
  passEl.addEventListener('input', () => {
    const score = scorePassword(passEl.value);
    const pct = passEl.value.length ? Math.min(100, (score / 5) * 100) : 0;
    strengthBar.style.width = pct + '%';
    const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
    strengthBar.className = 'h-full transition-all ' + (score <= 1 ? 'bg-danger' : score <= 3 ? 'bg-amber' : 'bg-teal');
    strengthLabel.textContent = passEl.value ? labels[score] : 'Password strength';
  });

  const protRun = document.getElementById('prot-run');
  const protProgress = document.getElementById('prot-progress-wrap');
  const protResult = document.getElementById('prot-result');
  protRun.addEventListener('click', () => {
    if (!protInput.files.length) { showToast('Choose a PDF first', 'danger'); return; }
    if (!passEl.value || passEl.value.length < 4) { showToast('Enter a password with at least 4 characters', 'danger'); return; }
    if (passEl.value !== confirmEl.value) { showToast('Passwords do not match', 'danger'); return; }
    protResult.classList.add('hidden');
    simulateProgress(protProgress, () => {
      protResult.classList.remove('hidden');
      showToast('PDF protected with password', 'teal');
    }, 1400);
  });
  demoDownload(document.getElementById('prot-download'), 'Protected PDF', 'teal');

  // Unlock
  const unlockDrop = document.getElementById('unlock-drop');
  const unlockInput = document.getElementById('unlock-input');
  const unlockDropText = document.getElementById('unlock-drop-text');
  initDropzone(unlockDrop, unlockInput, (file) => { unlockDropText.innerHTML = `<span class="text-teal font-medium">${file.name}</span> selected`; });

  const unlockRun = document.getElementById('unlock-run');
  const unlockProgress = document.getElementById('unlock-progress-wrap');
  const unlockResult = document.getElementById('unlock-result');
  unlockRun.addEventListener('click', () => {
    if (!unlockInput.files.length) { showToast('Choose a PDF first', 'danger'); return; }
    if (!document.getElementById('unlock-pass').value) { showToast('Enter the current password', 'danger'); return; }
    unlockResult.classList.add('hidden');
    simulateProgress(unlockProgress, () => {
      unlockResult.classList.remove('hidden');
      showToast('PDF unlocked', 'teal');
    }, 1400);
  });
  demoDownload(document.getElementById('unlock-download'), 'Unlocked PDF', 'teal');
})();
