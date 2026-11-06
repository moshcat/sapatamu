import { json } from '@sveltejs/kit';
import { listClassSessions } from '$lib/server/db';
import { requireTeacher } from '$lib/server/teacher';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, url }) => {
	requireTeacher(cookies);
	return json(await listClassSessions(url.searchParams.get('class') ?? ''));
};
