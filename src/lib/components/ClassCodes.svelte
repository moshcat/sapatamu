<script lang="ts">
	import { onMount } from 'svelte';
	import { errorMessage, request } from '$lib/api';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import * as Item from '$lib/components/ui/item';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Spinner } from '$lib/components/ui/spinner';
	import { CLASS_DAILY_SESSIONS, type ClassCode } from '$lib/types';

	let { onpick }: { onpick: (code: string) => void } = $props();

	let classes = $state.raw<ClassCode[] | null>(null);
	let loadError = $state('');
	let name = $state('');
	let nameError = $state('');
	let creating = $state(false);
	let copied = $state('');
	let removing = $state<ClassCode | null>(null);
	let removeError = $state('');
	let deleting = $state(false);
	let copiedTimer: ReturnType<typeof setTimeout> | undefined;

	async function load() {
		loadError = '';
		try {
			classes = await request<ClassCode[]>('/api/teacher/classes');
		} catch (cause) {
			loadError = errorMessage(cause);
		}
	}

	async function create(event: SubmitEvent) {
		event.preventDefault();
		nameError = name.trim() ? '' : 'Isi nama kelas dulu.';
		if (nameError) {
			document.getElementById('class-name')?.focus();
			return;
		}
		creating = true;
		try {
			const created = await request<ClassCode>('/api/teacher/classes', { method: 'POST', json: { name } });
			classes = [created, ...(classes ?? [])];
			name = '';
		} catch (cause) {
			nameError = errorMessage(cause);
		}
		creating = false;
	}

	async function copy(code: string) {
		try {
			await navigator.clipboard.writeText(code);
			copied = code;
			clearTimeout(copiedTimer);
			copiedTimer = setTimeout(() => (copied = ''), 2000);
		} catch {
			copied = '';
		}
	}

	async function remove() {
		if (!removing) return;
		const { code } = removing;
		deleting = true;
		removeError = '';
		try {
			await request(`/api/teacher/classes/${code}`, { method: 'DELETE' });
			classes = (classes ?? []).filter((item) => item.code !== code);
			removing = null;
		} catch (cause) {
			removeError = errorMessage(cause);
		}
		deleting = false;
	}

	onMount(() => {
		void load();
		return () => clearTimeout(copiedTimer);
	});
</script>

<section class="flex flex-col gap-3" aria-labelledby="classes-title">
	<h2 id="classes-title" class="text-xl font-semibold">Kelas</h2>

	<form novalidate onsubmit={create} class="flex flex-col gap-2">
		<Field.Field data-invalid={nameError ? true : undefined}>
			<Field.FieldLabel for="class-name">Nama kelas</Field.FieldLabel>
			<div class="flex gap-2">
				<Input
					id="class-name"
					class="h-11 min-w-0 flex-1"
					maxlength={40}
					autocomplete="off"
					placeholder="Contoh: XI Perhotelan 1"
					aria-invalid={nameError ? true : undefined}
					aria-describedby="class-name-help"
					bind:value={name}
				/>
				<Button type="submit" class="h-11" disabled={creating}>
					{#if creating}
						<Spinner data-icon="inline-start" />
					{/if}
					Buat kode
				</Button>
			</div>
			{#if nameError}
				<Field.FieldError id="class-name-help">{nameError}</Field.FieldError>
			{:else}
				<Field.FieldDescription id="class-name-help">
					Bagikan kode ke siswa. Satu kelas mendapat {CLASS_DAILY_SESSIONS} sesi latihan per hari.
				</Field.FieldDescription>
			{/if}
		</Field.Field>
	</form>

	{#if loadError}
		<Alert.Root variant="destructive">
			<Alert.Title>Daftar kelas belum bisa dimuat</Alert.Title>
			<Alert.Description>{loadError}</Alert.Description>
		</Alert.Root>
		<div>
			<Button variant="outline" class="h-11" onclick={load}>Coba lagi</Button>
		</div>
	{:else if classes === null}
		<Skeleton class="h-15 w-full" />
	{:else if classes.length === 0}
		<p class="text-muted-foreground text-sm">Belum ada kelas. Buat kode pertamamu di atas.</p>
	{:else}
		<Item.Group class="gap-0 divide-y rounded-lg border">
			{#each classes as item (item.code)}
				<div role="listitem">
					<Item.Root size="sm" class="flex-wrap rounded-none">
						<Item.Content class="min-w-40">
							<Item.Title class="text-lg font-semibold tabular-nums">{item.code}</Item.Title>
							<Item.Description>{item.name}, {item.finished} latihan selesai</Item.Description>
						</Item.Content>
						<Item.Actions class="flex-wrap">
							<Button variant="outline" class="h-11" aria-label="Salin kode {item.code}" onclick={() => copy(item.code)}>
								{copied === item.code ? 'Tersalin' : 'Salin'}
							</Button>
							<Button variant="outline" class="h-11" aria-label="Lihat latihan kelas {item.name}" onclick={() => onpick(item.code)}>
								Latihan
							</Button>
							<Button variant="ghost" class="text-destructive h-11" aria-label="Hapus kelas {item.name}" onclick={() => (removing = item)}>
								Hapus
							</Button>
						</Item.Actions>
					</Item.Root>
				</div>
			{/each}
		</Item.Group>
	{/if}
</section>

<Dialog.Root bind:open={() => removing !== null, (open) => { if (!open) { removing = null; removeError = ''; } }}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Hapus {removing?.name}?</Dialog.Title>
			<Dialog.Description>
				Kode {removing?.code} tidak bisa dipakai lagi. Latihan siswa yang sudah selesai tetap tersimpan.
			</Dialog.Description>
		</Dialog.Header>
		{#if removeError}
			<Alert.Root variant="destructive">
				<Alert.Description>{removeError}</Alert.Description>
			</Alert.Root>
		{/if}
		<Dialog.Footer>
			<Dialog.Close>
				{#snippet child({ props })}
					<Button variant="outline" class="h-11" {...props}>Batal</Button>
				{/snippet}
			</Dialog.Close>
			<Button variant="destructive" class="h-11" disabled={deleting} onclick={remove}>
				{#if deleting}
					<Spinner data-icon="inline-start" />
				{/if}
				Hapus kelas
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
