# AI & Technology Disclosure

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
| Dataset / Data Source | Empat puluh skenario dibuat sendiri. Dasar masalah dari Astawa dkk. 2017 dan PKM Universitas Dhyana Pura 2025 |
| Open-source Libraries | SvelteKit, Svelte, bits-ui, shadcn-svelte, Tailwind CSS, Lucide, tw-animate-css, tailwind-variants, Inter |
| Template / Boilerplate | Template minimal `sv create` dan komponen dari CLI shadcn-svelte |
| AI Coding Assistant | Claude Code digunakan untuk riset, desain, penulisan kode, dan dokumentasi. Peserta bertanggung jawab memahami dan menguji source code |
| Pre-existing Components | Tidak ada, selain library dan template di atas |
| Third-party Assets / Credits | Font Inter dan ikon Lucide. Karakter Kamboja dibuat untuk proyek ini |

Pernyataan: Saya menyatakan bahwa informasi di atas benar dan lengkap. Saya bertanggung jawab atas penggunaan teknologi, source code, data, library, API, model AI, dan aset yang digunakan pada produk.
