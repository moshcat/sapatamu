import { createHmac } from 'node:crypto';
import { error, type Cookies } from '@sveltejs/kit';
import * as env from '$app/env/private';

export const TEACHER_COOKIE = 'sapatamu_teacher';

export const teacherToken = () => createHmac('sha256', env.TEACHER_PIN ?? '').update('teacher').digest('hex');

export function requireTeacher(cookies: Cookies) {
	if (!env.TEACHER_PIN || cookies.get(TEACHER_COOKIE) !== teacherToken()) error(401, 'Masuk dengan PIN guru dulu.');
}
