import { error, json } from '@sveltejs/kit';
import { findScenario } from '$lib/scenarios';
import { getSession, saveReport } from '$lib/server/db';
import { limitRequests } from '$lib/server/limits';
import { AiUnavailableError, buildReport } from '$lib/server/llm';
import { mergeChecks } from '$lib/server/validate';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, getClientAddress }) => {
	await limitRequests(`finish:${getClientAddress()}`, 10);
	const session = await getSession(params.id);
	const scenario = session && findScenario(session.scenarioId);
	if (!session || !scenario) error(404, 'Latihan tidak ditemukan.');
	if (session.report) return json(session.report);
	if (!session.turns.some((turn) => turn.role === 'student')) error(400, 'Belum ada jawaban untuk dinilai.');
	try {
		const { value, model } = await buildReport(scenario, session.turns);
		const report = { ...value, checksMet: mergeChecks(session.checksMet, value.checksMet) };
		await saveReport(session.id, report, model);
		// Permintaan yang kalah balapan mengembalikan laporan yang benar-benar tersimpan.
		return json((await getSession(session.id))?.report ?? report);
	} catch (cause) {
		if (cause instanceof AiUnavailableError) error(503, 'Folio belum bisa dibuat. Jawabanmu tetap tersimpan, coba lagi.');
		throw cause;
	}
};
