# AI & Technology Disclosure

Versi final (Tahap 2, tag `v2.0-final`). Model AI sama dengan Tahap 1. Perubahan: prompt kosakata untuk Whisper dan penyuntingan video demo.

| Komponen | Isi Peserta |
|---|---|
| Nama Produk | Sapa Tamu |
| Nama Tim | SapaTamu (Anak Agung Gede Bagus Abi Wiguna, Primakara University) |
| Framework / Frontend | SvelteKit, Svelte 5, TypeScript, shadcn-svelte, Tailwind CSS |
| Backend / Runtime | SvelteKit server routes pada Cloudflare Workers |
| Database / Storage | Cloudflare D1, Cloudflare Workers KV untuk cache audio suara tamu |
| Hosting / Deployment | Cloudflare Workers |
| AI Model / API / Method | Gemini Flash-Lite, model Gemini TTS (3.8 Flash, 3.8 Flash-Lite, 3.1 Flash preview, 2.5 Flash preview), Groq Whisper Large v3 Turbo, GPT-OSS 120B lewat Groq sebagai cadangan teks, Deepgram Aura 2 lewat Cloudflare Workers AI sebagai cadangan suara |
| Peran AI dalam Produk | Menjadi tamu simulasi, menentukan emosi tamu, memeriksa target percakapan, mengubah suara pengguna menjadi teks, mengucapkan balasan tamu, dan menyusun skor latihan beserta contoh perbaikan |
| Data yang Dikirim ke Layanan AI | Rekaman jawaban dikirim ke Groq untuk transkripsi, bersama kosakata situasi sebagai prompt. Teks percakapan dikirim ke Gemini (atau Groq sebagai cadangan). Teks balasan tamu dikirim ke Gemini TTS atau Workers AI. Aplikasi tidak menyimpan audio pengguna |
| Dataset / Data Source | Empat puluh skenario dibuat sendiri. Dasar masalah dari Astawa dkk. 2017 dan PKM Universitas Dhyana Pura 2025 |
| Open-source Libraries | SvelteKit, Svelte, bits-ui, shadcn-svelte, Tailwind CSS, Lucide, tw-animate-css, tailwind-variants, Inter |
| Template / Boilerplate | Template minimal `sv create` dan komponen dari CLI shadcn-svelte |
| AI Coding Assistant | Claude Code digunakan untuk riset, desain, penulisan kode, dokumentasi, dan penyuntingan video demo. Peserta bertanggung jawab memahami dan menguji source code |
| Video Demo | Disunting dengan Remotion dan ffmpeg. Subtitle dibuat dari transkrip Groq Whisper atas narasi peserta, lalu dikoreksi. Narasi direkam sendiri oleh peserta |
| Pre-existing Components | Tidak ada, selain library dan template di atas |
| Third-party Assets / Credits | Font Inter dan ikon Lucide. Karakter Kamboja dibuat untuk proyek ini |

Pernyataan: Saya menyatakan bahwa informasi di atas benar dan lengkap. Saya bertanggung jawab atas penggunaan teknologi, source code, data, library, API, model AI, dan aset yang digunakan pada produk.
