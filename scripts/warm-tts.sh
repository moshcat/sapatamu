#!/usr/bin/env bash
# Mengisi cache suara pembuka semua skenario. Jalankan setelah kuota Gemini TTS reset.
# Pemakaian: scripts/warm-tts.sh [URL aplikasi]
set -euo pipefail

base="${1:-https://sapatamu.mauricecathoverile.workers.dev}"
jar="$(mktemp)"
trap 'rm -f "$jar"' EXIT

read -rsp 'PIN guru: ' pin
echo
# PIN dikirim lewat stdin agar tidak terlihat di daftar proses.
printf '{"pin":"%s"}' "$pin" | curl -fsS -c "$jar" -H 'Content-Type: application/json' \
	--data @- "$base/api/teacher/login" >/dev/null

while true; do
	result="$(curl -fsS -b "$jar" -X POST "$base/api/teacher/tts-warm")"
	echo "$result"
	created="$(sed -E 's/.*"created":([0-9]+).*/\1/' <<<"$result")"
	missing="$(sed -E 's/.*"missing":([0-9]+).*/\1/' <<<"$result")"
	if [ "$missing" = 0 ]; then echo 'Semua suara pembuka sudah tersimpan.'; break; fi
	if [ "$created" = 0 ]; then echo 'Kuota Gemini TTS habis. Coba lagi setelah reset.'; break; fi
done
