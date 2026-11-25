# Purnomo

Aplikasi catatan barang sederhana: nama barang, harga, DP, status lunas, dan bukti nota.
Frontend statis (HTML/CSS/JS) untuk GitHub Pages, database di Google Sheets.
Gambar nota disimpan **langsung di Google Sheets** dalam resolusi rendah, tanpa Google Drive.

## Isi folder

```
index.html      Halaman aplikasi
styles.css      Tampilan
app.js          Logika aplikasi + koneksi API
gas/Code.gs     Backend Google Apps Script
```

## 1. Siapkan Google Sheet

1. Buka [sheets.new](https://sheets.new) dan buat spreadsheet baru, beri nama misalnya **Purnomo**.
2. Menu **Extensions → Apps Script**.
3. Hapus isi `Code.gs` default, lalu tempel seluruh isi file `gas/Code.gs`. Simpan (Ctrl+S).
4. Sheet `Barang` dibuat otomatis saat aplikasi pertama kali dipakai.

## 2. Deploy Apps Script sebagai Web App

1. Di editor Apps Script klik **Deploy → New deployment**.
2. Pilih tipe **Web app**.
3. Isi:
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
4. Klik **Deploy**, lalu **Authorize access** dan izinkan akses.
5. Salin **Web app URL** (berbentuk `https://script.google.com/macros/s/…/exec`).

Setiap kali `Code.gs` diubah, buat **New deployment** (atau **Manage deployments → Edit → Version: New version**) agar perubahan aktif.

## 3. Hubungkan aplikasi

Dua cara, pilih salah satu:

- **Tanpa edit kode**: buka aplikasi → tombol ⚙️ kanan atas → tempel URL Web App → **Simpan**.
  URL disimpan di browser (localStorage), jadi lakukan sekali per perangkat/browser.
- **Permanen**: isi `API_URL` di baris atas [app.js](app.js) dengan URL tersebut, lalu commit.

Tanpa URL, aplikasi berjalan dalam **mode demo** (data hanya di browser).

## 4. Publikasikan ke GitHub Pages

1. Buat repository baru di GitHub, misal `purnomo`.
2. Upload `index.html`, `styles.css`, `app.js` (folder `gas/` tidak wajib di-upload).
3. Buka **Settings → Pages → Build and deployment**:
   - Source: `Deploy from a branch`
   - Branch: `main`, folder `/ (root)` → **Save**.
4. Tunggu 1–2 menit, aplikasi tersedia di `https://<username>.github.io/purnomo/`.

## Catatan gambar nota

- Foto dikompres di browser menjadi JPEG resolusi rendah (maks. sisi ±720 px, kualitas diturunkan otomatis) hingga data URL ±42.000 karakter.
- Di sheet, sel **Bukti Nota** berisi formula `=IMAGE("data:image/jpeg;base64,…")`, sehingga gambar terlihat langsung di Google Sheets.
- Batas satu sel Google Sheets adalah 50.000 karakter; aplikasi otomatis mengecilkan gambar agar muat. Jika masih terlalu besar, muncul pesan kesalahan.
- Jangan mengetik ulang/merusak sel Bukti Nota secara manual — aplikasi membaca gambar dari formula tersebut.
- Gambar hanya seukuran nota untuk arsip, bukan untuk cetak besar.

## Catatan lain

- Daftar barang diurutkan dari **input terbaru di atas**. Waktu input disimpan di kolom Tanggal dan tidak berubah saat barang diedit.
- Harga dan DP disimpan sebagai angka; status **Lunas** otomatis saat DP ≥ harga.
- Menghapus barang menghapus baris beserta gambarnya.
- Kolom sheet: `ID | Nama Barang | Harga | DP | Status | Bukti Nota | Tanggal`. Jangan mengubah nama header.
- Jika aplikasi menampilkan "Luring", cek URL Web App dan pastikan deployment memakai akses **Anyone**.
