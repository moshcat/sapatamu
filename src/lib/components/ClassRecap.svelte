<script lang="ts">
	import { onMount } from 'svelte';
	import { errorMessage, request } from '$lib/api';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import { Separator } from '$lib/components/ui/separator';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import type { ClassRecap } from '$lib/types';

	let { code }: { code: string } = $props();

	let recap = $state.raw<ClassRecap | null>(null);
	let failure = $state('');

	const score = (value: number) => value.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

	async function load() {
		failure = '';
		recap = null;
		try {
			recap = await request<ClassRecap>(`/api/teacher/classes/${encodeURIComponent(code)}/recap`);
		} catch (cause) {
			failure = errorMessage(cause);
		}
	}

	onMount(load);
</script>

<section aria-labelledby="recap-title" class="flex flex-col gap-3">
	<h2 id="recap-title" class="pt-2 text-xl font-semibold">Rekap kelas {code}</h2>

	{#if failure}
		<Alert.Root variant="destructive">
			<Alert.Title>Rekap belum bisa dimuat</Alert.Title>
			<Alert.Description>{failure}</Alert.Description>
		</Alert.Root>
		<div>
			<Button variant="outline" class="h-11" onclick={load}>Coba lagi</Button>
		</div>
	{:else if !recap}
		<div class="flex flex-col gap-2" role="status" aria-label="Memuat rekap kelas">
			<Skeleton class="h-6 w-2/3" />
			<Skeleton class="h-40 w-full" />
		</div>
	{:else if recap.sessions === 0}
		<p class="text-muted-foreground text-sm">Rekap muncul setelah siswa menyelesaikan latihan dengan kode ini.</p>
	{:else}
		<Card.Root class="shadow-none" size="sm">
			<Card.Header>
				{#if recap.weakest}
					<Card.Title class="font-semibold group-data-[size=sm]/card:text-base">Paling perlu dilatih: {recap.weakest}</Card.Title>
				{:else}
					<Card.Title class="font-semibold group-data-[size=sm]/card:text-base">Ringkasan kelas</Card.Title>
				{/if}
				<Card.Description>
					{recap.sessions} latihan dari {recap.students} siswa. {recap.reviewed} sudah ditinjau guru.
				</Card.Description>
			</Card.Header>
			<Card.Content class="flex flex-col gap-3">
				{#each recap.criteria as item (item.criterion)}
					<div class="flex flex-col gap-1.5 text-sm">
						<div class="flex items-baseline justify-between gap-3">
							<span class={item.criterion === recap.weakest ? 'font-semibold' : 'font-medium'}>{item.criterion}</span>
							<span class="shrink-0 font-semibold tabular-nums">{item.average === null ? '-' : `${score(item.average)}/4`}</span>
						</div>
						<Progress value={item.average ?? 0} max={4} aria-label="Rata-rata {item.criterion}" />
					</div>
				{/each}
				{#if recap.targetRate !== null}
					<p class="text-muted-foreground text-sm">Target skenario tercapai {recap.targetRate}% dari semua latihan.</p>
				{/if}

				<Separator />

				<div class="flex flex-col gap-2 text-sm">
					<h3 class="font-medium">Siswa yang perlu dibantu</h3>
					{#if recap.needsHelp.length}
						<ul class="flex flex-col gap-1">
							{#each recap.needsHelp as student (student.nickname)}
								<li class="flex items-baseline justify-between gap-3">
									<span class="min-w-0 truncate">{student.nickname}</span>
									<span class="text-muted-foreground shrink-0 tabular-nums">
										{score(student.average)}/4, {student.sessions} latihan
									</span>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="text-muted-foreground">Semua siswa rata-rata 3 ke atas.</p>
					{/if}
				</div>
			</Card.Content>
			<Card.Footer>
				<p class="text-muted-foreground text-sm">Rata-rata memakai skor guru untuk latihan yang sudah dikoreksi, selain itu skor AI.</p>
			</Card.Footer>
		</Card.Root>
	{/if}
</section>
