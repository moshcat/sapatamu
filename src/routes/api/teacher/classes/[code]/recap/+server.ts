import { json } from '@sveltejs/kit';
import { normalizeCode } from '$lib/server/access';
import { classRecap } from '$lib/server/classes';
import { requireTeacher } from '$lib/server/teacher';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, params }) => {
	requireTeacher(cookies);
	return json(await classRecap(normalizeCode(params.code)));
};
