<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import { onMount } from 'svelte';
	import { ApiError, errorMessage, request } from '$lib/api';
	import Transcript from '$lib/components/Transcript.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Empty from '$lib/components/ui/empty';
	import * as Field from '$lib/components/ui/field';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import { findScenario } from '$lib/scenarios';
	import type { SessionDetail } from '$lib/types';

	const id = page.params.id ?? '';

	let session = $state.raw<SessionDetail | null>(null);
	let status = $state<'loading' | 'ready' | 'missing' | 'error'>('loading');
	let failure = $state('');
	let scores = $state<number[]>([]);
	let note = $state('');
	let saving = $state(false);
	let saved = $state(false);
	let saveError = $state('');

	const report = $derived(session?.report ?? null);
	const title = $derived(session ? (findScenario(session.scenarioId)?.title ?? session.scenarioId) : '');

	async function load() {
		status = 'loading';
		try {
			const detail = await request<SessionDetail>(`/api/teacher/sessions/${id}`);
			session = detail;
			scores = detail.review?.scores ?? detail.report?.lines.map((line) => line.score) ?? [];
			note = detail.review?.note ?? '';
			status = 'ready';
		} catch (cause) {
			const code = cause instanceof ApiError ? cause.status : 0;
			if (code === 401) {
				await goto('/guru', { replaceState: true });
				return;
			}
			failure = errorMessage(cause);
			status = code === 404 ? 'missing' : 'error';
		}
	}

	function setScore(index: number, value: string) {
		const score = Number(value);
		if (!score) return;
		scores[index] = score;
		saved = false;
	}

	async function save(event: SubmitEvent) {
		event.preventDefault();
		saving = true;
		saved = false;
		saveError = '';
		try {
			await request(`/api/teacher/sessions/${id}`, { method: 'PATCH', json: { scores, note } });
			saved = true;
		} catch (cause) {
			saveError = errorMessage(cause);
		}
		saving = false;
	}

	onMount(load);
</script>

<svelte:head>
	<title>Tinjau latihan | Sapa Tamu</title>
</svelte:head>

<div>
	<Button variant="ghost" class="-ml-2 h-11" href="/guru">
		<ChevronLeftIcon data-icon="inline-start" aria-hidden="true" />
		Kembali
	</Button>
</div>

{#if status === 'loading'}
	<div class="flex max-w-2xl flex-col gap-2" role="status" aria-label="Memuat latihan">
		<Skeleton class="h-9 w-2/3" />
		<Skeleton class="h-40 w-full" />
	</div>
{:else if status === 'missing'}
	<Empty.Root>
		<Empty.Header>
			<Empty.Title>Latihan tidak ditemukan</Empty.Title>
			<Empty.Description>Kembali ke daftar dan pilih latihan lain.</Empty.Description>
		</Empty.Header>
		<Empty.Content>
			<Button class="h-11" href="/guru">Buka daftar guru</Button>
		</Empty.Content>
	</Empty.Root>
{:else if status === 'error'}
	<Alert.Root variant="destructive" class="max-w-2xl">
		<Alert.Title>Latihan belum bisa dimuat</Alert.Title>
		<Alert.Description>{failure}</Alert.Description>
	</Alert.Root>
	<div>
		<Button class="h-11" onclick={load}>Coba lagi</Button>
	</div>
{:else if session}
	<h1 class="text-3xl font-bold text-balance wrap-anywhere">{session.nickname}: {title}</h1>

	<div class="desk:grid desk:grid-cols-2 desk:items-start flex flex-col gap-8">
		<section class="flex min-w-0 flex-col gap-3">
			<h2 class="text-lg font-semibold">Transkrip</h2>
			<Transcript turns={session.turns} nickname={session.nickname} />
		</section>

		{#if report}
			<form onsubmit={save} class="flex min-w-0 flex-col gap-5">
				<h2 class="text-lg font-semibold">Koreksi skor</h2>
				<Field.FieldGroup>
					{#each report.lines as line, index (line.criterion)}
						<Field.FieldSet class="gap-2">
							<Field.FieldLegend variant="label" class="mb-0">{line.criterion}</Field.FieldLegend>
							<ToggleGroup.Root
								type="single"
								variant="outline"
								aria-label="Skor {line.criterion}"
								class="grid w-full grid-cols-4"
								bind:value={() => String(scores[index]), (value) => setScore(index, value ?? '')}
							>
								{#each [1, 2, 3, 4] as score (score)}
									<ToggleGroup.Item value={String(score)} class="h-11 tabular-nums">{score}</ToggleGroup.Item>
								{/each}
							</ToggleGroup.Root>
							<Field.FieldDescription>Skor AI asli: {line.score}/4. {line.reason}</Field.FieldDescription>
							{#if line.quote}
								<blockquote class="text-sm italic wrap-anywhere" lang="en">"{line.quote}"</blockquote>
							{/if}
							{#if line.needsReview}
								<Badge variant="outline">Perlu ditinjau guru</Badge>
							{/if}
						</Field.FieldSet>
					{/each}
					<Field.Field>
						<Field.FieldLabel for="teacher-note">Catatan guru</Field.FieldLabel>
						<Textarea
							id="teacher-note"
							maxlength={1000}
							placeholder="Tulis catatan untuk siswa"
							bind:value={note}
							oninput={() => (saved = false)}
						/>
					</Field.Field>
				</Field.FieldGroup>
				{#if saveError}
					<Alert.Root variant="destructive">
						<Alert.Title>Koreksi belum tersimpan</Alert.Title>
						<Alert.Description>{saveError}</Alert.Description>
					</Alert.Root>
				{/if}
				<p class="text-muted-foreground text-sm" role="status">{saved ? 'Koreksi tersimpan.' : ''}</p>
				<Button type="submit" class="h-11 w-full" disabled={saving}>
					{#if saving}
						<Spinner data-icon="inline-start" />
					{/if}
					Simpan koreksi
				</Button>
			</form>
		{:else}
			<Alert.Root>
				<Alert.Title>Folio belum tersedia</Alert.Title>
				<Alert.Description>Skor bisa dikoreksi setelah siswa membuka hasil latihannya.</Alert.Description>
			</Alert.Root>
		{/if}
	</div>
{/if}
