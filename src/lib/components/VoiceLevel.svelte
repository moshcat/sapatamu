<script lang="ts">
	import type { VoicePhase } from '$lib/voice.svelte';

	let { phase, levels }: { phase: VoicePhase; levels: number[] } = $props();
</script>

<div class="flex h-7 items-center justify-center gap-1" data-phase={phase} aria-hidden="true">
	{#each levels as level, index (index)}
		<span
			class={['bar h-full w-1 rounded-xs', phase === 'listening' ? 'bg-primary' : 'bg-muted-foreground']}
			style:--level={Math.max(0.2, level)}
		></span>
	{/each}
</div>

<style>
	.bar {
		transform: scaleY(0.2);
	}
	[data-phase='listening'] .bar {
		transform: scaleY(var(--level));
	}
	[data-phase='speaking'] .bar {
		transform: scaleY(0.45);
	}
	@media (prefers-reduced-motion: no-preference) {
		.bar {
			transition: transform 0.06s linear;
		}
		[data-phase='speaking'] .bar {
			animation: level 0.55s ease-in-out infinite alternate;
		}
		[data-phase='speaking'] .bar:nth-child(2n) {
			animation-delay: -0.2s;
		}
		[data-phase='speaking'] .bar:nth-child(3n) {
			animation-delay: -0.4s;
		}
	}
	@keyframes level {
		from {
			transform: scaleY(0.2);
		}
		to {
			transform: scaleY(0.7);
		}
	}
</style>
