import { error, json } from '@sveltejs/kit';
import { findScenario } from '$lib/scenarios';
import { addTurn, requireActiveSession, updateChecks } from '$lib/server/db';
import { DAY_MS, limitCaller, limitRequests, SESSION_CALLS } from '$lib/server/limits';
import { AiUnavailableError, askGuest } from '$lib/server/llm';
import { cleanText, mergeChecks } from '$lib/server/validate';
import { MAX_ANSWERS, type Turn } from '$lib/types';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, getClientAddress }) => {
	const session = await requireActiveSession(params.id);
	await limitCaller('turn', session, getClientAddress(), 20);
	const scenario = findScenario(session.scenarioId);
	if (!scenario) error(404, 'Latihan tidak ditemukan.');
	await limitRequests(`turn-session:${session.id}`, SESSION_CALLS, DAY_MS);
	const body = (await request.json()) as { text?: string };
	const retry = session.turns.at(-1)?.role === 'student';
	const answers = session.turns.filter((turn) => turn.role === 'student').length;
	let turns = session.turns;
	if (!retry) {
		const text = cleanText(body.text, 500);
		if (!text) error(400, 'Isi jawaban sebelum mengirim.');
		if (answers >= MAX_ANSWERS) error(409, 'Batas jawaban sudah tercapai.');
		const turn: Turn = { role: 'student', text };
		await addTurn(session.id, turn);
		turns = [...turns, turn];
	}
	const used = answers + (retry ? 0 : 1);
	try {
		const result = await askGuest(scenario, session.level, turns, MAX_ANSWERS - used);
		const checksMet = mergeChecks(session.checksMet, result.checksMet);
		await addTurn(session.id, { role: 'guest', text: result.reply, emotion: result.emotion });
		await updateChecks(session.id, checksMet);
		return json({ reply: result.reply, emotion: result.emotion, checksMet, done: result.finished || used >= MAX_ANSWERS });
	} catch (cause) {
		if (cause instanceof AiUnavailableError) error(503, 'Layanan AI sedang sibuk. Jawabanmu tetap tersimpan, coba lagi.');
		throw cause;
	}
};
