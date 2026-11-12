import { error } from '@sveltejs/kit';
import { findScenario } from '$lib/scenarios';
import { requireActiveSession } from '$lib/server/db';
import { DAY_MS, limitCaller, limitRequests } from '$lib/server/limits';
import { auraSpeech, cachedSpeech, voiceFor } from '$lib/server/tts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const body = (await request.json()) as { sessionId?: string };
	const session = await requireActiveSession(String(body.sessionId ?? ''));
	await limitCaller('tts', session, getClientAddress(), 30);
	const scenario = findScenario(session.scenarioId);
	const turn = session.turns.findLast((item) => item.role === 'guest');
	if (!scenario || !turn) error(404, 'Latihan tidak ditemukan.');
	// Satu ucapan tamu cukup satu audio, ditambah satu cadangan per sesi untuk muat ulang halaman.
	await limitRequests(`tts-session:${session.id}`, session.turns.filter((item) => item.role === 'guest').length + 1, DAY_MS);
	const text = turn.text.slice(0, 400);
	const voice = voiceFor(scenario);
	try {
		const wav = await cachedSpeech(text, voice, turn.emotion ?? 'netral');
		return new Response(wav, { headers: { 'Content-Type': 'audio/wav', 'Cache-Control': 'no-store' } });
	} catch (cause) {
		console.error('Gemini TTS gagal', cause instanceof Error ? cause.message : cause);
	}
	try {
		const backup = await auraSpeech(text, voice.backup);
		return new Response(backup.body, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store', 'X-Voice': 'backup' } });
	} catch (cause) {
		console.error('Suara tamu gagal', cause instanceof Error ? cause.message : cause);
		error(503, 'Suara tamu belum tersedia.');
	}
};
