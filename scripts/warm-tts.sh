#!/usr/bin/env bash
# Mengisi cache suara pembuka semua skenario. Jalankan setelah kuota Gemini TTS reset.
# Pemakaian: scripts/warm-tts.sh [URL aplikasi]
set -euo pipefail

base="${1:-https://sapatamu.web.id}"
jar="$(mktemp)"

read -rsp 'PIN guru: ' pin
echo
body="$(mktemp)"
trap 'rm -f "$jar" "$body"' EXIT

# PIN dikirim lewat stdin agar tidak terlihat di daftar proses.
status="$(printf '{"pin":"%s"}' "$pin" | curl -sS -o "$body" -w '%{http_code}' -c "$jar" \
	-H 'Content-Type: application/json' --data @- "$base/api/teacher/login")"
if [ "$status" != 200 ]; then
	echo "Login gagal (HTTP $status): $(cat "$body")" >&2
	exit 1
fi

while true; do
	status="$(curl -sS -o "$body" -w '%{http_code}' -b "$jar" -H 'Content-Type: application/json' --data '{}' "$base/api/teacher/tts-warm")"
	result="$(cat "$body")"
	if [ "$status" != 200 ]; then
		echo "Pengisian suara gagal (HTTP $status): $result" >&2
		exit 1
	fi
	echo "$result"
	created="$(sed -E 's/.*"created":([0-9]+).*/\1/' <<<"$result")"
	missing="$(sed -E 's/.*"missing":([0-9]+).*/\1/' <<<"$result")"
	if [ "$missing" = 0 ]; then echo 'Semua suara pembuka sudah tersimpan.'; break; fi
	if [ "$created" = 0 ]; then echo 'Kuota Gemini TTS habis. Coba lagi setelah reset.'; break; fi
done
