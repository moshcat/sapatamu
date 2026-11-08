<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { ApiError, errorMessage, request } from '$lib/api';
	import TargetList from '$lib/components/TargetList.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Empty from '$lib/components/ui/empty';
	import { Separator } from '$lib/components/ui/separator';
	import { Spinner } from '$lib/components/ui/spinner';
	import { markScenarioDone, rememberSession } from '$lib/profile';
	import { formatDate } from '$lib/format';
	import { findScenario } from '$lib/scenarios';
	import type { Report, SessionDetail } from '$lib/types';

	const id = page.params.id ?? '';

	let session = $state.raw<SessionDetail | null>(null);
	let status = $state<'loading' | 'ready' | 'missing' | 'unanswered' | 'error'>('loading');
	let failure = $state('');

	const report = $derived(session?.report ?? null);
	const scenario = $derived(session ? findScenario(session.scenarioId) : undefined);

	async function load() {
		status = 'loading';
		try {
			let detail = await request<SessionDetail>(`/api/sessions/${id}`);
			if (!detail.report) {
				const created = await request<Report>(`/api/sessions/${id}/finish`, { method: 'POST' });
				detail = { ...detail, report: created, checksMet: created.checksMet, status: 'finished' };
			}
			session = detail;
			markScenarioDone(detail.scenarioId);
			rememberSession(detail.id);
			status = 'ready';
		} catch (cause) {
			const code = cause instanceof ApiError ? cause.status : 0;
			failure = errorMessage(cause);
			status = code === 404 ? 'missing' : code === 400 ? 'unanswered' : 'error';
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>Folio latihan | Sapa Tamu</title>
</svelte:head>

{#if status === 'loading'}
	<div class="flex min-h-[50dvh] flex-col items-center justify-center gap-3" role="status">
		<Spinner class="size-6" />
		<p class="text-muted-foreground">Menyusun folio dari jawabanmu...</p>
	</div>
{:else if status === 'missing'}
	<Empty.Root>
		<Empty.Header>
			<Empty.Title>Folio tidak ditemukan</Empty.Title>
			<Empty.Description>{failure} Pilih skenario lain untuk berlatih lagi.</Empty.Description>
		</Empty.Header>
		<Empty.Content>
			<Button class="h-11" href="/latihan">Buka daftar latihan</Button>
		</Empty.Content>
	</Empty.Root>
{:else if status === 'unanswered'}
	<Empty.Root>
		<Empty.Header>
			<Empty.Title>Belum ada jawaban</Empty.Title>
			<Empty.Description>{failure} Kembali ke percakapan dan jawab tamu dulu.</Empty.Description>
		</Empty.Header>
		<Empty.Content>
			<Button class="h-11" href="/latihan/{id}">Kembali ke percakapan</Button>
		</Empty.Content>
	</Empty.Root>
{:else if status === 'error'}
	<Alert.Root variant="destructive">
		<Alert.Title>Folio belum bisa dibuat</Alert.Title>
		<Alert.Description>{failure}</Alert.Description>
	</Alert.Root>
	<div class="flex flex-wrap gap-2.5">
		<Button class="h-11" onclick={load}>Coba lagi</Button>
		<Button variant="outline" class="h-11" href="/latihan">Buka daftar latihan</Button>
	</div>
{:else if session && report}
	<header class="flex flex-col gap-1">
		<h1 class="text-3xl font-bold">Latihan selesai</h1>
		<p class="text-muted-foreground">
			{scenario?.title ?? session.scenarioId}{scenario ? `, ${scenario.unit.toLowerCase()} ${scenario.room}` : ''}
		</p>
		<p class="text-muted-foreground hidden print:block">
			{formatDate(session.createdAt)}{session.classCode ? `, kelas ${session.classCode}` : ''}
		</p>
	</header>

	<div class="desk:grid desk:grid-cols-[minmax(0,1fr)_minmax(17.5rem,22.5rem)] desk:items-start flex flex-col gap-6">
		<Card.Root class="min-w-0 shadow-none" size="sm">
			<Card.Header>
				<Card.Title>Folio latihan</Card.Title>
				<Card.Description>{session.nickname}, level {session.level}</Card.Description>
			</Card.Header>
			<Card.Content class="flex flex-col gap-3">
				{#each report.lines as line, index (line.criterion)}
					{@const corrected = session.review?.scores[index]}
					{#if index > 0}
						<Separator />
					{/if}
					<section class="flex flex-col gap-1 text-sm">
						<div class="flex items-baseline justify-between gap-3">
							<h3 class="min-w-0 text-base font-medium">{line.criterion}</h3>
							<span class="shrink-0 text-base font-semibold tabular-nums">{corrected ?? line.score}/4</span>
						</div>
						{#if corrected !== undefined && corrected !== line.score}
							<p class="text-muted-foreground">Dikoreksi guru. Skor AI {line.score}/4.</p>
						{/if}
						{#if line.reason}
							<p class="text-muted-foreground">{line.reason}</p>
						{/if}
						{#if line.quote}
							<blockquote class="italic wrap-anywhere" lang="en">"{line.quote}"</blockquote>
						{/if}
						{#if line.needsReview && !session.review}
							<Badge variant="outline" class="mt-1">Perlu ditinjau guru</Badge>
						{/if}
					</section>
				{/each}
			</Card.Content>
		</Card.Root>

		<div class="flex min-w-0 flex-col gap-5">
			<section class="flex flex-col gap-2">
				<h2 class="text-lg font-semibold">Target</h2>
				<TargetList checks={scenario?.checks ?? []} met={report.checksMet} />
			</section>
			{#if report.better}
				<Alert.Root role="note">
					<Alert.Title>Coba katakan seperti ini</Alert.Title>
					<Alert.Description>
						<blockquote class="italic" lang="en">{report.better}</blockquote>
					</Alert.Description>
				</Alert.Root>
			{/if}
			{#if session.review?.note}
				<Alert.Root role="note">
					<Alert.Title>Catatan guru</Alert.Title>
					<Alert.Description class="whitespace-pre-line">{session.review.note}</Alert.Description>
				</Alert.Root>
			{/if}
			<div class="flex flex-col gap-2.5 print:hidden">
				<Button class="h-11" href="/latihan">Kembali ke daftar latihan</Button>
				<Button variant="outline" class="h-11" href="/latihan?skenario={session.scenarioId}">Ulangi latihan ini</Button>
				<Button variant="outline" class="h-11" onclick={() => window.print()}>Cetak atau simpan PDF</Button>
			</div>
		</div>
	</div>

	<p class="text-muted-foreground text-sm">
		Skor untuk latihan, bukan nilai resmi. AI menyusun skor ini dan guru dapat mengoreksinya. Pelafalan belum dinilai.
	</p>
{/if}
