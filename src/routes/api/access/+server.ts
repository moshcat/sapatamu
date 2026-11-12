import { error, json } from '@sveltejs/kit';
import { normalizeCode } from '$lib/server/access';
import { accessLimit } from '$lib/server/classes';
import { assertUnderLimit, limitRequests } from '$lib/server/limits';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	// Hanya percobaan gagal yang dihitung, supaya satu kelas yang memasukkan kode bersamaan tidak terblokir.
	const failKey = `access-fail:${getClientAddress()}`;
	await assertUnderLimit(failKey, 10);
	const body = (await request.json()) as { code?: string };
	if (await accessLimit(normalizeCode(body.code))) return json({ ok: true });
	await limitRequests(failKey, 10);
	error(400, 'Kode akses tidak dikenali. Kosongkan kolom ini kalau kamu tidak punya kode.');
};
