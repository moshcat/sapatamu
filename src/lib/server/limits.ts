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
