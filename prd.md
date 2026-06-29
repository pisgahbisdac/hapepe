# Product Requirements Document (PRD)
**Project Name:** FoodCost Pro
**Document Version:** 1.0

## 1. Executive Summary
FoodCost Pro adalah aplikasi manajemen *Food & Beverage* (F&B) berbasis web ringan yang didesain khusus untuk UMKM dan restoran. Aplikasi ini memecahkan masalah utama di bisnis F&B: ketidaktahuan atas Harga Pokok Penjualan (HPP) yang akurat dan kebocoran inventori. Dengan antarmuka tunggal (*Single Page Application*) dan *backend* berbasis Google Spreadsheet, aplikasi ini sangat murah/gratis untuk di-hosting dan mudah dikelola (Database mudah diakses awam).

## 2. Architecture & Tech Stack
Aplikasi menggunakan arsitektur *Serverless* yang sangat hemat biaya:
- **Frontend:** React JS 18 (via CDN), Tailwind CSS untuk styling modern, FontAwesome untuk ikon. Dikompilasi langsung di browser menggunakan Babel Standalone.
- **Backend:** Google Apps Script (GAS) berperan sebagai REST API Endpoint. Menerima request `doGet` dan `doPost`.
- **Database:** Google Sheets yang terdiri dari 5 Worksheet utama (`Purchases`, `Recipes`, `Overhead`, `Sales`, `Adjustments`).

## 3. Core Features

### 3.1. Pembelian & Manajemen Bahan Baku (Purchases)
- **Fungsi:** Mencatat histori belanja bahan baku restoran.
- **Data Point:** Tanggal, Nama Bahan, Satuan, Kuantitas, Harga Total.
- **Logika Sistem:** Sistem secara cerdas menghitung Harga Rata-Rata (*Moving Average*) dari bahan baku berdasarkan riwayat pembelian dalam 2 bulan terakhir (dihitung utuh mulai dari tanggal 1). Jika tidak ada transaksi dalam periode tersebut, sistem akan mengambil harga dari transaksi terakhir. Terdapat fitur rincian perhitungan (Modal) yang transparan untuk setiap harga rata-rata bahan baku. Harga ini digunakan sebagai harga dasar Costing/HPP.

### 3.2. Biaya Operasional (Overhead Costs)
- **Fungsi:** Mencatat biaya tetap dan variabel di luar bahan baku (seperti Listrik, Gaji, Sewa).
- **Data Point:** Nama Biaya, Nominal per Bulan.

### 3.3. Costing & Resep (Recipes & HPP)
- **Fungsi:** Menciptakan resep makanan, merakit komposisi bahan baku, dan menghitung Harga Pokok Penjualan (HPP) secara *real-time*.
- **Fitur Khusus:** 
  - Mendukung "Bahan Setengah Jadi" (*Sub-recipes*) yang bisa dipanggil kembali sebagai bahan baku di resep lain.
  - Perhitungan HPP berjalan secara dinamis mengikuti fluktuasi harga bahan di Tab Pembelian.
  - Input Target Margin (%) untuk merekomendasikan Harga Jual Ideal.
  - **Mode Dapur (Kitchen Mode):** Memisahkan logika Berat Kotor (Costing) dengan Berat Bersih (Net Qty) serta Takaran Manual (Manual Measure) khusus untuk tampilan dapur.
  - **Kartu Resep Profesional:** Pembangun resep terstruktur (*Recipe Builder*) untuk mengatur *Prep Time*, *Cook Time*, *Tools*, *Chef Note*, kategori bahan baku (*Categories*), serta memecah cara memasak menjadi Fase dan Proses ber-tabel (*Temp*, *Time*, *Notes*).
  - Gambar Produk (via URL link).

### 3.4. Simulasi Bisnis
- **Fungsi:** Proyeksi profitabilitas bisnis bulanan.
- **Logika Sistem:** Menggabungkan Biaya Operasional, HPP per menu, Harga Jual, dan Target Penjualan per menu untuk memproyeksikan Total Omset, Total HPP, Laba Kotor, dan Laba Bersih bulanan.

### 3.5. Katalog Menu & Katalog Dapur
- **Fungsi:** Menampilkan menu secara visual untuk publik (Katalog Publik) dan instruksi memasak detail untuk koki (Katalog Dapur).
- **Fitur Khusus:** 
  - *Public View* (`index.html`): Layaknya buku menu elektronik untuk tamu/pelayan tanpa mengekspos data HPP.
  - *Kitchen View* (`cook.html`): Tampilan layar penuh (*Full Screen*) untuk koki yang secara otomatis menerjemahkan data *Recipe Builder* menjadi standar industri **Professional Recipe Card**. Bahan baku terkelompokkan otomatis dan instruksi memasak disajikan dalam format tabel matriks presisi.

### 3.6. Sistem Inventori Otomatis (Inventory & Stock)
- **Fungsi:** Melacak sisa stok bahan baku secara otomatis tanpa perlu *stock opname* harian.
- **Fitur Khusus:**
  - **Stock In:** Otomatis terbaca dari input Pembelian.
  - **Stock Out (Sales):** Pengguna menginput menu laku dan kuantitasnya (mencatat ID, Tanggal, RecipeID, QuantitySold, dan MenuName). Sistem akan mengurangi stok bahan. Jika menu tersebut menggunakan "Bahan Setengah Jadi", sistem dilengkapi dengan kecerdasan *Recursive Deduction* untuk membongkar bahan setengah jadi tersebut dan memotong langsung stok bahan mentah asalnya berdasarkan proporsi *Yield*.
  - **Stock Out (Adjustments):** Input manual untuk bahan yang rusak, tumpah, atau dibuang.
  - **Laporan Bulanan:** Filter berdasarkan bulan tertentu untuk melacak Stok Awal, Masuk, Keluar, dan Stok Akhir. Dilengkapi UI scrollable yang elegan.
  - **Export:** Mendukung *Export to CSV (Excel)* dan *Print to PDF* (dilengkapi dengan *Print Media Query* untuk memastikan ukuran kertas lanskap, anti-terpotong di tengah baris, serta margin pelindung).

## 4. Security & Access
- Terdapat sistem *Login* sederhana berbasis sandi/PIN statis di Frontend (disinkronisasi dengan variabel di Google Script).
- Google Spreadsheet diatur tertutup untuk publik, hanya diakses melalui URL eksekusi web app Google Script.
- **Role Management & Access Control:**
  - **Admin:** Memiliki akses penuh ke seluruh fitur dan pengaturan aplikasi (Data Bahan Baku, Biaya Operasional, Costing & Harga Jual, Simulasi Bisnis, Katalog Menu, Inventory & Stok, dan Pengaturan Akun).
  - **Staff:** Memiliki akses terbatas yang disesuaikan untuk operasional harian. **Tidak memiliki akses** ke data sensitif seperti Biaya Operasional, Costing & Harga Jual, serta Pengaturan Akun. Staf hanya dapat mengakses: Data Bahan Baku, Simulasi Bisnis, Katalog Menu, dan Inventory & Stok.

## 5. Future Development (Roadmap)
- Integrasi ke Printer Thermal/Bluetooth POS.
- Fitur *User Management* (Akses khusus kasir, dapur, dan manajer).
- Peringatan Otomatis (*Low Stock Alert*) bila stok bahan hampir habis.
