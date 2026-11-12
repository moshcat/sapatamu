<script lang="ts">
	import { goto } from '$app/navigation';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import Kamboja from '$lib/components/Kamboja.svelte';
	import ListRow from '$lib/components/ListRow.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import * as Item from '$lib/components/ui/item';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Spinner } from '$lib/components/ui/spinner';
	import { errorMessage, request } from '$lib/api';
	import { homePath, readProfile, saveProfile, type Profile } from '$lib/profile';
	import type { Level, Role } from '$lib/types';

	const roleOptions: { role: Role | 'Guru'; hint: string }[] = [
		{ role: 'Siswa SMK', hint: 'Berlatih untuk kelas dan PKL.' },
		{ role: 'Lulusan SMK/D1-D3', hint: 'Bersiap untuk magang atau kerja.' },
		{ role: 'Pekerja pariwisata', hint: 'Melatih percakapan dengan tamu.' },
		{ role: 'Guru', hint: 'Meninjau latihan siswa.' }
	];

	const levelOptions: { level: Level; hint: string }[] = [
		{ level: 'Dasar', hint: 'Tamu memakai kalimat pendek.' },
		{ level: 'Menengah', hint: 'Tamu bertanya lebih rinci.' },
		{ level: 'Mahir', hint: 'Tamu lebih menuntut, tanpa kalimat bantu.' }
	];

	// Profil lama mengisi formulir saat siswa membuka Ganti peran, dan tetap berlaku sampai profil baru disimpan.
	const previous = readProfile();
	const learner = previous?.role === 'Guru' ? null : previous;

	let step = $state(1);
	let role = $state<Role>(learner?.role ?? 'Siswa SMK');
	let nickname = $state(learner?.nickname ?? '');
	let classCode = $state(learner?.classCode ?? '');
	let level = $state<string>(learner?.level ?? 'Dasar');
	let nicknameMissing = $state(false);
	let codeError = $state('');
	let checkingCode = $state(false);

	const isStudent = $derived(role === 'Siswa SMK');

	const focusHeading = (node: HTMLElement) => node.focus({ preventScroll: true });

	function enter(profile: Profile) {
		saveProfile(profile);
		void goto(homePath(profile));
	}

	function chooseRole(choice: Role | 'Guru') {
		if (choice === 'Guru') {
			enter({ role: 'Guru' });
			return;
		}
		if (choice !== learner?.role) level = choice === 'Siswa SMK' ? 'Dasar' : 'Menengah';
		role = choice;
		step = 2;
	}

	async function submitIdentity(event: SubmitEvent) {
		event.preventDefault();
		nickname = nickname.trim();
		codeError = '';
		nicknameMissing = !nickname;
		if (nicknameMissing) {
			document.getElementById('nickname')?.focus();
			return;
		}
		const code = classCode.trim();
		if (code) {
			checkingCode = true;
			try {
				await request('/api/access', { method: 'POST', json: { code } });
			} catch (cause) {
				codeError = errorMessage(cause);
				document.getElementById('class-code')?.focus();
				return;
			} finally {
				checkingCode = false;
			}
		}
		step = 3;
	}

	function finish(event: SubmitEvent) {
		event.preventDefault();
		enter({ role, nickname, classCode: classCode.trim(), level: level as Level });
	}
</script>

<svelte:head>
	<title>Sapa Tamu</title>
</svelte:head>

{#snippet back()}
	<div>
		<Button variant="ghost" class="-ml-2 h-11" onclick={() => (step -= 1)}>
			<ChevronLeftIcon data-icon="inline-start" aria-hidden="true" />
			Kembali
		</Button>
	</div>
{/snippet}

<main
	class="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-5 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
>
	{#if step === 1}
		{#if previous}
			<div>
				<Button variant="ghost" class="-ml-2 h-11" href={homePath(previous)}>Batal</Button>
			</div>
		{/if}
		<header class="flex flex-col gap-3">
			<div class="flex items-center gap-3">
				<Kamboja emotion="senang" class="w-16" />
				<span class="text-lg font-semibold">Sapa Tamu</span>
			</div>
			<p class="text-muted-foreground text-sm">Langkah 1 dari 3</p>
			<h1 class="text-3xl font-bold text-balance outline-none" tabindex="-1" {@attach focusHeading}>
				Kamu masuk sebagai apa?
			</h1>
			<p class="text-muted-foreground">Latihan percakapan bahasa Inggris untuk pekerjaan di hotel dan restoran.</p>
		</header>
		<Item.Group class="gap-0 divide-y rounded-lg border">
			{#each roleOptions as option (option.role)}
				<ListRow title={option.role} description={option.hint} onclick={() => chooseRole(option.role)} />
			{/each}
		</Item.Group>
	{:else if step === 2}
		{@render back()}
		<header class="flex flex-col gap-2">
			<p class="text-muted-foreground text-sm">Langkah 2 dari 3</p>
			<h1 class="text-3xl font-bold text-balance outline-none" tabindex="-1" {@attach focusHeading}>
				{isStudent ? 'Isi data siswa' : 'Isi nama panggilan'}
			</h1>
		</header>
		<form novalidate onsubmit={submitIdentity} class="flex flex-1 flex-col gap-5">
			<Field.FieldGroup>
				<Field.Field data-invalid={nicknameMissing || undefined}>
					<Field.FieldLabel for="nickname">Nama panggilan</Field.FieldLabel>
					<Input
						id="nickname"
						class="h-11"
						maxlength={40}
						autocomplete="off"
						aria-invalid={nicknameMissing || undefined}
						aria-describedby="nickname-help"
						bind:value={nickname}
					/>
					{#if nicknameMissing}
						<Field.FieldError id="nickname-help">Isi nama panggilan untuk melanjutkan.</Field.FieldError>
					{:else}
						<Field.FieldDescription id="nickname-help">Jangan menulis data pribadi.</Field.FieldDescription>
					{/if}
				</Field.Field>
				<Field.Field data-invalid={codeError ? true : undefined}>
					<Field.FieldLabel for="class-code">Kode akses (opsional)</Field.FieldLabel>
					<Input
						id="class-code"
						class="h-11"
						maxlength={20}
						autocomplete="off"
						aria-invalid={codeError ? true : undefined}
						aria-describedby="class-code-help"
						bind:value={classCode}
					/>
					{#if codeError}
						<Field.FieldError id="class-code-help">{codeError}</Field.FieldError>
					{:else}
						<Field.FieldDescription id="class-code-help">
							Dari guru atau panitia. Kosongkan kalau berlatih sendiri.
						</Field.FieldDescription>
					{/if}
				</Field.Field>
			</Field.FieldGroup>
			<Button type="submit" class="mt-auto h-11 w-full" disabled={checkingCode}>
				{#if checkingCode}
					<Spinner data-icon="inline-start" />
				{/if}
				Lanjut
			</Button>
		</form>
	{:else}
		{@render back()}
		<header class="flex flex-col gap-2">
			<p class="text-muted-foreground text-sm">Langkah 3 dari 3</p>
			<h1 class="text-3xl font-bold text-balance outline-none" tabindex="-1" {@attach focusHeading}>
				Pilih level latihan
			</h1>
		</header>
		<form onsubmit={finish} class="flex flex-1 flex-col gap-5">
			<Field.FieldSet>
				<Field.FieldLegend class="sr-only">Level latihan</Field.FieldLegend>
				<RadioGroup.Root bind:value={level} class="gap-2">
					{#each levelOptions as option (option.level)}
						<Field.FieldLabel for="level-{option.level}">
							<Field.Field orientation="horizontal">
								<Field.FieldContent>
									<Field.FieldTitle>{option.level}</Field.FieldTitle>
									<Field.FieldDescription>{option.hint}</Field.FieldDescription>
								</Field.FieldContent>
								<RadioGroup.Item id="level-{option.level}" value={option.level} />
							</Field.Field>
						</Field.FieldLabel>
					{/each}
				</RadioGroup.Root>
			</Field.FieldSet>
			<Button type="submit" class="mt-auto h-11 w-full">Buka daftar latihan</Button>
		</form>
	{/if}
</main>
