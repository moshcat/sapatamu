import { redirect } from '@sveltejs/kit';
import { readProfile } from '$lib/profile';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ url }) => {
	const profile = readProfile();
	const teacherArea = url.pathname.startsWith('/guru');
	if (!profile && !teacherArea) redirect(307, '/');
	if (profile?.role === 'Guru' && !teacherArea) redirect(307, '/guru');
	return { profile };
};
