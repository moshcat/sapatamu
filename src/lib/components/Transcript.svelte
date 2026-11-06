<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import type { Turn } from '$lib/types';
	import { cn } from '$lib/utils';

	let { turns, nickname, follow = false }: { turns: Turn[]; nickname: string; follow?: boolean } = $props();

	const followLatest: Attachment<HTMLElement> = (node) => {
		if (follow && turns.length) node.lastElementChild?.scrollIntoView({ block: 'nearest' });
	};
</script>

<ol class="flex flex-col gap-2.5" {@attach followLatest}>
	{#each turns as turn, index (index)}
		<li
			class={cn(
				'max-w-[92%] rounded-lg px-3 py-2 text-sm wrap-anywhere',
				turn.role === 'guest' ? 'bg-muted self-start' : 'self-end border'
			)}
		>
			<span class="text-muted-foreground block text-xs">{turn.role === 'guest' ? 'Tamu' : nickname}</span>
			<span lang="en">{turn.text}</span>
		</li>
	{/each}
</ol>
