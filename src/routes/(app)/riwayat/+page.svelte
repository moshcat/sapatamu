<script lang="ts">
	import { onMount } from 'svelte';
	import { errorMessage, request } from '$lib/api';
	import KeyTag from '$lib/components/KeyTag.svelte';
	import ListRow from '$lib/components/ListRow.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Empty from '$lib/components/ui/empty';
	import * as Item from '$lib/components/ui/item';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { formatDate } from '$lib/format';
	import { sessionIds } from '$lib/profile';
	import { findScenario } from '$lib/scenarios';
	import type { SessionSummary } from '$lib/types';

	let sessions = $state.raw<SessionSummary[]>([]);
	let loading = $state(true);
	let failure = $state('');

	async function load() {
		loading = true;
		failure = '';
		const ids = sessionIds();
		try {
			sessions = ids.length ? await request<SessionSummary[]>(`/api/sessions?ids=${ids.join(',')}`) : [];
		} catch (cause) {
			failure = errorMessage(cause);
		}
		loading = false;
	}

	onMount(load);
</script>

<svelte:head>
	<title>Riwayat | Sapa Tamu</title>
</svelte:head>

<h1 class="text-3xl font-bold">Riwayat</h1>

{#if loading}
	<div class="flex max-w-2xl flex-col gap-2" role="status" aria-label="Memuat riwayat">
		<Skeleton class="h-15 w-full" />
		<Skeleton class="h-15 w-full" />
		<Skeleton class="h-15 w-full" />
	</div>
{:else if failure}
	<Alert.Root variant="destructive" class="max-w-2xl">
		<Alert.Title>Riwayat belum bisa dimuat</Alert.Title>
		<Alert.Description>{failure}</Alert.Description>
	</Alert.Root>
	<div>
		<Button class="h-11" onclick={load}>Coba lagi</Button>
	</div>
{:else if sessions.length === 0}
	<Empty.Root>
		<Empty.Header>
			<Empty.Title>Belum ada folio</Empty.Title>
			<Empty.Description>Selesaikan satu latihan, lalu folionya muncul di sini.</Empty.Description>
		</Empty.Header>
		<Empty.Content>
			<Button class="h-11" href="/latihan">Buka daftar latihan</Button>
		</Empty.Content>
	</Empty.Root>
{:else}
	<Item.Group class="max-w-2xl gap-0 divide-y rounded-lg border">
		{#each sessions as session (session.id)}
			{@const scenario = findScenario(session.scenarioId)}
			<ListRow
				title={scenario?.title ?? session.scenarioId}
				description={formatDate(session.createdAt)}
				href="/folio/{session.id}"
			>
				{#snippet media()}
					{#if scenario}
						<KeyTag {scenario} />
					{/if}
				{/snippet}
				{#snippet trailing()}
					{#if session.reviewed}
						<Badge variant="secondary">Ditinjau guru</Badge>
					{/if}
				{/snippet}
			</ListRow>
		{/each}
	</Item.Group>
{/if}
