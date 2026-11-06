<script lang="ts">
	import type { Scenario } from '$lib/scenarios';

	let { scenario }: { scenario: Scenario } = $props();
</script>

<span class="flex min-w-13 flex-col items-center rounded-sm border px-1.5 py-1 leading-tight">
	<span class="text-muted-foreground text-xs">{scenario.unit}</span>
	<span class="text-sm font-semibold tabular-nums">{scenario.room}</span>
</span>
