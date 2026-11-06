import { error, json } from '@sveltejs/kit';
import { countClasses, createClass, listClasses, MAX_CLASSES } from '$lib/server/classes';
import { limitRequests } from '$lib/server/limits';
import { requireTeacher } from '$lib/server/teacher';
import { cleanText } from '$lib/server/validate';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
	requireTeacher(cookies);
	return json(await listClasses());
};

export const POST: RequestHandler = async ({ cookies, request, getClientAddress }) => {
	requireTeacher(cookies);
	await limitRequests(`class:${getClientAddress()}`, 10);
	const body = (await request.json()) as { name?: string };
	const name = cleanText(body.name, 40);
	if (!name) error(400, 'Isi nama kelas dulu.');
	if ((await countClasses()) >= MAX_CLASSES) error(409, `Batas ${MAX_CLASSES} kelas tercapai. Hapus kelas yang tidak dipakai.`);
	return json(await createClass(name), { status: 201 });
};
