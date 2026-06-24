# Panduan Penggunaan (User Manual) - FoodCost Pro

Selamat datang di **FoodCost Pro**, aplikasi cerdas untuk mengontrol HPP (Harga Pokok Penjualan), margin profit, dan inventori stok restoran Anda secara otomatis!

Berikut adalah panduan lengkap cara menggunakan aplikasi dari A sampai Z.

---

## 1. Login Pertama Kali
Saat Anda membuka tautan aplikasi, Anda akan diminta memasukkan **Kata Sandi**. 
- Masukkan kata sandi (PIN) yang telah disepakati (misal: `123456`).
- Jika kata sandi benar, aplikasi akan mengunduh database dari Google Spreadsheet Anda secara otomatis. Ini memakan waktu beberapa detik.

---

## 2. Tab 1: Data Bahan Baku (Kunci Utama)
Di sinilah Anda mencatat semua **riwayat belanja pasar atau supplier**.

1. **Cara Menginput:**
   - Masukkan tanggal belanja.
   - Ketik nama bahan (contoh: *Bawang Merah*).
   - Pilih satuan, masukkan jumlah/kuantitas, dan **Total Harga Bayar** (bukan harga per satuan).
   - Klik Simpan. Sistem akan otomatis menghitung Harga/Satuan.
   - **Penting:** Harga yang dipakai sistem sebagai dasar HPP adalah **Rata-rata Pembelian dalam 2 Bulan Terakhir** (ditarik utuh dari tanggal 1). Jika tidak ada pembelian dalam 2 bulan tersebut, sistem akan mengambil harga dari histori pembelian paling terakhir.

2. **⭐ Aturan Emas Pencatatan (Trik Konversi Satuan) ⭐**
   Jangan pernah mencatat berdasarkan "kemasan", melainkan catat **satuan dasar (gram/ml/pcs)**.
   - **Salah:** Beli Susu Ultra = Qty: 1, Satuan: Kotak. Harga: Rp 18.000
   - **Benar:** Beli Susu Ultra = Qty: 1000, Satuan: ml. Harga: Rp 18.000.
   - *Tujuannya:* Agar saat membuat resep (yang biasanya butuh takaran detail seperti 200 ml susu), Anda tidak perlu menghitung "0,2 kotak", melainkan cukup ketik "200 ml".

---

## 3. Tab 2: Biaya Operasional (Overhead)
Masukkan biaya-biaya rutin bulanan yang membebani restoran Anda, tapi tidak masuk ke piring pelanggan.
- Contoh: Gaji Karyawan, Sewa Tempat, Tagihan Listrik, Internet, Gas.
- Biaya ini nantinya akan dipotongkan dari keuntungan kotor Anda di tab Simulasi Bisnis.

---

## 4. Tab 3: Costing & Harga Jual (Membuat Resep)
Ini adalah jantung dari aplikasi. Di sini Anda meracik menu.

1. **Membuat Menu Biasa:**
   - Masukkan Nama Menu (misal: *Nasi Goreng Spesial*).
   - Pastikan **Status Resep** adalah "Menu Akhir (Jual)".
   - Tentukan porsi hasil jadi (biasanya 1 porsi).
   - **Tambahkan Bahan Baku:** Pilih bahan yang sudah pernah Anda input di Tab 1, lalu masukkan jumlah takarannya (misal: Beras 100 gram). HPP akan terhitung otomatis!
   - Tentukan **Target Margin (%)**, dan sistem akan memberitahu Anda Harga Jual Idealnya.
   - Anda juga bisa memasukkan *URL Link Gambar* untuk memunculkan foto makanan.

2. **Membuat Bahan Setengah Jadi (Sub-Recipe):**
   - Jika Anda memasak Saus atau Bumbu Dasar dalam jumlah besar (misal 1 Kg Bumbu Dasar), ubah Status Resep menjadi **"Bahan Setengah Jadi"**.
   - Atur Jumlah Hasil menjadi "1000 gram".
   - Masukkan komposisi bawang, cabai, minyak, dll.
   - Sistem akan menghitung HPP Bumbu per gram-nya! Bumbu ini kemudian bisa Anda panggil ke resep *Menu Akhir* layaknya bahan baku biasa.

3. **⭐ Aturan Emas Penyusutan (Yield / Gross vs Net Weight) ⭐**
   - Saat membuat resep, pastikan berat yang dimasukkan adalah **Berat Kotor (Gross Weight)**. Yaitu berat bahan saat dikeluarkan dari kulkas/gudang, bukan saat tersaji.
   - Contoh: Untuk menyajikan 200gr dada ayam bersih, Anda mungkin harus mengambil 220gr ayam dari freezer (20gr terbuang sebagai lemak/air thaw). Tuliskan **220 gram** di resep! Ini agar perhitungan laba Anda akurat, dan inventori fisik Anda di kulkas cocok dengan di aplikasi.

---

## 5. Tab 4: Simulasi Bisnis
Gunakan tab ini di awal bulan untuk memproyeksikan target omset Anda.
- Ketikkan angka perkiraan porsi terjual di masing-masing menu.
- Aplikasi akan menghitung total Omset Kotor, total Biaya Bahan Baku (HPP), memotongnya dengan Biaya Operasional (Tab 2), dan menyajikan **Profit Bersih Bulanan** yang sesungguhnya.

---

## 6. Tab 5: Katalog Menu
Tampilan cantik yang merangkum semua Menu Akhir Anda beserta Harga Jual Ideal dan Foto Makanannya. Sangat cocok digunakan oleh Waiter/Kasir untuk melihat-lihat daftar menu.

---

## 7. Tab 6: Inventory & Stok (Mengelola Barang Keluar)
Bahan baku masuk (In) secara otomatis ketika Anda belanja di Tab 1. Lalu bagaimana mengeluarkan barang?

1. **Pemotongan Otomatis (Sales):**
   - Setiap kali ada menu laku, pergi ke Form Penjualan di kiri atas.
   - Pilih menu yang laku dan masukkan jumlah porsi. 
   - Klik Simpan. *Magic!* Aplikasi akan melihat resep tersebut, lalu memotong stok beras, minyak, daging, dan bumbunya secara presisi sesuai jumlah porsi yang terjual.
   - **Catatan Sub-Recipe:** Jika menu Anda menggunakan "Bahan Setengah Jadi" (misal: Sambal Merah), sistem tidak akan memunculkan Sambal Merah di inventori dengan stok minus. Sistem cukup cerdas untuk membongkar Sambal Merah tersebut ke bahan mentah asalnya (Cabai, Bawang) dan memotongnya secara langsung berdasarkan persentase pakainya!

2. **Pemotongan Manual (Buang/Rusak):**
   - Jika ada telur pecah, susu basi, atau sayur yang layu, catat di Form Penyesuaian Manual di sebelahnya.

3. **Dashboard Laporan Inventori:**
   - Di bagian bawah, Anda akan melihat saldo stok secara langsung dalam tabel yang rapi (bisa di-*scroll*).
   - **Fitur Transparansi Harga:** Klik pada angka **Harga (Rata-rata)** yang berwarna hijau untuk melihat Rincian Perhitungan (Modal). Sistem akan menjabarkan seluruh histori transaksi yang membentuk harga tersebut!
   - Gunakan filter **"Bulan"** untuk melacak riwayat per bulan (Anda akan melihat sisa stok awal bulan, total masuk, total terjual, total terbuang, dan stok akhir).
   - Klik tombol **Excel** atau **Cetak PDF** untuk mengekspor data guna dikirimkan ke pemilik (Owner/Manager). Format cetak PDF sudah teroptimasi dengan margin yang aman dan anti-terpotong.

---
*Dikembangkan oleh Antigravity - Tim Agentic AI F&B Solutions*
