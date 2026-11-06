<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import CircleIcon from '@lucide/svelte/icons/circle';

	let { checks, met = [] }: { checks: string[]; met?: number[] } = $props();
</script>

<ul class="flex flex-col gap-1.5 text-sm">
	{#each checks as check, index (check)}
		<li class="flex items-start gap-2">
			{#if met.includes(index)}
				<CheckIcon class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
				<span>{check}<span class="sr-only"> (terpenuhi)</span></span>
			{:else}
				<CircleIcon class="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
				<span>{check}</span>
			{/if}
		</li>
	{/each}
</ul>
