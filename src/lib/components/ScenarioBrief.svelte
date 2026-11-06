<script lang="ts">
	import TargetList from '$lib/components/TargetList.svelte';
	import type { Scenario } from '$lib/scenarios';
	import type { Level } from '$lib/types';

	let { scenario, level }: { scenario: Scenario; level: Level } = $props();
</script>

<div class="flex flex-col gap-4 text-sm">
	<dl class="grid grid-cols-[4.75rem_minmax(0,1fr)] gap-x-3 gap-y-1.5">
		<dt class="text-muted-foreground">Peran</dt>
		<dd>{scenario.role}</dd>
		<dt class="text-muted-foreground">Tamu</dt>
		<dd>{scenario.guest}</dd>
		<dt class="text-muted-foreground">Konteks</dt>
		<dd>{scenario.context}</dd>
	</dl>
	<section class="flex flex-col gap-2">
		<h3 class="font-medium">Target latihan</h3>
		<TargetList checks={scenario.checks} />
	</section>
	{#if level !== 'Mahir'}
		<section class="flex flex-col gap-2">
			<h3 class="font-medium">Kalimat bantu</h3>
			<blockquote class="italic" lang="en">{scenario.helper}</blockquote>
		</section>
	{/if}
	<p class="text-muted-foreground">Skor untuk latihan, bukan nilai resmi. Pelafalan belum dinilai.</p>
</div>
