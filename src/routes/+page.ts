import { redirect } from '@sveltejs/kit';
import { homePath, readProfile } from '$lib/profile';

export const load = () => {
	const profile = readProfile();
	if (profile) redirect(307, homePath(profile));
};
