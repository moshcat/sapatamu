<script lang="ts">
	import type { Scenario } from '$lib/scenarios';
	import type { Level } from '$lib/types';

	let {
		id,
		scenario,
		met,
		level,
		class: className
	}: { id: string; scenario: Scenario; met: number[]; level: Level; class?: string } = $props();

	const nextTarget = $derived(scenario.checks.find((_, index) => !met.includes(index)));
</script>

<section {id} aria-label="Petunjuk" class={['w-full max-w-md rounded-lg border p-4 text-left text-sm', className]}>
	<dl class="flex flex-col gap-3">
		<div class="flex flex-col gap-0.5">
			<dt class="text-muted-foreground">Target berikutnya</dt>
			<dd class="font-medium">{nextTarget ?? 'Semua target tercapai. Tutup percakapan dengan sopan.'}</dd>
		</div>
		<div class="flex flex-col gap-0.5">
			<dt class="text-muted-foreground">Info yang bisa kamu pakai</dt>
			<dd>{scenario.context}</dd>
		</div>
		{#if level !== 'Mahir'}
			<div class="flex flex-col gap-0.5">
				<dt class="text-muted-foreground">Contoh kalimat</dt>
				<dd class="italic" lang="en">{scenario.helper}</dd>
			</div>
		{/if}
	</dl>
</section>
