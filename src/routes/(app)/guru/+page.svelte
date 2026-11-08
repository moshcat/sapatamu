<script lang="ts">
	import { onMount } from 'svelte';
	import { ApiError, errorMessage, request } from '$lib/api';
	import ClassCodes from '$lib/components/ClassCodes.svelte';
	import ClassRecap from '$lib/components/ClassRecap.svelte';
	import ListRow from '$lib/components/ListRow.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Empty from '$lib/components/ui/empty';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import * as Item from '$lib/components/ui/item';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Spinner } from '$lib/components/ui/spinner';
	import { formatDate } from '$lib/format';
	import { findScenario } from '$lib/scenarios';
	import type { SessionSummary } from '$lib/types';

	let view = $state<'checking' | 'login' | 'list'>('checking');
	let pin = $state('');
	let pinError = $state('');
	let loggingIn = $state(false);

	let sessions = $state.raw<SessionSummary[]>([]);
	let classFilter = $state('');
	// Rekap hanya untuk kelas yang dipilih dari daftar, bukan saringan bebas.
	let recapCode = $state('');
	let listing = $state(false);
	let failure = $state('');

	let latestQuery = 0;
	let filterTimer: ReturnType<typeof setTimeout> | undefined;

	async function loadSessions() {
		const query = (latestQuery += 1);
		listing = true;
		failure = '';
		try {
			const code = encodeURIComponent(classFilter.trim());
			const rows = await request<SessionSummary[]>(`/api/teacher/sessions?class=${code}`);
			if (query !== latestQuery) return;
			sessions = rows;
			view = 'list';
		} catch (cause) {
			if (query !== latestQuery) return;
			if (cause instanceof ApiError && cause.status === 401) {
				view = 'login';
			} else {
				failure = errorMessage(cause);
				view = 'list';
			}
		}
		listing = false;
	}

	async function login(event: SubmitEvent) {
		event.preventDefault();
		if (!pin.trim()) {
			pinError = 'Isi PIN guru untuk melanjutkan.';
			document.getElementById('pin')?.focus();
			return;
		}
		loggingIn = true;
		pinError = '';
		try {
			await request('/api/teacher/login', { method: 'POST', json: { pin } });
			pin = '';
			await loadSessions();
		} catch (cause) {
			pinError = errorMessage(cause);
			document.getElementById('pin')?.focus();
		}
		loggingIn = false;
	}

	function filterChanged() {
		recapCode = '';
		clearTimeout(filterTimer);
		filterTimer = setTimeout(loadSessions, 250);
	}

	function showClass(code: string) {
		classFilter = code;
		recapCode = code;
		void loadSessions();
	}

	function clearFilter() {
		classFilter = '';
		recapCode = '';
		void loadSessions();
	}

	onMount(() => {
		void loadSessions();
		return () => clearTimeout(filterTimer);
	});
</script>

<svelte:head>
	<title>Guru | Sapa Tamu</title>
</svelte:head>

<h1 class="text-3xl font-bold">Guru</h1>

{#if view === 'checking'}
	<div class="flex max-w-2xl flex-col gap-2" role="status" aria-label="Memuat daftar latihan">
		<Skeleton class="h-15 w-full" />
		<Skeleton class="h-15 w-full" />
	</div>
{:else if view === 'login'}
	<form novalidate onsubmit={login} class="flex max-w-sm flex-col gap-4">
		<Field.Field data-invalid={Boolean(pinError) || undefined}>
			<Field.FieldLabel for="pin">PIN guru</Field.FieldLabel>
			<Input
				id="pin"
				type="password"
				inputmode="numeric"
				autocomplete="off"
				class="h-11"
				aria-invalid={Boolean(pinError) || undefined}
				aria-describedby="pin-help"
				bind:value={pin}
			/>
			{#if pinError}
				<Field.FieldError id="pin-help">{pinError}</Field.FieldError>
			{:else}
				<Field.FieldDescription id="pin-help">PIN diatur oleh pengelola sekolah.</Field.FieldDescription>
			{/if}
		</Field.Field>
		<Button type="submit" class="h-11 w-full" disabled={loggingIn}>
			{#if loggingIn}
				<Spinner data-icon="inline-start" />
			{/if}
			Buka daftar latihan
		</Button>
	</form>
{:else}
	<div class="flex max-w-2xl flex-col gap-4">
		<ClassCodes onpick={showClass} />

		{#if recapCode}
			{#key recapCode}
				<ClassRecap code={recapCode} />
			{/key}
		{/if}

		<h2 class="pt-2 text-xl font-semibold">Latihan siswa</h2>
		<Field.Field>
			<Field.FieldLabel for="class-filter">Saring kode kelas</Field.FieldLabel>
			<Input
				id="class-filter"
				class="h-11"
				autocomplete="off"
				maxlength={20}
				bind:value={classFilter}
				oninput={filterChanged}
			/>
		</Field.Field>

		{#if failure}
			<Alert.Root variant="destructive">
				<Alert.Title>Daftar belum bisa dimuat</Alert.Title>
				<Alert.Description>{failure}</Alert.Description>
			</Alert.Root>
			<div>
				<Button class="h-11" onclick={loadSessions}>Coba lagi</Button>
			</div>
		{:else if sessions.length === 0 && !listing}
			<Empty.Root>
				<Empty.Header>
					<Empty.Title>{classFilter.trim() ? 'Tidak ada latihan untuk kode ini' : 'Belum ada latihan selesai'}</Empty.Title>
					<Empty.Description>
						{classFilter.trim()
							? 'Periksa kode kelasnya atau hapus saringan.'
							: 'Bagikan kode kelas ke siswa. Latihan yang selesai dengan kode itu muncul di sini.'}
					</Empty.Description>
				</Empty.Header>
				{#if classFilter.trim()}
					<Empty.Content>
						<Button variant="outline" class="h-11" onclick={clearFilter}>Hapus saringan</Button>
					</Empty.Content>
				{/if}
			</Empty.Root>
		{:else}
			<Item.Group class="gap-0 divide-y rounded-lg border">
				{#each sessions as session (session.id)}
					<ListRow
						title="{session.nickname}, {session.classCode}"
						description="{findScenario(session.scenarioId)?.title ?? session.scenarioId}, {formatDate(session.createdAt)}"
						href="/guru/{session.id}"
					>
						{#snippet trailing()}
							<Badge variant={session.reviewed ? 'secondary' : 'outline'}>
								{session.reviewed ? 'Ditinjau' : 'Belum ditinjau'}
							</Badge>
						{/snippet}
					</ListRow>
				{/each}
			</Item.Group>
		{/if}
	</div>
{/if}
