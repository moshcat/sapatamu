import { error, json } from '@sveltejs/kit';
import { getSession } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const session = await getSession(params.id);
	if (!session) error(404, 'Latihan tidak ditemukan.');
	return json(session);
};
