import { json } from '@sveltejs/kit';
import { scenarios } from '$lib/scenarios';
import { limitRequests } from '$lib/server/limits';
import { requireTeacher } from '$lib/server/teacher';
import { cachedSpeech, hasSpeech, speechKey, voiceFor } from '$lib/server/tts';
import type { RequestHandler } from './$types';

// Tiap model dicoba sampai empat kali per audio, jadi batch kecil menjaga jumlah subrequest Worker.
const BATCH = 8;

export const POST: RequestHandler = async ({ cookies, getClientAddress }) => {
	requireTeacher(cookies);
	await limitRequests(`tts-warm:${getClientAddress()}`, 10);
	const missing = [];
	for (const scenario of scenarios) {
		const key = await speechKey(voiceFor(scenario).voice, scenario.openingEmotion, scenario.opening);
		if (!(await hasSpeech(key))) missing.push(scenario);
	}
	let created = 0;
	for (const scenario of missing.slice(0, BATCH)) {
		try {
			await cachedSpeech(scenario.opening, voiceFor(scenario), scenario.openingEmotion);
			created += 1;
		} catch {
			break;
		}
	}
	return json({ total: scenarios.length, created, missing: missing.length - created });
};
