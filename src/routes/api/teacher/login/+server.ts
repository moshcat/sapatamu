import { timingSafeEqual, createHash } from 'node:crypto';
import { error, json } from '@sveltejs/kit';
import * as env from '$app/env/private';
import { limitRequests } from '$lib/server/limits';
import { TEACHER_COOKIE, teacherToken } from '$lib/server/teacher';
import type { RequestHandler } from './$types';

const digest = (value: string) => createHash('sha256').update(value).digest();

export const POST: RequestHandler = async ({ request, cookies, getClientAddress, url }) => {
	await limitRequests(`pin:${getClientAddress()}`, 8);
	const { pin } = (await request.json()) as { pin?: string };
	if (!env.TEACHER_PIN) error(503, 'PIN guru belum diatur di server.');
	if (!timingSafeEqual(digest(String(pin ?? '')), digest(env.TEACHER_PIN))) error(401, 'PIN salah. Periksa lagi PIN gurumu.');
	cookies.set(TEACHER_COOKIE, teacherToken(), { path: '/', httpOnly: true, sameSite: 'strict', secure: url.protocol === 'https:', maxAge: 60 * 60 * 8 });
	return json({ ok: true });
};

export const DELETE: RequestHandler = ({ cookies }) => {
	cookies.delete(TEACHER_COOKIE, { path: '/' });
	return json({ ok: true });
};
