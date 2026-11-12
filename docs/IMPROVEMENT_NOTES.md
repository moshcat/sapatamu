# Catatan Improvement Tahap 1 ke Tahap 2

Versi Tahap 1: tag `v1.0-submission`. Versi final: tag `v2.0-final`.

## Sumber masukan

Sebelum final, Sapa Tamu dicoba oleh 4 orang (n = 4): 3 siswa program perhotelan SMKN 2 Denpasar dan 1 lulusan SMK. Mereka mencoba latihan suara lalu mengisi kuesioner singkat (skala 1 sampai 5).

| Pertanyaan | Rata-rata |
|---|---|
| Seberapa mudah aplikasi ini dipakai? | 4,5 |
| Apakah tamu AI terasa seperti tamu sungguhan? | 4,0 |
| Apakah suara tamu jelas dan mudah dipahami? | 4,25 |
| Apakah folio membantu tahu apa yang perlu diperbaiki? | 4,75 |

Untuk pertanyaan "Apakah aplikasi mengerti ucapanmu dengan benar?", 1 orang menjawab selalu dan 3 orang menjawab kadang-kadang. 3 dari 4 orang mau memakai Sapa Tamu di luar kelas, dan 1 orang menjawab mungkin. Jumlah ini kecil, jadi hasilnya dipakai sebagai petunjuk perbaikan, bukan sebagai bukti efektivitas. Skor AI belum dibandingkan dengan penilaian guru.

## Perubahan

| Temuan | Perubahan | Commit |
|---|---|---|
| 2 dari 4 orang bingung harus bicara apa. Satu di antaranya mengusulkan kata kunci muncul di layar saat siswa diam. | Tombol **Petunjuk** di layar latihan. Isinya target berikutnya yang belum tercapai, info situasi yang bisa dipakai, dan contoh kalimat. Contoh kalimat disembunyikan di level Mahir. Tidak ada panggilan AI tambahan. | `2877404` |
| 3 dari 4 orang bilang ucapan mereka kadang salah ditangkap. | Whisper menerima prompt berisi kosakata situasi: persona tamu, kalimat tamu terakhir, dan contoh kalimat. Nama tempat seperti Uluwatu atau Kecak jadi lebih mudah dikenali. | `a7194a8` |
| 1 orang tidak bisa membuka aplikasi lewat jaringan XL, karena domain `workers.dev` diblokir. | Aplikasi dipindah ke domain sendiri, https://sapatamu.web.id. Alamat `workers.dev` tetap ada sebagai cadangan. | `243a1b8` |
| 1 orang tidak bisa kembali ke dashboard setelah menekan Ganti peran, karena profilnya terhapus. | Ganti peran membuka form awal yang sudah terisi profil lama, dengan tombol Batal untuk kembali. | `3c0686a` |
| 1 orang ingin jawaban tamu lebih acak, supaya latihan ulang memberi kata baru. | Prompt tamu diberi aturan agar tidak mengulang kalimat sendiri, dan temperature tamu dinaikkan ke 0,8. Temperature penilaian tetap 0,6 supaya skor stabil. | `c9c1f23` |
| Uji sendiri: tamu kembali ramah setelah dijawab kasar, dan kadang menanyakan data dirinya sendiri ke pegawai. | Emosi tamu mengikuti jawaban terakhir. Jawaban kasar membuat tamu kesal atau marah sampai pegawai minta maaf. Tamu tidak lagi menanyakan data dirinya sendiri. Batas waktu Gemini 8 detik sebelum pindah ke Groq. | `c9c1f23` |
| Uji sendiri: teks dan emosi tamu muncul beberapa detik sebelum suaranya, karena audio TTS masih dimuat. | Selama suara disiapkan, karakter Kamboja tampil berpikir. Teks, emosi, dan riwayat percakapan baru muncul saat suara mulai diputar. | `2877404` |
| Telaah kode: satu kelas biasanya memakai satu IP Wi-Fi sekolah, sehingga batas per IP bisa memblokir siswa lain. | Sesi kelas dibatasi per sesi (6 permintaan per menit), bukan per IP. Pada pemeriksaan kode akses, hanya percobaan yang gagal yang dihitung per IP, jadi 30 siswa yang memasukkan kode benar bersamaan tidak terblokir. | `9b54fbb` |

## Yang belum dikerjakan

- Penilaian pelafalan atau aksen. 2 orang memintanya, termasuk meminta siswa mengulang kalimat yang pelafalannya keliru.
- Akun terpisah untuk setiap guru. Semua guru masih memakai satu PIN.
- Validasi skor AI terhadap nilai guru. Ini rencana uji berikutnya bersama guru SMK.
