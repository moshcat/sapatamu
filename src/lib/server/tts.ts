import { env as bindings } from 'cloudflare:workers';
import * as env from '$app/env/private';
import type { Scenario } from '$lib/scenarios';
import type { Emotion } from '$lib/types';
import { readPcm, toWav } from './wav';

export interface Voice {
	voice: string;
	backup: string;
	models: string[];
}

const voices: Record<'kore' | 'puck', Voice> = {
	kore: { voice: 'Kore', backup: 'thalia', models: ['gemini-3.8-flash-tts', 'gemini-3.1-flash-tts-preview', 'gemini-2.5-flash-preview-tts', 'gemini-3.8-flash-lite-tts'] },
	puck: { voice: 'Puck', backup: 'apollo', models: ['gemini-3.8-flash-lite-tts', 'gemini-3.1-flash-tts-preview', 'gemini-2.5-flash-preview-tts', 'gemini-3.8-flash-tts'] }
};

// Instruksi berbentuk kalimat ikut terbaca oleh model, sedangkan tag tidak.
const tags: Record<Emotion, string> = {
	netral: '',
	senang: '[happy] ',
	kesal: '[annoyed] ',
	marah: '[angry] ',
	sedih: '[sad] ',
	bingung: '[confused] '
};

export const voiceFor = (scenario: Pick<Scenario, 'guest'>) => (scenario.guest.startsWith('Mr.') ? voices.puck : voices.kore);

// Naikkan versi bila format audio atau daftar suara berubah, supaya isi lama tidak terpakai.
export async function speechKey(voice: string, emotion: Emotion, text: string) {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${voice}|${emotion}|${text}`));
	return `tts:v1:${Buffer.from(digest).toString('hex')}`;
}

async function askGemini(model: string, voice: string, text: string, signal: AbortSignal) {
	const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY ?? '' },
		body: JSON.stringify({
			contents: [{ parts: [{ text }] }],
			generationConfig: {
				responseModalities: ['AUDIO'],
				speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } }
			}
		}),
		signal
	});
	if (!response.ok) throw new Error(`${model} membalas ${response.status}`);
	const data = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }> };
	const audio = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
	if (!audio?.data) throw new Error(`${model} tidak mengirim audio`);
	const { pcm, rate } = readPcm(Buffer.from(audio.data, 'base64'), audio.mimeType);
	return toWav(pcm, rate);
}

// Kuota gratis dihitung per model, jadi model berikutnya dicoba saat satu model habis.
async function geminiSpeech(text: string, voice: Voice, emotion: Emotion) {
	if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY belum diisi');
	const signal = AbortSignal.timeout(15_000);
	for (const model of voice.models) {
		try {
			return await askGemini(model, voice.voice, `${tags[emotion]}${text}`, signal);
		} catch (cause) {
			console.error('Gemini TTS gagal', cause instanceof Error ? cause.message : cause);
			if (signal.aborted) break;
		}
	}
	throw new Error('Semua model Gemini TTS gagal');
}

export async function hasSpeech(key: string) {
	const stream = await bindings.TTS_CACHE.get(key, 'stream');
	await stream?.cancel();
	return Boolean(stream);
}

// Kuota Gemini kecil, jadi audio yang sudah jadi disimpan dan dipakai ulang untuk kalimat yang sama.
export async function cachedSpeech(text: string, voice: Voice, emotion: Emotion) {
	const key = await speechKey(voice.voice, emotion, text);
	const stored = await bindings.TTS_CACHE.get(key, 'arrayBuffer');
	if (stored) return new Uint8Array(stored);
	const wav = await geminiSpeech(text, voice, emotion);
	try {
		await bindings.TTS_CACHE.put(key, wav);
	} catch (cause) {
		console.error('Audio gagal disimpan', cause instanceof Error ? cause.message : cause);
	}
	return wav;
}

export async function auraSpeech(text: string, speaker: string) {
	const response = (await bindings.AI.run('@cf/deepgram/aura-2-en', { text, speaker, encoding: 'mp3' } as never, { returnRawResponse: true })) as unknown as Response;
	if (!response.ok) throw new Error(`Aura membalas ${response.status}`);
	return response;
}
