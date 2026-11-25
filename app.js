'use strict';

const CONFIG = {
  /* Isi URL Web App Apps Script di sini (diakhiri /exec) agar langsung terhubung.
     Bisa juga diatur lewat tombol Pengaturan di dalam aplikasi. */
  API_URL: '',
};

const LS = {
  api: 'purnomo.apiUrl',
  cache: 'purnomo.cache',
  demo: 'purnomo.demo',
};

const state = {
  apiUrl: '',
  mode: 'loading', // loading | sheet | demo | offline
  items: [],
  search: '',
  filter: 'semua',
  editingId: null,
  formNotaUrl: '',
  formNotaData: '',
};

const ICONS = {
  check:
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
  edit:
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  trash:
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>',
};

const DEMO_NOTA = (() => {
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 380'>" +
    "<rect width='300' height='380' rx='10' fill='#fffdf6'/>" +
    "<rect x='24' y='24' width='252' height='332' rx='6' fill='none' stroke='#e3d9c4' stroke-dasharray='6 6'/>" +
    "<text x='150' y='66' text-anchor='middle' font-family='Georgia,serif' font-size='22' fill='#2b2620'>TOKO PURNOMO</text>" +
    "<text x='150' y='90' text-anchor='middle' font-family='monospace' font-size='11' fill='#8a8071'>NOTA PENJUALAN</text>" +
    "<line x1='40' y1='110' x2='260' y2='110' stroke='#e3d9c4'/>" +
    "<text x='40' y='140' font-family='monospace' font-size='13' fill='#3a342c'>Pulpen</text>" +
    "<text x='260' y='140' text-anchor='end' font-family='monospace' font-size='13' fill='#3a342c'>1.000</text>" +
    "<text x='40' y='170' font-family='monospace' font-size='13' fill='#3a342c'>DP</text>" +
    "<text x='260' y='170' text-anchor='end' font-family='monospace' font-size='13' fill='#3a342c'>50</text>" +
    "<line x1='40' y1='196' x2='260' y2='196' stroke='#e3d9c4'/>" +
    "<text x='40' y='226' font-family='monospace' font-size='13' fill='#b23b3b'>Sisa</text>" +
    "<text x='260' y='226' text-anchor='end' font-family='monospace' font-size='13' fill='#b23b3b'>950</text>" +
    "<text x='150' y='330' text-anchor='middle' font-family='monospace' font-size='11' fill='#8a8071'>Terima kasih</text>" +
    '</svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
})();

const DEMO_SEED = [
  { id: 'demo-1', nama: 'Pulpen', harga: 1000, dp: 50, bukti: DEMO_NOTA, tanggal: '2026-11-25 09:12' },
  { id: 'demo-2', nama: 'Buku tulis 38 lembar', harga: 5000, dp: 5000, bukti: '', tanggal: '2026-11-24 15:40' },
  { id: 'demo-3', nama: 'Tas selempang', harga: 45000, dp: 20000, bukti: '', tanggal: '2026-11-22 10:05' },
];

/* ---------- Element refs ---------- */

const $ = (id) => document.getElementById(id);

const el = {
  body: $('tableBody'),
  foot: $('tableFoot'),
  chip: $('connChip'),
  notice: $('notice'),
  noticeText: $('noticeText'),
  btnConnect: $('btnConnect'),
  btnAdd: $('btnAdd'),
  btnSettings: $('btnSettings'),
  search: $('searchInput'),
  statCount: $('statCount'),
  statTotal: $('statTotal'),
  statPaid: $('statPaid'),
  statDue: $('statDue'),
  statDueFoot: $('statDueFoot'),
  itemDialog: $('itemDialog'),
  itemForm: $('itemForm'),
  itemTitle: $('itemDialogTitle'),
  fNama: $('fNama'),
  fHarga: $('fHarga'),
  fDp: $('fDp'),
  fNota: $('fNota'),
  fStatusHint: $('fStatusHint'),
  notaName: $('notaName'),
  notaPreview: $('notaPreview'),
  notaPreviewImg: $('notaPreviewImg'),
  formError: $('formError'),
  btnSave: $('btnSave'),
  btnPickNota: $('btnPickNota'),
  btnClearNota: $('btnClearNota'),
  settingsDialog: $('settingsDialog'),
  settingsForm: $('settingsForm'),
  fApiUrl: $('fApiUrl'),
  settingsError: $('settingsError'),
  btnDemoMode: $('btnDemoMode'),
  previewDialog: $('previewDialog'),
  previewImg: $('previewImg'),
  previewLink: $('previewLink'),
  toast: $('toast'),
};

/* ---------- Helpers ---------- */

const rupiahFmt = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

function rupiah(n) {
  return rupiahFmt.format(Number(n) || 0);
}

function localStamp() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return (
    date.getFullYear() +
    '-' + pad(date.getMonth() + 1) +
    '-' + pad(date.getDate()) +
    ' ' + pad(date.getHours()) +
    ':' + pad(date.getMinutes()) +
    ':' + pad(date.getSeconds())
  );
}

function sortNewest(items) {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const ta = a.item.tanggal || '';
      const tb = b.item.tanggal || '';
      if (ta !== tb) {
        if (!ta) return 1;
        if (!tb) return -1;
        return tb.localeCompare(ta);
      }
      return b.index - a.index;
    })
    .map((entry) => entry.item);
}

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}

function safeUrl(raw) {
  const url = String(raw || '').trim();
  if (!url) return '';
  return /^(https?:\/\/|data:image\/)/i.test(url) ? url : '';
}

function isLunas(item) {
  return item.harga <= 0 || item.dp >= item.harga;
}

function sisaOf(item) {
  return Math.max(0, item.harga - item.dp);
}

function normalize(raw) {
  if (!raw) return null;
  const nama = String(raw.nama || '').trim();
  if (!nama) return null;
  const harga = Math.max(0, Number(raw.harga) || 0);
  const dp = Math.min(harga, Math.max(0, Number(raw.dp) || 0));
  return {
    id: String(raw.id || ''),
    nama,
    harga,
    dp,
    bukti: typeof raw.bukti === 'string' ? raw.bukti : '',
    tanggal: String(raw.tanggal || ''),
  };
}

function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    return null;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    return false;
  }
}

function storageRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    /* abaikan */
  }
}

function readCache() {
  try {
    const parsed = JSON.parse(storageGet(LS.cache) || 'null');
    return Array.isArray(parsed) ? parsed.map(normalize).filter(Boolean) : null;
  } catch (err) {
    return null;
  }
}

function writeCache(items) {
  storageSet(LS.cache, JSON.stringify(items));
}

function readDemo() {
  try {
    const parsed = JSON.parse(storageGet(LS.demo) || 'null');
    if (Array.isArray(parsed)) return parsed.map(normalize).filter(Boolean);
  } catch (err) {
    /* pakai data awal */
  }
  return DEMO_SEED.map((item) => ({ ...item }));
}

function writeDemo(items) {
  if (!storageSet(LS.demo, JSON.stringify(items))) {
    throw new Error('Penyimpanan perangkat penuh. Hapus beberapa gambar nota.');
  }
}

let toastTimer = null;
function toast(message, isError = false) {
  el.toast.textContent = message;
  el.toast.classList.toggle('toast--error', Boolean(isError));
  el.toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove('is-visible'), 3600);
}

/* ---------- API ---------- */

async function api(action, payload = {}) {
  const url = state.apiUrl;
  if (!url) throw new Error('URL Google Apps Script belum diatur');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);

  try {
    let res;
    if (action === 'list') {
      const sep = url.includes('?') ? '&' : '?';
      res = await fetch(url + sep + 'action=list&t=' + Date.now(), {
        cache: 'no-store',
        signal: controller.signal,
      });
    } else {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, ...payload }),
        signal: controller.signal,
      });
    }
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Waktu koneksi habis. Coba lagi.');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/* ---------- Data loading ---------- */

async function load() {
  if (!state.apiUrl) {
    state.items = readDemo();
    state.mode = 'demo';
    render();
    return;
  }

  state.mode = 'loading';
  render();

  try {
    const res = await api('list');
    if (!res || !res.ok) throw new Error((res && res.error) || 'Gagal memuat data');
    state.items = (res.items || []).map(normalize).filter(Boolean);
    state.mode = 'sheet';
    writeCache(state.items);
  } catch (err) {
    const cached = readCache();
    state.items = cached || [];
    state.mode = 'offline';
    toast(
      cached
        ? 'Gagal terhubung ke Google Sheet. Menampilkan data terakhir.'
        : 'Gagal terhubung ke Google Sheet. Periksa URL Web App dan pastikan akses "Anyone".',
      true
    );
  }

  render();
}

/* ---------- Mutations ---------- */

async function submitItem(fields, id) {
  if (state.mode === 'demo') {
    if (id) {
      const index = state.items.findIndex((item) => item.id === id);
      if (index < 0) throw new Error('Barang tidak ditemukan');
      state.items[index] = { ...state.items[index], ...fields };
    } else {
      state.items.push({
        id: 'demo-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        ...fields,
        tanggal: localStamp(),
      });
    }
    writeDemo(state.items);
    return;
  }

  if (state.mode !== 'sheet') {
    throw new Error('Tidak bisa menyimpan saat luring. Muat ulang halaman.');
  }

  const res = await api(id ? 'update' : 'add', {
    item: id ? { id, ...fields } : { ...fields },
  });
  if (!res || !res.ok) throw new Error((res && res.error) || 'Gagal menyimpan');

  const saved = normalize(res.item);
  if (id) {
    const index = state.items.findIndex((item) => item.id === id);
    if (index >= 0) {
      state.items[index] = saved || { ...state.items[index], ...fields };
    }
  } else if (saved) {
    state.items.push(saved);
  }
  writeCache(state.items);
}

async function removeItem(id) {
  const item = state.items.find((entry) => entry.id === id);
  if (!item) return;
  if (!window.confirm('Hapus "' + item.nama + '"?\nBukti nota juga ikut dihapus.')) return;

  try {
    if (state.mode === 'demo') {
      state.items = state.items.filter((entry) => entry.id !== id);
      writeDemo(state.items);
    } else if (state.mode === 'sheet') {
      const res = await api('delete', { id });
      if (!res || !res.ok) throw new Error((res && res.error) || 'Gagal menghapus');
      state.items = state.items.filter((entry) => entry.id !== id);
      writeCache(state.items);
    } else {
      throw new Error('Tidak bisa menghapus saat luring. Muat ulang halaman.');
    }
    render();
    toast('Barang dihapus');
  } catch (err) {
    toast(err.message, true);
  }
}

async function lunasiItem(id) {
  const item = state.items.find((entry) => entry.id === id);
  if (!item || isLunas(item)) return;

  try {
    await submitItem(
      { nama: item.nama, harga: item.harga, dp: item.harga, bukti: item.bukti },
      item.id
    );
    render();
    toast('"' + item.nama + '" ditandai lunas');
  } catch (err) {
    toast(err.message, true);
  }
}

/* ---------- Rendering ---------- */

const MODE_INFO = {
  loading: { text: 'Memuat…', cls: '' },
  sheet: { text: 'Terhubung Google Sheet', cls: 'chip--live' },
  demo: { text: 'Mode demo', cls: 'chip--demo' },
  offline: { text: 'Luring', cls: 'chip--error' },
};

function render() {
  const info = MODE_INFO[state.mode] || MODE_INFO.loading;
  el.chip.textContent = info.text;
  el.chip.className = 'chip' + (info.cls ? ' ' + info.cls : '');
  el.chip.title =
    state.mode === 'sheet'
      ? 'Data dimuat dari Google Sheets'
      : state.mode === 'offline'
        ? 'Gagal terhubung; menampilkan data terakhir dari perangkat'
        : 'Data disimpan di browser ini saja';

  el.notice.hidden = state.mode === 'sheet' || state.mode === 'loading';
  if (state.mode === 'demo') {
    el.noticeText.textContent =
      'Mode demo: data hanya tersimpan di browser ini. Hubungkan Google Sheet agar tersimpan permanen.';
    el.btnConnect.textContent = 'Hubungkan Google Sheet';
  } else if (state.mode === 'offline') {
    el.noticeText.textContent = state.items.length
      ? 'Tidak dapat terhubung ke Google Sheet. Menampilkan data terakhir di perangkat — perubahan belum tentu tersimpan.'
      : 'Tidak dapat terhubung ke Google Sheet. Periksa URL Web App dan pastikan akses "Anyone".';
    el.btnConnect.textContent = 'Coba muat ulang';
  }

  el.btnAdd.disabled = state.mode === 'loading' || state.mode === 'offline';

  renderStats();
  renderRows();
}

function renderStats() {
  let total = 0;
  let paid = 0;
  let due = 0;
  let unpaid = 0;

  for (const item of state.items) {
    total += item.harga;
    paid += Math.min(item.dp, item.harga);
    due += sisaOf(item);
    if (!isLunas(item)) unpaid += 1;
  }

  el.statCount.textContent = String(state.items.length);
  el.statTotal.textContent = rupiah(total);
  el.statPaid.textContent = rupiah(paid);
  el.statDue.textContent = rupiah(due);
  el.statDueFoot.textContent = unpaid + ' barang belum lunas';
}

function notaCell(item) {
  const url = safeUrl(item.bukti);
  if (!url) return '<span class="no-nota">—</span>';
  return (
    '<button type="button" class="thumb" data-preview="' +
    esc(url) +
    '" aria-label="Lihat bukti nota ' +
    esc(item.nama) +
    '">' +
    '<img src="' + esc(url) + '" alt="Nota ' + esc(item.nama) + '" loading="lazy" />' +
    '</button>'
  );
}

function rowHtml(item, no) {
  const lunas = isLunas(item);
  const sisa = sisaOf(item);

  return (
    '<tr data-id="' + esc(item.id) + '">' +
    '<td class="col-no" data-label="No">' + no + '</td>' +
    '<td class="name" data-label="Nama barang">' + esc(item.nama) + '</td>' +
    '<td class="num price" data-label="Harga">' + rupiah(item.harga) + '</td>' +
    '<td class="num" data-label="DP">' + rupiah(item.dp) + '</td>' +
    '<td class="num' + (sisa > 0 ? ' price--due' : '') + '" data-label="Sisa">' +
    (sisa > 0 ? rupiah(sisa) : '—') +
    '</td>' +
    '<td data-label="Status"><span class="badge badge--' + (lunas ? 'paid' : 'unpaid') + '">' +
    (lunas ? 'Lunas' : 'Belum lunas') +
    '</span></td>' +
    '<td class="center" data-label="Bukti nota">' + notaCell(item) + '</td>' +
    '<td class="actions-cell" data-label="Aksi"><div class="actions">' +
    (lunas
      ? ''
      : '<button type="button" class="icon-btn" data-action="lunasi" title="Tandai lunas" aria-label="Tandai lunas ' +
        esc(item.nama) + '">' + ICONS.check + '</button>') +
    '<button type="button" class="icon-btn" data-action="edit" title="Edit" aria-label="Edit ' +
    esc(item.nama) + '">' + ICONS.edit + '</button>' +
    '<button type="button" class="icon-btn icon-btn--danger" data-action="delete" title="Hapus" aria-label="Hapus ' +
    esc(item.nama) + '">' + ICONS.trash + '</button>' +
    '</div></td>' +
    '</tr>'
  );
}

function renderRows() {
  if (state.mode === 'loading') {
    el.body.innerHTML =
      '<tr class="loading-row"><td colspan="8">Memuat data <span class="loading-dots"></span></td></tr>';
    el.foot.hidden = true;
    return;
  }

  if (state.items.length === 0) {
    const cta =
      state.mode === 'offline'
        ? '<button type="button" class="btn btn--primary" data-action="retry">Coba muat ulang</button>'
        : '<button type="button" class="btn btn--primary" data-action="add">Tambah barang pertama</button>';
    el.body.innerHTML =
      '<tr class="empty-row"><td colspan="8"><div class="empty">' +
      '<div class="empty__icon"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2h9l4 4v16H6z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg></div>' +
      '<p class="empty__title">Belum ada barang</p>' +
      '<p class="empty__text">Catat barang, harga, DP, dan lampirkan foto nota. Status lunas dihitung otomatis.</p>' +
      cta +
      '</div></td></tr>';
    el.foot.hidden = true;
    return;
  }

  const query = state.search.trim().toLowerCase();
  const rows = [];

  sortNewest(state.items).forEach((item, index) => {
    if (query && !item.nama.toLowerCase().includes(query)) return;
    const lunas = isLunas(item);
    if (state.filter === 'lunas' && !lunas) return;
    if (state.filter === 'belum' && lunas) return;
    rows.push(rowHtml(item, index + 1));
  });

  if (rows.length === 0) {
    el.body.innerHTML =
      '<tr class="empty-row"><td colspan="8"><div class="empty">' +
      '<p class="empty__title">Tidak ada yang cocok</p>' +
      '<p class="empty__text">Coba kata kunci lain atau ubah filter status.</p>' +
      '</div></td></tr>';
    el.foot.hidden = true;
    return;
  }

  el.body.innerHTML = rows.join('');
  el.foot.hidden = false;
  el.foot.textContent =
    'Menampilkan ' + rows.length + ' dari ' + state.items.length + ' barang · terbaru di atas';

  el.body.querySelectorAll('.thumb img').forEach((img) => {
    img.addEventListener('error', () => {
      const thumb = img.closest('.thumb');
      if (thumb) thumb.outerHTML = '<span class="no-nota">Gagal dimuat</span>';
    });
  });
}

/* ---------- Item dialog ---------- */

function resetForm() {
  state.editingId = null;
  state.formNotaUrl = '';
  state.formNotaData = '';
  el.itemForm.reset();
  el.fNota.value = '';
  el.formError.hidden = true;
  el.notaPreview.hidden = true;
  el.notaPreviewImg.removeAttribute('src');
  el.notaName.textContent = 'Belum ada gambar';
  updateHint();
}

function openItemDialog(id) {
  if (state.mode === 'loading' || state.mode === 'offline') {
    toast('Muat ulang data terlebih dahulu sebelum menambah barang.', true);
    return;
  }
  resetForm();

  if (id) {
    const item = state.items.find((entry) => entry.id === id);
    if (!item) return;
    state.editingId = id;
    el.itemTitle.textContent = 'Edit barang';
    el.fNama.value = item.nama;
    el.fHarga.value = item.harga;
    el.fDp.value = item.dp;
    if (safeUrl(item.bukti)) {
      state.formNotaUrl = item.bukti;
      el.notaPreviewImg.src = item.bukti;
      el.notaPreview.hidden = false;
      el.notaName.textContent = 'Gambar nota tersimpan';
    }
    updateHint();
  } else {
    el.itemTitle.textContent = 'Tambah barang';
  }

  el.itemDialog.showModal();
  el.fNama.focus();
}

function updateHint() {
  const harga = Math.max(0, Number(el.fHarga.value) || 0);
  const dp = Math.min(harga, Math.max(0, Number(el.fDp.value) || 0));
  const lunas = harga > 0 && dp >= harga;
  el.fStatusHint.textContent =
    'Status otomatis: ' +
    (lunas ? 'Lunas' : 'Belum lunas') +
    ' · sisa ' +
    rupiah(Math.max(0, harga - dp));
}

function showFormError(message) {
  el.formError.textContent = message;
  el.formError.hidden = false;
}

function setSaving(isSaving) {
  el.btnSave.disabled = isSaving;
  el.btnSave.textContent = isSaving ? 'Menyimpan…' : 'Simpan';
  el.btnPickNota.disabled = isSaving;
}

async function handleSave(event) {
  event.preventDefault();
  el.formError.hidden = true;

  const nama = el.fNama.value.trim();
  const harga = Number(el.fHarga.value);
  const dpInput = Number(el.fDp.value || 0);

  if (!nama) return showFormError('Nama barang wajib diisi.');
  if (!Number.isFinite(harga) || harga <= 0) return showFormError('Harga harus lebih dari 0.');
  if (!Number.isFinite(dpInput) || dpInput < 0) return showFormError('DP tidak boleh negatif.');

  const dp = Math.min(dpInput, harga);
  setSaving(true);

  try {
    const bukti = state.formNotaData || state.formNotaUrl || '';
    await submitItem({ nama, harga, dp, bukti }, state.editingId);

    el.itemDialog.close();
    render();
    toast(state.editingId ? 'Perubahan disimpan' : 'Barang ditambahkan');
  } catch (err) {
    showFormError(err.message);
  } finally {
    setSaving(false);
  }
}

/* ---------- Images ---------- */

function loadViaImg(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Gambar tidak bisa dibaca'));
    };
    img.src = url;
  });
}

async function loadBitmap(file) {
  if ('createImageBitmap' in window) {
    return createImageBitmap(file).catch(() => loadViaImg(file));
  }
  return loadViaImg(file);
}

function renderJpeg(source, maxSide, quality) {
  const scale = Math.min(1, maxSide / Math.max(source.width, source.height));
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', quality);
}

/* Gambar disimpan di dalam sel Google Sheets (batas 50.000 karakter),
   jadi resolusi dan kualitas diturunkan sampai muat. */
async function compressImage(file) {
  const source = await loadBitmap(file);

  try {
    const attempts = [
      [720, 0.62],
      [640, 0.56],
      [560, 0.5],
      [480, 0.45],
      [420, 0.4],
      [360, 0.36],
    ];

    for (const [side, quality] of attempts) {
      const dataUrl = renderJpeg(source, side, quality);
      if (dataUrl.length <= 42000) return dataUrl;
    }

    const smallest = renderJpeg(source, 320, 0.32);
    if (smallest.length > 48000) {
      throw new Error('Gambar terlalu besar. Gunakan foto dengan ukuran lebih kecil.');
    }
    return smallest;
  } finally {
    if (typeof source.close === 'function') source.close();
  }
}

async function handleNotaPick() {
  const file = el.fNota.files && el.fNota.files[0];
  el.fNota.value = '';
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    toast('File harus berupa gambar.', true);
    return;
  }
  if (file.size > 12 * 1024 * 1024) {
    toast('Ukuran gambar maksimal 12 MB.', true);
    return;
  }

  const previous = el.notaName.textContent;
  el.notaName.textContent = 'Memproses gambar…';
  try {
    const dataUrl = await compressImage(file);
    state.formNotaData = dataUrl;
    state.formNotaUrl = '';
    el.notaPreviewImg.src = dataUrl;
    el.notaPreview.hidden = false;
    el.notaName.textContent = file.name + ' · diperkecil untuk Google Sheets';
  } catch (err) {
    el.notaName.textContent = previous;
    toast('Gagal memproses gambar: ' + err.message, true);
  }
}

function clearNota() {
  state.formNotaUrl = '';
  state.formNotaData = '';
  el.fNota.value = '';
  el.notaPreview.hidden = true;
  el.notaPreviewImg.removeAttribute('src');
  el.notaName.textContent = 'Belum ada gambar';
}

function openPreview(url) {
  const safe = safeUrl(url);
  if (!safe) return;
  el.previewImg.src = safe;
  el.previewLink.href = safe;
  el.previewDialog.showModal();
}

/* ---------- Settings ---------- */

function openSettings() {
  el.fApiUrl.value = state.apiUrl;
  el.settingsError.hidden = true;
  el.settingsDialog.showModal();
  el.fApiUrl.focus();
}

function handleSettingsSave(event) {
  event.preventDefault();
  el.settingsError.hidden = true;

  const url = el.fApiUrl.value.trim();
  if (
    url &&
    !/^https:\/\/script\.google\.com\/macros\/s\/[^\s/]+\/exec(\?[^\s]*)?$/i.test(url)
  ) {
    el.settingsError.textContent =
      'URL tidak dikenali. Gunakan URL Web App Apps Script yang diakhiri /exec.';
    el.settingsError.hidden = false;
    return;
  }

  if (url) {
    storageSet(LS.api, url);
  } else {
    storageRemove(LS.api);
  }

  state.apiUrl = url;
  el.settingsDialog.close();
  load();
  toast(url ? 'Koneksi Google Sheet disimpan' : 'Beralih ke mode demo');
}

function useDemoMode() {
  storageRemove(LS.api);
  state.apiUrl = '';
  el.settingsDialog.close();
  load();
  toast('Mode demo aktif — data tersimpan di perangkat ini');
}

/* ---------- Events ---------- */

function bindEvents() {
  el.search.addEventListener('input', () => {
    state.search = el.search.value;
    renderRows();
  });

  document.querySelectorAll('.chip-btn').forEach((button) => {
    button.addEventListener('click', () => {
      state.filter = button.dataset.status || 'semua';
      document.querySelectorAll('.chip-btn').forEach((other) => {
        const active = other === button;
        other.classList.toggle('is-active', active);
        other.setAttribute('aria-pressed', String(active));
      });
      renderRows();
    });
  });

  el.btnAdd.addEventListener('click', () => openItemDialog(null));
  el.btnSettings.addEventListener('click', openSettings);
  el.btnConnect.addEventListener('click', () => {
    if (state.mode === 'offline') load();
    else openSettings();
  });

  el.body.addEventListener('click', (event) => {
    const trigger = event.target.closest('button');
    if (!trigger) return;

    if (trigger.dataset.preview) {
      openPreview(trigger.dataset.preview);
      return;
    }

    const action = trigger.dataset.action;
    if (action === 'add') {
      openItemDialog(null);
      return;
    }
    if (action === 'retry') {
      load();
      return;
    }

    const row = trigger.closest('tr');
    const id = row && row.dataset.id;
    if (!id) return;

    if (action === 'edit') openItemDialog(id);
    else if (action === 'delete') removeItem(id);
    else if (action === 'lunasi') lunasiItem(id);
  });

  el.itemForm.addEventListener('submit', handleSave);
  el.fHarga.addEventListener('input', updateHint);
  el.fDp.addEventListener('input', updateHint);
  el.btnPickNota.addEventListener('click', () => el.fNota.click());
  el.fNota.addEventListener('change', handleNotaPick);
  el.btnClearNota.addEventListener('click', clearNota);

  el.settingsForm.addEventListener('submit', handleSettingsSave);
  el.btnDemoMode.addEventListener('click', useDemoMode);

  document.querySelectorAll('[data-close]').forEach((button) => {
    button.addEventListener('click', () => {
      const dialog = button.closest('dialog');
      if (dialog) dialog.close();
    });
  });

  document.querySelectorAll('dialog').forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  });

  el.previewDialog.addEventListener('close', () => {
    el.previewImg.removeAttribute('src');
  });
}

/* ---------- Init ---------- */

(function init() {
  state.apiUrl = (storageGet(LS.api) || CONFIG.API_URL || '').trim();
  bindEvents();
  load();
})();
