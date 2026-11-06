# Arah Desain Sapa Tamu

Arah dari pemilik produk: **Meja resepsionis** dengan warna dasar putih bersih. Rapi seperti kartu layanan hotel, tenang, mudah dibaca, dan memakai satu warna aksen.

Dial: ENERGY 1 / RHYTHM 2 / MOTION 2

Layar percakapan memakai layout referensi pemilik produk dalam light mode, tetapi karakternya orisinal: Kamboja, bunga kamboja bertubuh gemuk dengan warna datar, tanpa garis tepi, mata putih besar, dan ekspresi kuat. Warna karakter boleh lebih berani daripada UI: merah muda, kuning, dan hijau. Gerak hanya menunjukkan status: tubuh memantul saat bicara, kelopak mengembang dan tangan terangkat saat mendengarkan, serta kelopak mata turun dan tangan di dagu saat berpikir. Emosi tamu: netral, senang, kesal, marah, sedih, dan bingung. Emosi tampil lewat alis, kelopak mata, arah pandang, mulut, air mata, tanda marah, dan warna kelopak. Jangan memakai wajah kapsul, cahaya neon, atau menyalin karakter dari referensi.

## Pola UX

- Jangan memakai tampilan atau pola visual yang mirip Duolingo, seperti jalur zigzag, node bulat, tombol tebal, dan kartu jawaban besar.
- Struktur mengikuti Apple HIG: tab bar untuk tiga bagian utama, daftar berkelompok, sheet untuk briefing, modal layar penuh untuk latihan, dan konfirmasi sebelum jawaban hilang.
- Mulai 900 px, tab bawah menjadi sidebar. Briefing tampil di panel kanan, layar suara memakai panel target dan riwayat, serta hasil dan guru memakai dua kolom.
- Target sentuh minimal 44x44. Tombol memakai bentuk datar dan garis tipis.

## Identitas

- Motif: kartu registrasi tamu dan folio hotel. Skenario tampil seperti label kunci kamar, laporan tampil seperti folio dengan nama kriteria di kiri dan skor di kanan, tanpa garis titik.
- Logo: kepala bunga Kamboja statis di samping nama produk, memakai aset `src/lib/assets/favicon.svg`.

## Warna

Produk memakai light mode bawaan shadcn-svelte secara langsung: preset Vega, base color neutral, font Inter. Token ada di `src/routes/layout.css`. Jangan menambahkan warna UI kustom atau memakai dark mode. Warna merah muda, kuning, dan hijau hanya untuk karakter Kamboja, kecuali badge Selesai yang memakai hijau atas arahan pemilik produk.

## Alasan keputusan

- Light mode shadcn: permintaan pemilik produk agar UI bersih dan langsung mengikuti design system.
- Karakter Kamboja: sumber identitas utama, karena UI memakai warna netral bawaan shadcn.
- Inter untuk seluruh teks: permintaan pemilik produk agar tampilan bersih dan konsisten.
- Kartu dipakai untuk dokumen dan label kunci, bukan untuk semua blok.
- Bayangan tidak dipakai. Hierarki memakai garis, ruang, dan ukuran teks.
- Gerak dipakai pada hover, fokus, dan status karakter suara, serta mati saat pengguna memilih reduced motion.
- Ikon hanya dipakai jika maknanya lebih cepat dipahami daripada teks, dan pilihannya harus sesuai kartu layanan.
