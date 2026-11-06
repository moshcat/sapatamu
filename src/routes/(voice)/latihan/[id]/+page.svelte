<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import Kamboja from '$lib/components/Kamboja.svelte';
	import TargetList from '$lib/components/TargetList.svelte';
	import Transcript from '$lib/components/Transcript.svelte';
	import VoiceLevel from '$lib/components/VoiceLevel.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import * as Empty from '$lib/components/ui/empty';
	import * as Field from '$lib/components/ui/field';
	import { Progress } from '$lib/components/ui/progress';
	import * as Sheet from '$lib/components/ui/sheet';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Textarea } from '$lib/components/ui/textarea';
	import { moodLabels, phaseLabels, unlockAudio, VoiceSession } from '$lib/voice.svelte';

	const id = page.params.id ?? '';
	const folioPath = `/folio/${id}`;
	const voice = new VoiceSession(id, () => void goto(folioPath, { replaceState: true }));

	let optionsOpen = $state(false);
	let typed = $state('');
	let typedMissing = $state(false);

	const nickname = $derived(voice.session?.nickname ?? 'Kamu');
	const busy = $derived(voice.phase === 'thinking' || voice.phase === 'loading');
	const micLabel = $derived(
		voice.phase === 'speaking' ? 'Potong tamu' : voice.phase === 'listening' ? 'Jeda mikrofon' : 'Bicara sekarang'
	);

	onMount(() => {
		void voice.load();
		return () => voice.destroy();
	});

	function setOptions(open: boolean) {
		optionsOpen = open;
		voice.setHold(open);
	}

	function leave() {
		const target = voice.answered ? folioPath : '/latihan';
		voice.destroy();
		void goto(target);
	}

	function submitTyped(event: SubmitEvent) {
		event.preventDefault();
		const text = typed.trim();
		typedMissing = !text;
		if (typedMissing) {
			document.getElementById('typed-answer')?.focus();
			return;
		}
		voice.submitText(text);
		typed = '';
		setOptions(false);
	}
</script>

<svelte:head>
	<title>{voice.scenario?.title ?? 'Latihan'} | Sapa Tamu</title>
</svelte:head>

<svelte:window onpagehide={() => voice.suspend()} onpointerdown={unlockAudio} />

{#if voice.loadError}
	<main class="flex min-h-dvh items-center justify-center px-4">
		<Empty.Root>
			<Empty.Header>
				<Empty.Title>{voice.loadError.missing ? 'Latihan tidak ditemukan' : 'Latihan belum bisa dibuka'}</Empty.Title>
				<Empty.Description>{voice.loadError.message}</Empty.Description>
			</Empty.Header>
			<Empty.Content>
				{#if !voice.loadError.missing}
					<Button class="h-11" onclick={() => voice.load()}>Coba lagi</Button>
				{/if}
				<Button variant="outline" class="h-11" href="/latihan">Buka daftar latihan</Button>
			</Empty.Content>
		</Empty.Root>
	</main>
{:else}
	<main
		class="desk:h-dvh desk:overflow-hidden desk:px-8 mx-auto flex min-h-dvh w-full max-w-280 flex-col gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
	>
		<header class="flex flex-col gap-2">
			<div class="desk:grid desk:grid-cols-[1fr_auto_1fr] flex items-center gap-3">
				<Button variant="outline" class="h-11 justify-self-start" onclick={leave}>Akhiri</Button>
				<h1 class="min-w-0 text-sm font-semibold">{voice.scenario?.title ?? ''}</h1>
			</div>
			<Progress value={voice.progress} class="h-1" aria-label="Target tercapai" />
		</header>

		<div class="desk:grid desk:grid-cols-[minmax(0,1fr)_21rem] desk:gap-8 flex min-h-0 flex-1 flex-col gap-4">
			<div class="flex min-h-0 flex-1 flex-col gap-4">
				<section
					aria-label="Percakapan suara"
					class="flex flex-1 flex-col items-center justify-center gap-2.5 text-center"
				>
					<Kamboja
						phase={voice.phase}
						emotion={voice.emotion}
						disabled={!voice.canRepeat}
						onrepeat={() => voice.repeat()}
						class="w-[min(clamp(10.5rem,50vw,15rem),32dvh)]"
					/>
					<VoiceLevel phase={voice.phase} levels={voice.levels} />
					<p class="font-semibold" role="status">{phaseLabels[voice.phase]}</p>
					<p class="text-muted-foreground text-sm">{moodLabels[voice.emotion]}</p>
					<p class="max-w-[30ch] text-xl font-medium wrap-anywhere text-balance" lang="en">{voice.guestLine}</p>
					{#if voice.voiceNote}
						<p class="text-muted-foreground text-sm">{voice.voiceNote}</p>
					{/if}
					{#if voice.lastAnswer}
						<p class="text-muted-foreground max-w-[44ch] text-sm wrap-anywhere" lang="en">{voice.lastAnswer}</p>
					{/if}
					{#if voice.notice}
						<Alert.Root variant={voice.phase === 'done' || voice.notice.offerListen ? 'default' : 'destructive'} class="max-w-md">
							<Alert.Description>{voice.notice.message}</Alert.Description>
							{#if voice.notice.offerListen}
								<Button class="mt-2 h-11" onclick={() => voice.repeat()}>Dengarkan tamu</Button>
							{/if}
							{#if voice.notice.offerTyping}
								<Button variant="outline" class="mt-2 h-11" onclick={() => setOptions(true)}>Ketik jawaban</Button>
							{/if}
						</Alert.Root>
					{/if}
				</section>

				<div class="mx-auto grid w-full max-w-115 grid-cols-[minmax(0,1fr)_auto] gap-2.5">
					{#if voice.phase === 'done'}
						<Button class="h-11" href={folioPath}>Lihat hasil</Button>
					{:else if voice.phase === 'error'}
						<Button class="h-11" onclick={() => voice.retry()}>Coba lagi</Button>
					{:else}
						<Button class="h-11" disabled={busy} onclick={() => voice.micAction()}>
							{#if busy}
								<Spinner data-icon="inline-start" />
							{/if}
							{micLabel}
						</Button>
					{/if}
					<Button variant="outline" class="h-11 px-4" onclick={() => setOptions(true)}>Opsi</Button>
				</div>
			</div>

			<aside aria-label="Target dan riwayat" class="desk:flex hidden min-h-0 flex-col gap-5 overflow-y-auto border-l pl-8">
				<section class="flex flex-col gap-2">
					<h2 class="text-sm font-medium">Target latihan</h2>
					<TargetList checks={voice.scenario?.checks ?? []} met={voice.checksMet} />
				</section>
				<section class="flex flex-col gap-2">
					<h2 class="text-sm font-medium">Riwayat percakapan</h2>
					<Transcript turns={voice.turns} {nickname} follow />
				</section>
			</aside>
		</div>
	</main>
{/if}

<Sheet.Root bind:open={() => optionsOpen, setOptions}>
	<Sheet.Content
		side="bottom"
		showCloseButton={false}
		class="mx-auto max-h-[86dvh] max-w-130 gap-4 overflow-y-auto rounded-t-xl px-4 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
	>
		<Sheet.Header class="grid grid-cols-[1fr_auto_1fr] items-center p-0">
			<Sheet.Close>
				{#snippet child({ props })}
					<Button variant="ghost" class="-ml-2 h-11 justify-self-start" {...props}>Tutup</Button>
				{/snippet}
			</Sheet.Close>
			<Sheet.Title class="text-sm font-semibold">Opsi latihan</Sheet.Title>
			<Sheet.Description class="sr-only">Ketik jawaban, lihat target, dan baca riwayat percakapan.</Sheet.Description>
		</Sheet.Header>

		<form novalidate onsubmit={submitTyped} class="flex flex-col gap-3">
			<Field.Field data-invalid={typedMissing || undefined}>
				<Field.FieldLabel for="typed-answer">Ketik jawaban</Field.FieldLabel>
				<Textarea
					id="typed-answer"
					lang="en"
					maxlength={500}
					placeholder="Tulis jawabanmu dalam bahasa Inggris"
					aria-invalid={typedMissing || undefined}
					aria-describedby="typed-help"
					disabled={!voice.canType}
					bind:value={typed}
				/>
				{#if typedMissing}
					<Field.FieldError id="typed-help">Tulis jawabanmu dulu sebelum mengirim.</Field.FieldError>
				{:else if !voice.canType}
					<Field.FieldDescription id="typed-help">
						{voice.phase === 'done'
							? 'Percakapan sudah selesai.'
							: voice.phase === 'error'
								? 'Tekan Coba lagi supaya tamu menjawab dulu.'
								: 'Tunggu tamu selesai berpikir.'}
					</Field.FieldDescription>
				{:else}
					<Field.FieldDescription id="typed-help">Mikrofon dijeda selama lembar ini terbuka.</Field.FieldDescription>
				{/if}
			</Field.Field>
			<Button type="submit" variant="outline" class="h-11 w-full" disabled={!voice.canType}>Kirim jawaban</Button>
		</form>

		<section class="desk:hidden flex flex-col gap-2 border-t pt-3">
			<h2 class="text-sm font-medium">Target latihan</h2>
			<TargetList checks={voice.scenario?.checks ?? []} met={voice.checksMet} />
		</section>
		<section class="desk:hidden flex flex-col gap-2 border-t pt-3">
			<h2 class="text-sm font-medium">Riwayat percakapan</h2>
			<Transcript turns={voice.turns} {nickname} />
		</section>
	</Sheet.Content>
</Sheet.Root>
