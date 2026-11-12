import { redirect } from '@sveltejs/kit';
import { homePath, readProfile } from '$lib/profile';

export const load = ({ url }) => {
	const profile = readProfile();
	// Ganti peran membuka halaman ini tanpa menghapus profil, supaya siswa bisa batal.
	if (profile && !url.searchParams.has('ganti')) redirect(307, homePath(profile));
};
