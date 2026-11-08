<script lang="ts">
	import AppNav from '$lib/components/AppNav.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<AppNav profile={data.profile} />

<div class="desk:pl-52 print:pl-0">
	<main
		class="desk:max-w-280 desk:px-8 desk:py-9 mx-auto flex w-full max-w-xl flex-col gap-5 px-4 pt-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] print:max-w-none print:p-0"
	>
		{@render children()}
	</main>
</div>
