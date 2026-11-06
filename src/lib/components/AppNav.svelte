<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import GraduationCapIcon from '@lucide/svelte/icons/graduation-cap';
	import HistoryIcon from '@lucide/svelte/icons/history';
	import MessagesSquareIcon from '@lucide/svelte/icons/messages-square';
	import UserRoundCogIcon from '@lucide/svelte/icons/user-round-cog';
	import { request } from '$lib/api';
	import favicon from '#lib/assets/favicon.svg';
	import { Button } from '$lib/components/ui/button';
	import { clearProfile, type Profile } from '$lib/profile';

	let { profile }: { profile: Profile | null } = $props();

	const teacher = $derived(!profile || profile.role === 'Guru');
	const items = $derived(
		teacher
			? [{ href: '/guru', label: 'Guru', icon: GraduationCapIcon }]
			: [
					{ href: '/latihan', label: 'Latihan', icon: MessagesSquareIcon },
					{ href: '/riwayat', label: 'Riwayat', icon: HistoryIcon }
				]
	);

	const tabClass =
		'text-muted-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground h-13 flex-1 flex-col gap-0.5 text-xs desk:h-11 desk:flex-none desk:flex-row desk:justify-start desk:gap-2 desk:px-3 desk:text-sm';

	async function changeRole() {
		// Body JSON mencegah DELETE tanpa content-type dihitung sebagai form lintas situs oleh cek CSRF SvelteKit.
		if (teacher) await request('/api/teacher/login', { method: 'DELETE', json: {} }).catch(() => undefined);
		clearProfile();
		await goto('/');
	}
</script>

<nav
	aria-label="Navigasi utama"
	class="bg-background desk:inset-y-0 desk:right-auto desk:w-52 desk:flex-col desk:gap-1 desk:border-t-0 desk:border-r desk:px-3 desk:py-6 fixed inset-x-0 bottom-0 z-10 flex border-t px-2 pt-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))]"
>
	<a href={items[0].href} class="desk:flex hidden items-center gap-2.5 rounded-md px-2 pb-5">
		<img src={favicon} alt="" class="size-10 shrink-0" />
		<span class="text-lg font-bold tracking-tight">Sapa Tamu</span>
	</a>
	{#each items as item (item.href)}
		<Button
			variant="ghost"
			href={item.href}
			class={tabClass}
			aria-current={page.url.pathname.startsWith(item.href) ? 'page' : undefined}
		>
			<item.icon aria-hidden="true" />
			{item.label}
		</Button>
	{/each}
	<Button variant="ghost" class="{tabClass} desk:mt-auto" onclick={changeRole}>
		<UserRoundCogIcon aria-hidden="true" />
		Ganti peran
	</Button>
</nav>
