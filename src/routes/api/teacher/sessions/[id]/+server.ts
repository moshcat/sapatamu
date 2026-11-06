import { error, json } from '@sveltejs/kit';
import { getSession, saveReview } from '$lib/server/db';
import { requireTeacher } from '$lib/server/teacher';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, params }) => {
	requireTeacher(cookies);
	const session = await getSession(params.id);
	if (!session) error(404, 'Latihan tidak ditemukan.');
	return json(session);
};

export const PATCH: RequestHandler = async ({ cookies, params, request }) => {
	requireTeacher(cookies);
	const body = (await request.json()) as { scores?: unknown[]; note?: string };
	const scores = Array.isArray(body.scores) ? body.scores.map(Number) : [];
	if (scores.length !== 4 || !scores.every((score: number) => Number.isInteger(score) && score >= 1 && score <= 4)) error(400, 'Skor harus bernilai 1 sampai 4.');
	if (!(await saveReview(params.id, { scores, note: String(body.note ?? '').slice(0, 1000) }))) error(404, 'Folio belum tersedia.');
	return json({ ok: true });
};
