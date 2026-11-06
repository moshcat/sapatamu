import { error } from '@sveltejs/kit';
import { env as bindings } from 'cloudflare:workers';
import * as env from '$app/env/private';
import { findScenario } from '$lib/scenarios';
import { requireActiveSession } from '$lib/server/db';
import { DAY_MS, limitRequests } from '$lib/server/limits';
import { readPcm, toWav } from '$lib/server/wav';
import type { Emotion } from '$lib/types';
import type { RequestHandler } from './$types';

const voices = {
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
	return new Response(toWav(pcm, rate), { headers: { 'Content-Type': 'audio/wav', 'Cache-Control': 'no-store' } });
}

// Kuota gratis dihitung per model, jadi model berikutnya dicoba saat satu model habis.
async function geminiSpeech(text: string, voice: (typeof voices)['kore'], emotion: Emotion) {
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

async function auraSpeech(text: string, speaker: string) {
	const response = (await bindings.AI.run('@cf/deepgram/aura-2-en', { text, speaker, encoding: 'mp3' } as never, { returnRawResponse: true })) as unknown as Response;
	if (!response.ok) throw new Error(`Aura membalas ${response.status}`);
	return new Response(response.body, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store', 'X-Voice': 'backup' } });
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	await limitRequests(`tts:${getClientAddress()}`, 30);
	const body = (await request.json()) as { sessionId?: string };
	const session = await requireActiveSession(String(body.sessionId ?? ''));
	const scenario = findScenario(session.scenarioId);
	const turn = session.turns.findLast((item) => item.role === 'guest');
	if (!scenario || !turn) error(404, 'Latihan tidak ditemukan.');
	// Satu ucapan tamu cukup satu audio, ditambah satu cadangan per sesi untuk muat ulang halaman.
	await limitRequests(`tts-session:${session.id}`, session.turns.filter((item) => item.role === 'guest').length + 1, DAY_MS);
	const text = turn.text.slice(0, 400);
	const voice = scenario.guest.startsWith('Mr.') ? voices.puck : voices.kore;
	try {
		return await geminiSpeech(text, voice, turn.emotion ?? 'netral');
	} catch (cause) {
		console.error('Gemini TTS gagal', cause instanceof Error ? cause.message : cause);
	}
	try {
		return await auraSpeech(text, voice.backup);
	} catch (cause) {
		console.error('Suara tamu gagal', cause instanceof Error ? cause.message : cause);
		error(503, 'Suara tamu belum tersedia.');
	}
};
