<script lang="ts">
	import { goto } from '$app/navigation';
	import { unlockAudio } from '$lib/voice.svelte';
	import { page } from '$app/state';
	import { MediaQuery } from 'svelte/reactivity';
	import { errorMessage, request } from '$lib/api';
	import KeyTag from '$lib/components/KeyTag.svelte';
	import ListRow from '$lib/components/ListRow.svelte';
	import ScenarioBrief from '$lib/components/ScenarioBrief.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Item from '$lib/components/ui/item';
	import * as Sheet from '$lib/components/ui/sheet';
	import { Spinner } from '$lib/components/ui/spinner';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import { doneScenarios, type LearnerProfile } from '$lib/profile';
	import { findScenario, scenarios, type Scenario } from '$lib/scenarios';
	import type { Area } from '$lib/types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const profile = $derived(data.profile as LearnerProfile);
	const isDesktop = new MediaQuery('min-width: 900px');
	const done = doneScenarios();
	const requested = findScenario(page.url.searchParams.get('skenario') ?? '');

	let selected = $state(requested ?? scenarios[0]);
	let sheetOpen = $state(Boolean(requested) && !isDesktop.current);
	let starting = $state(false);
	let startError = $state('');

	const area = $derived<Area>(selected.area);
	const items = $derived(scenarios.filter((item) => item.area === area));
	const topics = $derived([...new Set(items.map((item) => item.topic))]);

	function chooseArea(value: string) {
		if (value !== 'Hotel' && value !== 'Restoran') return;
		selected = scenarios.find((item) => item.area === value) ?? selected;
		startError = '';
	}

	function openBrief(item: Scenario) {
		selected = item;
		startError = '';
		sheetOpen = !isDesktop.current;
	}

	async function start() {
		unlockAudio();
		starting = true;
		startError = '';
		try {
			const { id } = await request<{ id: string }>('/api/sessions', {
				method: 'POST',
				json: {
					scenarioId: selected.id,
					nickname: profile.nickname,
					classCode: profile.classCode,
					role: profile.role,
					level: profile.level
				}
			});
			await goto(`/latihan/${id}`);
		} catch (cause) {
			startError = errorMessage(cause);
			starting = false;
		}
	}
</script>

<svelte:head>
	<title>Latihan | Sapa Tamu</title>
</svelte:head>

{#snippet startAction()}
	<div class="flex w-full flex-col gap-3">
		{#if startError}
			<Alert.Root variant="destructive">
				<Alert.Title>Latihan belum bisa dimulai</Alert.Title>
				<Alert.Description>{startError}</Alert.Description>
			</Alert.Root>
		{/if}
		<Button class="h-11 w-full" disabled={starting} onclick={start}>
			{#if starting}
				<Spinner data-icon="inline-start" />
			{/if}
			Mulai latihan
		</Button>
	</div>
{/snippet}

<h1 class="text-3xl font-bold">Latihan</h1>

<div class="desk:grid desk:grid-cols-[minmax(0,1fr)_minmax(18.75rem,23rem)] desk:items-start flex flex-col gap-6">
	<div class="flex min-w-0 flex-col gap-3">
		<ToggleGroup.Root
			type="single"
			variant="outline"
			aria-label="Area kerja"
			class="grid w-full grid-cols-2"
			bind:value={() => area, (value) => chooseArea(value ?? '')}
		>
			<ToggleGroup.Item value="Hotel" class="h-11">Hotel</ToggleGroup.Item>
			<ToggleGroup.Item value="Restoran" class="h-11">Restoran</ToggleGroup.Item>
		</ToggleGroup.Root>

		{#each topics as topic (topic)}
			<section class="flex flex-col gap-2 pt-2">
				<h2 class="text-muted-foreground text-sm font-medium">{topic}</h2>
				<Item.Group class="gap-0 divide-y rounded-lg border">
					{#each items.filter((item) => item.topic === topic) as item (item.id)}
						<ListRow
							title={item.title}
							description={item.guest}
							current={isDesktop.current && item.id === selected.id}
							onclick={() => openBrief(item)}
						>
							{#snippet media()}
								<KeyTag scenario={item} />
							{/snippet}
							{#snippet trailing()}
								{#if done.has(item.id)}
									<Badge class="bg-green-100 text-green-800">Selesai</Badge>
								{/if}
							{/snippet}
						</ListRow>
					{/each}
				</Item.Group>
			</section>
		{/each}
	</div>

	{#if isDesktop.current}
		<Card.Root size="sm" class="desk:sticky desk:top-6 shadow-none" aria-label="Briefing latihan">
			<Card.Header>
				<Card.Title>{selected.title}</Card.Title>
				<Card.Description>{selected.unit} {selected.room}</Card.Description>
			</Card.Header>
			<Card.Content>
				<ScenarioBrief scenario={selected} level={profile.level} />
			</Card.Content>
			<Card.Footer>
				{@render startAction()}
			</Card.Footer>
		</Card.Root>
	{/if}
</div>

<Sheet.Root bind:open={sheetOpen}>
	<Sheet.Content side="bottom" showCloseButton={false} class="max-h-[86dvh] gap-0 overflow-y-auto rounded-t-xl">
		<Sheet.Header class="px-4 pt-2 pb-3">
			<div class="grid grid-cols-[1fr_auto_1fr] items-center">
				<Sheet.Close>
					{#snippet child({ props })}
						<Button variant="ghost" class="-ml-2 h-11 justify-self-start" {...props}>Batal</Button>
					{/snippet}
				</Sheet.Close>
				<Sheet.Description>{selected.unit} {selected.room}</Sheet.Description>
			</div>
			<Sheet.Title class="text-xl font-semibold">{selected.title}</Sheet.Title>
		</Sheet.Header>
		<div class="px-4">
			<ScenarioBrief scenario={selected} level={profile.level} />
		</div>
		<Sheet.Footer class="px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
			{@render startAction()}
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
