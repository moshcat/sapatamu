<script lang="ts">
	import type { Snippet } from 'svelte';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import * as Item from '$lib/components/ui/item';

	interface Props {
		title: string;
		description?: string;
		href?: string;
		onclick?: () => void;
		current?: boolean;
		media?: Snippet;
		trailing?: Snippet;
	}

	let { title, description, href, onclick, current = false, media, trailing }: Props = $props();
</script>

{#snippet body()}
	{#if media}
		<Item.Media>{@render media()}</Item.Media>
	{/if}
	<Item.Content>
		<Item.Title>{title}</Item.Title>
		{#if description}
			<Item.Description>{description}</Item.Description>
		{/if}
	</Item.Content>
	<Item.Actions class="text-muted-foreground">
		{@render trailing?.()}
		<ChevronRightIcon class="size-4" aria-hidden="true" />
	</Item.Actions>
{/snippet}

<div role="listitem" class="first:*:rounded-t-lg last:*:rounded-b-lg">
	<Item.Root size="sm" class="hover:bg-muted aria-[current=true]:bg-muted min-h-15 flex-nowrap rounded-none text-left">
		{#snippet child({ props })}
			{#if href}
				<a {href} {...props}>{@render body()}</a>
			{:else}
				<button type="button" aria-current={current ? 'true' : undefined} {onclick} {...props}>{@render body()}</button>
			{/if}
		{/snippet}
	</Item.Root>
</div>
