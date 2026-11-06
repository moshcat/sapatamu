import { error, json } from '@sveltejs/kit';
import { normalizeCode } from '$lib/server/access';
import { accessLimit } from '$lib/server/classes';
import { limitRequests } from '$lib/server/limits';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	await limitRequests(`access:${getClientAddress()}`, 10);
	const body = (await request.json()) as { code?: string };
	if (!(await accessLimit(normalizeCode(body.code)))) error(400, 'Kode akses tidak dikenali. Kosongkan kolom ini kalau kamu tidak punya kode.');
	return json({ ok: true });
};
