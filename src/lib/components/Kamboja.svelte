<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import { prefersReducedMotion } from 'svelte/motion';
	import type { Emotion } from '$lib/types';
	import type { VoicePhase } from '$lib/voice.svelte';

	interface Props {
		phase?: VoicePhase;
		emotion?: Emotion;
		onrepeat?: () => void;
		disabled?: boolean;
		class?: string;
	}

	let { phase = 'loading', emotion = 'netral', onrepeat, disabled = false, class: className }: Props = $props();

	const uid = $props.id();
	const petalId = `kamboja-petal-${uid}`;

	let eyeX = $state(0);
	let eyeY = $state(0);

	const clampEye = (value: number) => Math.max(-4, Math.min(4, value));

	const followPointer: Attachment<HTMLElement> = (node) => {
		const follow = (event: PointerEvent) => {
			if (prefersReducedMotion.current) return;
			const box = node.getBoundingClientRect();
			eyeX = clampEye((event.clientX - box.left - box.width / 2) / 40);
			eyeY = clampEye((event.clientY - box.top - box.height / 2) / 40);
		};
		window.addEventListener('pointermove', follow);
		return () => window.removeEventListener('pointermove', follow);
	};
</script>

{#snippet art()}
	<svg viewBox="0 0 240 262" aria-hidden="true">
		<g class="kamboja">
			<rect x="84" y="226" width="30" height="24" rx="11" fill="#E8344E" />
			<rect x="126" y="226" width="30" height="24" rx="11" fill="#E8344E" />
			<path d="M72 164c0-32 20-44 48-44s48 12 48 44v30c0 28-20 42-48 42s-48-14-48-42z" fill="#17835E" />
			<g class="petals">
				<g class="petal-fill" fill="#E8344E">
					<path id={petalId} d="M120 96C88 84 76 42 92 22c10-13 36-14 48 0 18 20 8 62-20 74z" />
					<use href="#{petalId}" transform="rotate(72 120 92)" />
					<use href="#{petalId}" transform="rotate(144 120 92)" />
					<use href="#{petalId}" transform="rotate(216 120 92)" />
					<use href="#{petalId}" transform="rotate(288 120 92)" />
				</g>
				<circle cx="120" cy="96" r="46" fill="#FFC629" />
			</g>
			<g class="arm-left"><rect x="36" y="150" width="50" height="22" rx="11" fill="#17835E" /></g>
			<g class="arm-right"><rect x="154" y="150" width="50" height="22" rx="11" fill="#17835E" /></g>
			<ellipse cx="102" cy="90" rx="20" ry="23" fill="#FFFFFF" />
			<ellipse cx="138" cy="90" rx="20" ry="23" fill="#FFFFFF" />
			<circle class="pupil" cx="108" cy="92" r="6" fill="#1F2320" />
			<circle class="pupil" cx="132" cy="92" r="6" fill="#1F2320" />
			<g class="lid" fill="#FFC629">
				<path d="M80 90c0-16 10-25 22-25s22 9 22 25z" />
				<path d="M116 90c0-16 10-25 22-25s22 9 22 25z" />
			</g>
			<rect class="lid" x="82" y="86" width="76" height="5" rx="2.5" fill="#1F2320" />
			<g class="lid-half" fill="#FFC629">
				<path d="M80 82c0-11 10-18 22-18s22 7 22 18z" />
				<path d="M116 82c0-11 10-18 22-18s22 7 22 18z" />
			</g>
			<rect class="brow brow-left" x="82" y="56" width="38" height="9" rx="4.5" fill="#1F2320" />
			<rect class="brow brow-right" x="120" y="56" width="38" height="9" rx="4.5" fill="#1F2320" />
			<g class="cheeks" fill="#F58A9B"><circle cx="82" cy="116" r="8" /><circle cx="158" cy="116" r="8" /></g>
			<g class="char-mouth">
				<ellipse class="mouth m-netral" cx="120" cy="120" rx="11" ry="8" fill="#F26B21" />
				<path class="mouth m-senang" d="M98 110c8 5 36 5 44 0 0 16-10 26-22 26s-22-10-22-26z" fill="#B3202F" />
				<path class="mouth m-sedih" d="M100 130c4-14 36-14 40 0-8-5-32-5-40 0z" fill="#B3202F" />
				<path class="mouth m-marah" d="M94 110h52c4 8 0 26-26 26s-30-18-26-26z" fill="#7E1420" />
				<path
					class="mouth m-bingung"
					d="M102 122c6-7 10 5 18 0s12-5 18 0"
					fill="none"
					stroke="#B3202F"
					stroke-width="6"
					stroke-linecap="round"
				/>
			</g>
			<g class="tears" fill="#4FA8E0">
				<path d="M92 112c6 8 8 11 8 15a8 8 0 0 1-16 0c0-4 2-7 8-15z" />
				<path d="M148 112c6 8 8 11 8 15a8 8 0 0 1-16 0c0-4 2-7 8-15z" />
			</g>
			<g class="anger" fill="none" stroke="#C61F2E" stroke-width="7" stroke-linecap="round">
				<path d="M192 34l10-16M206 44l16-10M210 62l18 2" />
			</g>
			<g class="thought" fill="#1D5C4F">
				<circle class="dot dot-1" cx="178" cy="54" r="5" />
				<circle class="dot dot-2" cx="194" cy="38" r="7" />
				<circle class="dot dot-3" cx="214" cy="20" r="9" />
			</g>
			<text class="puzzled" x="190" y="50" font-weight="700" font-size="46" fill="#1D5C4F">?</text>
		</g>
	</svg>
{/snippet}

<div
	{@attach followPointer}
	class={['stage', className]}
	data-phase={phase}
	data-mood={emotion}
	style:--eye-x="{eyeX}px"
	style:--eye-y="{eyeY}px"
>
	{#if onrepeat}
		<button
			type="button"
			class="char-btn rounded-lg disabled:cursor-default"
			aria-label="Ulangi ucapan tamu"
			{disabled}
			onclick={onrepeat}
		>
			{@render art()}
		</button>
	{:else}
		{@render art()}
	{/if}
</div>

<style>
	.stage :global(svg) {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}
	.char-btn {
		display: block;
		width: 100%;
		cursor: pointer;
		touch-action: manipulation;
	}
	.char-btn:active:not(:disabled) .kamboja {
		transform: scale(1.03, 0.96);
	}
	.kamboja,
	.petals,
	.arm-left,
	.arm-right,
	.char-mouth {
		transform-box: view-box;
	}
	.kamboja {
		transform-origin: 120px 250px;
	}
	.petals {
		transform-origin: 120px 92px;
	}
	.arm-left {
		transform-origin: 78px 158px;
	}
	.arm-right {
		transform-origin: 162px 158px;
	}
	.char-mouth {
		transform-origin: 120px 118px;
	}
	.pupil {
		transform: translate(var(--eye-x), var(--eye-y));
	}
	.lid {
		opacity: 0;
	}
	.puzzled {
		font-family: 'Inter Variable', sans-serif;
	}
	[data-phase='listening'] .petals {
		transform: scale(1.07);
	}
	[data-phase='listening'] .arm-right {
		transform: rotate(-48deg);
	}
	[data-phase='thinking'] .pupil {
		transform: translate(6px, -4px);
	}
	[data-phase='thinking'] .lid {
		opacity: 1;
	}
	[data-phase='thinking'] .arm-left {
		transform: rotate(-150deg);
	}
	.thought {
		display: none;
	}
	[data-phase='done'] .arm-left {
		transform: rotate(48deg);
	}
	[data-phase='done'] .arm-right {
		transform: rotate(-48deg);
	}
	.mouth,
	.tears,
	.anger,
	.puzzled,
	.cheeks,
	.brow,
	.lid-half {
		display: none;
	}
	.petal-fill {
		transition: fill 0.2s;
	}
	.brow {
		transform-box: fill-box;
		transform-origin: center;
	}
	[data-mood='netral'] .m-netral,
	[data-mood='senang'] .m-senang,
	[data-mood='kesal'] .m-sedih,
	[data-mood='sedih'] .m-sedih,
	[data-mood='marah'] .m-marah,
	[data-mood='bingung'] .m-bingung,
	[data-mood='senang'] .cheeks,
	[data-mood='sedih'] .tears,
	[data-mood='marah'] .anger,
	[data-mood='bingung'] .puzzled,
	[data-mood='kesal'] .brow,
	[data-mood='marah'] .brow,
	[data-mood='sedih'] .brow,
	[data-mood='bingung'] .brow,
	[data-mood='kesal'] .lid-half,
	[data-mood='marah'] .lid-half {
		display: inline;
	}
	[data-mood='kesal'] .brow-left {
		transform: translateY(14px) rotate(14deg);
	}
	[data-mood='kesal'] .brow-right {
		transform: translateY(14px) rotate(-14deg);
	}
	[data-mood='marah'] .brow-left {
		transform: translateY(18px) rotate(28deg);
	}
	[data-mood='marah'] .brow-right {
		transform: translateY(18px) rotate(-28deg);
	}
	[data-mood='sedih'] .brow-left {
		transform: translateY(2px) rotate(-22deg);
	}
	[data-mood='sedih'] .brow-right {
		transform: translateY(2px) rotate(22deg);
	}
	[data-mood='bingung'] .brow-left {
		transform: translateY(-6px) rotate(-12deg);
	}
	[data-mood='bingung'] .brow-right {
		transform: translateY(8px) rotate(6deg);
	}
	/* Saat berpikir, titik pikiran menggantikan tanda emosi di atas kepala supaya tidak bertumpuk. */
	[data-phase='thinking'] .thought {
		display: inline;
	}
	[data-phase='thinking'] .puzzled,
	[data-phase='thinking'] .anger {
		display: none;
	}
	[data-mood='marah'] .petal-fill {
		fill: #b3122a;
	}
	[data-mood='marah'] .pupil {
		r: 4px;
	}
	[data-mood='senang'] .pupil {
		r: 8px;
	}
	[data-mood='sedih'] .petals {
		transform: translateY(8px) scale(0.94);
	}
	[data-mood='sedih'] .pupil {
		transform: translate(var(--eye-x), calc(var(--eye-y) + 5px));
	}
	[data-mood='kesal'] .pupil {
		transform: translate(calc(var(--eye-x) - 5px), calc(var(--eye-y) + 2px));
	}
	[data-mood='bingung'] .pupil {
		transform: translate(calc(var(--eye-x) + 5px), calc(var(--eye-y) - 2px));
	}
	@media (prefers-reduced-motion: no-preference) {
		.pupil,
		.petals,
		.arm-left,
		.arm-right,
		.char-mouth,
		.kamboja {
			transition: transform 0.2s;
		}
		[data-phase='speaking'] .char-mouth {
			animation: talk 0.26s ease-in-out infinite alternate;
		}
		[data-phase='speaking'] .kamboja {
			animation: bounce 0.52s ease-in-out infinite alternate;
		}
		[data-mood='marah'][data-phase='speaking'] .kamboja {
			animation: shake 0.16s linear infinite alternate;
		}
		[data-mood='sedih'] .tears {
			animation: tear 1.2s ease-in infinite;
		}
		/* Gerak pelan selama menunggu suara, supaya jeda terasa seperti tamu sedang berpikir. */
		[data-phase='thinking'] .kamboja {
			animation: sway 1.6s ease-in-out infinite alternate;
		}
		[data-phase='thinking'] .pupil {
			animation: ponder 2.4s ease-in-out infinite alternate;
		}
		[data-phase='thinking'] .dot {
			animation: think 1.2s ease-in-out infinite;
		}
		[data-phase='thinking'] .dot-2 {
			animation-delay: 0.2s;
		}
		[data-phase='thinking'] .dot-3 {
			animation-delay: 0.4s;
		}
	}
	@keyframes sway {
		from {
			transform: rotate(-2deg);
		}
		to {
			transform: rotate(2deg);
		}
	}
	@keyframes ponder {
		from {
			transform: translate(6px, -4px);
		}
		to {
			transform: translate(-6px, -4px);
		}
	}
	@keyframes think {
		0%,
		100% {
			opacity: 0.25;
		}
		50% {
			opacity: 1;
		}
	}
	@keyframes talk {
		from {
			transform: scale(1, 0.6);
		}
		to {
			transform: scale(0.9, 1.7);
		}
	}
	@keyframes bounce {
		from {
			transform: scale(1, 1);
		}
		to {
			transform: scale(1.03, 0.97);
		}
	}
	@keyframes shake {
		from {
			transform: translateX(-4px) rotate(-1deg);
		}
		to {
			transform: translateX(4px) rotate(1deg);
		}
	}
	@keyframes tear {
		from {
			transform: translateY(0);
			opacity: 1;
		}
		to {
			transform: translateY(16px);
			opacity: 0.2;
		}
	}
</style>
