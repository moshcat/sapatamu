import { ApiError, errorMessage, request } from '$lib/api';
import { findScenario } from '$lib/scenarios';
import { MAX_ANSWERS, type Emotion, type SessionDetail, type Turn } from '$lib/types';

export type VoicePhase = 'loading' | 'speaking' | 'listening' | 'thinking' | 'paused' | 'error' | 'done';

interface VoiceNotice {
	message: string;
	offerTyping?: boolean;
	offerListen?: boolean;
}

interface TurnResponse {
	reply: string;
	emotion: Emotion;
	checksMet: number[];
	done: boolean;
}

interface Recording {
	stream: MediaStream;
	recorder: MediaRecorder;
	context: AudioContext;
	tick: ReturnType<typeof setInterval>;
	limit: ReturnType<typeof setTimeout>;
}

type AfterSpeech = 'listen' | 'paused' | 'done';

export const phaseLabels: Record<VoicePhase, string> = {
	loading: 'Menyiapkan tamu',
	speaking: 'Tamu bicara',
	listening: 'Giliranmu',
	thinking: 'Tamu berpikir',
	paused: 'Mikrofon dijeda',
	error: 'Tamu belum bisa menjawab',
	done: 'Percakapan selesai'
};

export const moodLabels: Record<Emotion, string> = {
	netral: 'Tamu terlihat tenang',
	senang: 'Tamu terlihat senang',
	kesal: 'Tamu terlihat kesal',
	marah: 'Tamu terlihat marah',
	sedih: 'Tamu terlihat sedih',
	bingung: 'Tamu terlihat bingung'
};

const SILENCE_MS = 1200;
const MIN_VOICE_MS = 150;
const MAX_RECORDING_MS = 30_000;
const TICK_MS = 50;
const BAR_COUNT = 9;
// 30 detik pada 32 kbps sekitar 120 KB, jauh di bawah batas server 1 MB.
const AUDIO_BITS_PER_SECOND = 32_000;
const QUIET = Array<number>(BAR_COUNT).fill(0);

const AUDIO_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];

const audioExtension = (type: string) => (type.includes('mp4') ? 'mp4' : type.includes('ogg') ? 'ogg' : 'webm');

function barLevels(frequencies: Uint8Array) {
	const first = 2;
	const size = Math.floor((frequencies.length * 0.3 - first) / BAR_COUNT);
	return QUIET.map((_, bar) => {
		let total = 0;
		for (let index = 0; index < size; index += 1) total += frequencies[first + bar * size + index];
		return Math.sqrt(total / size / 255);
	});
}

function microphoneNotice(cause: unknown): VoiceNotice {
	const name = cause instanceof DOMException ? cause.name : '';
	if (name === 'NotAllowedError' || name === 'SecurityError') {
		return {
			message: 'Izin mikrofon ditolak. Izinkan mikrofon di pengaturan browser, lalu tekan Bicara sekarang, atau ketik jawabanmu.',
			offerTyping: true
		};
	}
	if (name === 'NotFoundError') return { message: 'Mikrofon tidak ditemukan. Ketik jawabanmu dulu.', offerTyping: true };
	return { message: 'Mikrofon belum bisa dipakai. Ketik jawabanmu atau tekan Bicara sekarang.', offerTyping: true };
}

let playback: AudioContext | null = null;

function playbackContext() {
	playback ??= new AudioContext();
	return playback;
}

// Dipanggil dari klik pengguna, karena browser hanya mengizinkan audio otomatis setelah ada gestur.
export function unlockAudio() {
	void playbackContext()
		.resume()
		.catch(() => undefined);
}

async function audioReady(context: AudioContext) {
	// resume() tidak pernah selesai selama browser menahan audio.
	if (context.state !== 'running') await Promise.race([context.resume().catch(() => undefined), new Promise((done) => setTimeout(done, 300))]);
	return context.state === 'running';
}

export class VoiceSession {
	phase = $state<VoicePhase>('loading');
	session = $state.raw<SessionDetail | null>(null);
	turns = $state.raw<Turn[]>([]);
	checksMet = $state.raw<number[]>([]);
	notice = $state<VoiceNotice | null>(null);
	voiceNote = $state('');
	loadError = $state<{ message: string; missing: boolean } | null>(null);
	levels = $state.raw<number[]>(QUIET);

	scenario = $derived(this.session ? (findScenario(this.session.scenarioId) ?? null) : null);
	guestLine = $derived(this.turns.findLast((turn) => turn.role === 'guest')?.text ?? '');
	emotion = $derived<Emotion>(this.turns.findLast((turn) => turn.role === 'guest')?.emotion ?? 'netral');
	lastAnswer = $derived(this.turns.findLast((turn) => turn.role === 'student')?.text ?? '');
	answered = $derived(this.turns.some((turn) => turn.role === 'student'));
	progress = $derived(this.scenario ? (this.checksMet.length / this.scenario.checks.length) * 100 : 0);
	canType = $derived(this.phase === 'speaking' || this.phase === 'listening' || this.phase === 'paused');
	canRepeat = $derived(this.canType || this.phase === 'done');

	#id: string;
	#onFinished: () => void;
	// Setiap aksi baru menaikkan run, sehingga callback dan await lama berhenti sendiri.
	#run = 0;
	#destroyed = false;
	#timer: ReturnType<typeof setTimeout> | undefined;
	// Referensi ini mencegah Chrome membuang ucapan sebelum onend terpanggil.
	#utterance: SpeechSynthesisUtterance | null = null;
	#source: AudioBufferSourceNode | null = null;
	#audioController: AbortController | null = null;
	// Replay memakai audio yang sama supaya tidak menghabiskan kuota TTS harian.
	#voice: { key: string; buffer: AudioBuffer } | null = null;
	#blockedAfter: AfterSpeech | null = null;
	#recording: Recording | null = null;
	#retryText = '';
	#held = false;
	#resumeAfterHold = false;

	constructor(id: string, onFinished: () => void) {
		this.#id = id;
		this.#onFinished = onFinished;
	}

	async load() {
		this.phase = 'loading';
		this.loadError = null;
		try {
			const session = await request<SessionDetail>(`/api/sessions/${this.#id}`);
			if (this.#destroyed) return;
			if (session.status === 'finished') {
				this.#onFinished();
				return;
			}
			this.session = session;
			this.turns = session.turns;
			this.checksMet = session.checksMet;
			if (session.turns.at(-1)?.role === 'student') {
				void this.#askGuest('');
			} else if (session.turns.filter((turn) => turn.role === 'student').length >= MAX_ANSWERS) {
				this.phase = 'done';
			} else {
				this.#speak(this.guestLine, 'listen');
			}
		} catch (cause) {
			if (this.#destroyed) return;
			this.loadError = {
				message: errorMessage(cause),
				missing: cause instanceof ApiError && cause.status === 404
			};
		}
	}

	micAction() {
		if (this.phase === 'listening') this.pause();
		else if (this.phase === 'speaking' || this.phase === 'paused') void this.#listen();
	}

	pause() {
		this.#nextRun();
		this.notice = null;
		this.phase = 'paused';
	}

	repeat() {
		if (!this.canRepeat) return;
		unlockAudio();
		const after: AfterSpeech = this.#blockedAfter ?? (this.phase === 'done' ? 'done' : this.phase === 'paused' ? 'paused' : 'listen');
		this.notice = null;
		this.#speak(this.guestLine, after);
	}

	retry() {
		if (this.phase === 'error') void this.#askGuest(this.#retryText);
	}

	submitText(text: string) {
		if (this.canType) void this.#send(text);
	}

	// Mikrofon ditahan selama lembar Opsi terbuka supaya suara mengetik tidak terkirim sebagai jawaban.
	setHold(held: boolean) {
		this.#held = held;
		if (held) {
			this.#resumeAfterHold = this.phase === 'listening' || this.phase === 'speaking';
			if (this.phase === 'listening') this.pause();
		} else {
			const resume = this.#resumeAfterHold && this.phase === 'paused';
			this.#resumeAfterHold = false;
			if (resume) void this.#listen();
		}
	}

	suspend() {
		if (this.phase === 'speaking' || this.phase === 'listening') this.pause();
	}

	destroy() {
		this.#destroyed = true;
		this.#nextRun();
	}

	#nextRun() {
		this.#run += 1;
		this.#blockedAfter = null;
		clearTimeout(this.#timer);
		this.#cancelSpeech();
		this.#discardRecording();
		return this.#run;
	}

	#cancelSpeech() {
		this.#utterance = null;
		this.#audioController?.abort();
		this.#audioController = null;
		if (this.#source) {
			this.#source.onended = null;
			this.#source.stop();
			this.#source = null;
		}
		try {
			globalThis.speechSynthesis?.cancel();
		} catch {
			return;
		}
	}

	#speak(text: string, after: AfterSpeech) {
		const run = this.#nextRun();
		this.phase = 'speaking';
		const next = () => {
			if (run !== this.#run) return;
			clearTimeout(this.#timer);
			this.#cancelSpeech();
			this.#afterSpeech(after);
		};
		void this.#playVoice(text, after, run, next);
	}

	async #playVoice(text: string, after: AfterSpeech, run: number, next: () => void) {
		const context = playbackContext();
		const voice = await this.#loadVoice(text, context).catch(() => null);
		if (run !== this.#run) return;
		const ready = await audioReady(context);
		if (run !== this.#run) return;
		if (!ready) this.#waitForTap(after);
		else if (voice) this.#playBuffer(voice, context, next);
		else {
			this.voiceNote = 'Suara utama sedang penuh. Baca juga ucapan tamu di layar.';
			this.#speakWithBrowser(text, next);
		}
	}

	async #loadVoice(text: string, context: AudioContext) {
		const key = `${this.emotion}:${text}`;
		if (this.#voice?.key === key) return this.#voice.buffer;
		const controller = new AbortController();
		this.#audioController = controller;
		const response = await fetch('/api/tts', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ sessionId: this.#id }),
			signal: controller.signal
		});
		if (!response.ok) return null;
		this.voiceNote = response.headers.get('x-voice') === 'backup' ? 'Suara cadangan sedang dipakai.' : '';
		const buffer = await context.decodeAudioData(await response.arrayBuffer());
		this.#voice = { key, buffer };
		return buffer;
	}

	#playBuffer(voice: AudioBuffer, context: AudioContext, next: () => void) {
		const source = context.createBufferSource();
		source.buffer = voice;
		source.connect(context.destination);
		source.onended = next;
		this.#source = source;
		source.start();
		this.#timer = setTimeout(next, (voice.duration + 2) * 1000);
	}

	#waitForTap(after: AfterSpeech) {
		this.#blockedAfter = after;
		this.notice = { message: 'Browser menahan suara otomatis. Tekan tombol ini untuk mendengar tamu.', offerListen: true };
		this.phase = after === 'done' ? 'done' : 'paused';
	}

	#speakWithBrowser(text: string, next: () => void) {
		if (!globalThis.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') {
			this.#timer = setTimeout(next, Math.max(1400, text.length * 50));
			return;
		}
		try {
			const rate = this.session?.level === 'Dasar' ? 0.85 : 1;
			const utterance = new SpeechSynthesisUtterance(text);
			utterance.lang = 'en-US';
			utterance.rate = rate;
			utterance.onend = next;
			utterance.onerror = next;
			this.#utterance = utterance;
			speechSynthesis.speak(utterance);
			this.#timer = setTimeout(next, (text.length * 130) / rate + 3000);
		} catch {
			this.#timer = setTimeout(next, 1400);
		}
	}

	#afterSpeech(after: AfterSpeech) {
		if (after === 'done') this.phase = 'done';
		else if (after === 'paused' || this.#held) this.phase = 'paused';
		else void this.#listen();
	}

	async #listen(notice: VoiceNotice | null = null) {
		const run = this.#nextRun();
		this.notice = notice;
		if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
			this.#pauseWith({ message: 'Browser ini belum bisa merekam suara. Ketik jawabanmu.', offerTyping: true });
			return;
		}
		this.phase = 'listening';
		let stream: MediaStream;
		try {
			stream = await navigator.mediaDevices.getUserMedia({
				audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
			});
		} catch (cause) {
			if (run === this.#run) this.#pauseWith(microphoneNotice(cause));
			return;
		}
		if (run !== this.#run) {
			stream.getTracks().forEach((track) => track.stop());
			return;
		}
		try {
			this.#record(stream, run);
		} catch (cause) {
			stream.getTracks().forEach((track) => track.stop());
			this.#pauseWith(microphoneNotice(cause));
		}
	}

	#record(stream: MediaStream, run: number) {
		const mimeType = AUDIO_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
		const recorder = new MediaRecorder(stream, {
			audioBitsPerSecond: AUDIO_BITS_PER_SECOND,
			...(mimeType ? { mimeType } : {})
		});
		const chunks: Blob[] = [];
		recorder.ondataavailable = (event) => {
			if (event.data.size > 0) chunks.push(event.data);
		};

		const context = new AudioContext();
		void context.resume().catch(() => undefined);
		const analyser = context.createAnalyser();
		analyser.fftSize = 512;
		analyser.smoothingTimeConstant = 0.6;
		context.createMediaStreamSource(stream).connect(analyser);
		const wave = new Float32Array(analyser.fftSize);
		const frequencies = new Uint8Array(analyser.frequencyBinCount);

		let heard = false;
		let voiceMs = 0;
		let silentMs = 0;
		let noiseFloor = 0.01;

		const finish = () => {
			if (this.#recording?.recorder !== recorder || recorder.state !== 'recording') return;
			clearInterval(recording.tick);
			clearTimeout(recording.limit);
			// Konteks yang tertahan (kebijakan autoplay) tidak bisa menilai suara, jadi rekaman tetap dikirim.
			const nothingHeard = !heard && context.state === 'running';
			if (!nothingHeard) this.phase = 'thinking';
			recorder.onstop = () => {
				const audio = new Blob(chunks, { type: recorder.mimeType || mimeType });
				this.#releaseRecording();
				if (run !== this.#run) return;
				if (nothingHeard || audio.size === 0) {
					this.#pauseWith({ message: 'Suaramu belum terdengar. Tekan Bicara sekarang untuk mencoba lagi.' });
				} else {
					void this.#transcribe(audio, run);
				}
			};
			recorder.stop();
		};

		const tick = setInterval(() => {
			analyser.getFloatTimeDomainData(wave);
			analyser.getByteFrequencyData(frequencies);
			this.levels = barLevels(frequencies);
			const rms = Math.sqrt(wave.reduce((total, sample) => total + sample * sample, 0) / wave.length);
			const loud = rms > Math.max(0.015, noiseFloor * 3);
			noiseFloor = rms < noiseFloor ? rms : noiseFloor * 0.995 + rms * 0.005;
			if (loud) {
				voiceMs += TICK_MS;
				silentMs = 0;
				if (voiceMs >= MIN_VOICE_MS) heard = true;
			} else {
				if (!heard) voiceMs = 0;
				silentMs += TICK_MS;
				if (heard && silentMs >= SILENCE_MS) finish();
			}
		}, TICK_MS);

		const recording: Recording = {
			stream,
			recorder,
			context,
			tick,
			limit: setTimeout(finish, MAX_RECORDING_MS)
		};
		this.#recording = recording;
		recorder.start();
	}

	#releaseRecording() {
		const recording = this.#recording;
		if (!recording) return;
		this.#recording = null;
		clearInterval(recording.tick);
		clearTimeout(recording.limit);
		recording.stream.getTracks().forEach((track) => track.stop());
		void recording.context.close().catch(() => undefined);
		this.levels = QUIET;
	}

	#discardRecording() {
		const recording = this.#recording;
		if (!recording) return;
		recording.recorder.onstop = null;
		if (recording.recorder.state !== 'inactive') recording.recorder.stop();
		this.#releaseRecording();
	}

	#pauseWith(notice: VoiceNotice) {
		this.notice = notice;
		this.phase = 'paused';
	}

	async #transcribe(audio: Blob, run: number) {
		this.phase = 'thinking';
		const form = new FormData();
		form.append('sessionId', this.#id);
		form.append('audio', audio, `jawaban.${audioExtension(audio.type)}`);
		try {
			const { text } = await request<{ text: string }>('/api/transcribe', { method: 'POST', form });
			if (run !== this.#run) return;
			const answer = text.trim();
			if (answer) await this.#send(answer);
			else await this.#listen({ message: 'Suaramu belum tertangkap. Ulangi jawabanmu.' });
		} catch (cause) {
			if (run !== this.#run) return;
			this.#pauseWith({ message: errorMessage(cause), offerTyping: true });
		}
	}

	async #send(text: string) {
		this.notice = null;
		this.turns = [...this.turns, { role: 'student', text }];
		await this.#askGuest(text);
	}

	async #askGuest(text: string) {
		const run = this.#nextRun();
		this.notice = null;
		this.phase = 'thinking';
		try {
			const result = await request<TurnResponse>(`/api/sessions/${this.#id}/turn`, { method: 'POST', json: { text } });
			if (run !== this.#run) return;
			this.turns = [...this.turns, { role: 'guest', text: result.reply, emotion: result.emotion }];
			this.checksMet = result.checksMet;
			this.#speak(result.reply, result.done ? 'done' : 'listen');
		} catch (cause) {
			if (run !== this.#run) return;
			const status = cause instanceof ApiError ? cause.status : 0;
			if (status === 409) {
				this.notice = { message: errorMessage(cause) };
				this.phase = 'done';
				return;
			}
			// Pada 503 jawaban sudah tersimpan dan server mengenali retry dari teks kosong.
			this.#retryText = status === 503 ? '' : text;
			this.notice = { message: errorMessage(cause) };
			this.phase = 'error';
		}
	}
}
