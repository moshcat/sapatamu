import { error } from '@sveltejs/kit';
import { env } from 'cloudflare:workers';
import { MAX_ANSWERS } from '$lib/types';

export const DAY_MS = 86_400_000;
// Setiap jawaban boleh dicoba ulang sekali, ditambah sedikit ruang untuk gangguan jaringan.
export const SESSION_CALLS = MAX_ANSWERS * 2 + 2;

export async function limitRequests(key: string, max: number, windowMs = 60_000, message = 'Terlalu banyak permintaan. Tunggu sebentar, lalu coba lagi.') {
	const window = Math.floor(Date.now() / windowMs);
	const row = await env.DB.prepare(`
		INSERT INTO rate_limits (key, window, count) VALUES (?, ?, 1)
		ON CONFLICT (key, window) DO UPDATE SET count = count + 1 RETURNING count
	`).bind(key, window).first<{ count: number }>();
	if ((row?.count ?? 0) > max) error(429, message);
}

// Membaca hitungan tanpa menambah, untuk batas yang hanya menghitung percobaan gagal.
export async function assertUnderLimit(key: string, max: number, windowMs = 60_000, message = 'Terlalu banyak permintaan. Tunggu sebentar, lalu coba lagi.') {
	const window = Math.floor(Date.now() / windowMs);
	const row = await env.DB.prepare('SELECT count FROM rate_limits WHERE key = ? AND window = ?').bind(key, window).first<{ count: number }>();
	if ((row?.count ?? 0) >= max) error(429, message);
}

const CLASS_CALLS_PER_MINUTE = 6;

// Satu kelas sering memakai satu IP Wi-Fi sekolah, jadi sesi berkode kelas dibatasi per sesi, bukan per IP.
export const limitCaller = (name: string, session: { id: string; classCode: string | null }, ip: string, publicMax: number) =>
	session.classCode
		? limitRequests(`${name}:session:${session.id}`, CLASS_CALLS_PER_MINUTE)
		: limitRequests(`${name}:${ip}`, publicMax);
