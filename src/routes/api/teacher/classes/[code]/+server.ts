import { error, json } from '@sveltejs/kit';
import { deleteClass } from '$lib/server/classes';
import { requireTeacher } from '$lib/server/teacher';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ cookies, params }) => {
	requireTeacher(cookies);
	if (!(await deleteClass(params.code))) error(404, 'Kelas tidak ditemukan.');
	return json({ ok: true });
};
