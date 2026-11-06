import { error } from '@sveltejs/kit';
import { env } from 'cloudflare:workers';
import type { Emotion, Level, Report, Role, SessionDetail, SessionSummary, TeacherReview, Turn } from '$lib/types';

interface SessionRow {
	id: string;
	nickname: string;
	class_code: string | null;
	role: string;
	level: string;
	scenario_id: string;
	status: string;
	checks_met: string;
	created_at: string;
	score_json?: string | null;
	teacher_score_json?: string | null;
	teacher_note?: string | null;
}

const summary = (row: SessionRow): SessionSummary => ({
	id: row.id,
	nickname: row.nickname,
	classCode: row.class_code,
	scenarioId: row.scenario_id,
	status: row.status as SessionSummary['status'],
	createdAt: row.created_at,
	reviewed: Boolean(row.teacher_score_json)
});

export async function createSession(input: { nickname: string; classCode: string | null; role: Role; level: Level; scenarioId: string; opening: string; emotion: Emotion }) {
	const id = crypto.randomUUID();
	await env.DB.batch([
		env.DB.prepare('INSERT INTO sessions (id, nickname, class_code, role, level, scenario_id) VALUES (?, ?, ?, ?, ?, ?)')
			.bind(id, input.nickname, input.classCode, input.role, input.level, input.scenarioId),
		env.DB.prepare('INSERT INTO turns (session_id, role, text, emotion) VALUES (?, ?, ?, ?)')
			.bind(id, 'guest', input.opening, input.emotion)
	]);
	return id;
}

export async function addTurn(sessionId: string, turn: Turn) {
	await env.DB.prepare('INSERT INTO turns (session_id, role, text, emotion) VALUES (?, ?, ?, ?)')
		.bind(sessionId, turn.role, turn.text, turn.emotion ?? null)
		.run();
}

export async function getSession(id: string): Promise<SessionDetail | null> {
	const [sessions, turns] = await env.DB.batch<Record<string, unknown>>([
		env.DB.prepare(`
			SELECT s.*, r.score_json, r.teacher_score_json, r.teacher_note FROM sessions s
			LEFT JOIN reports r ON r.session_id = s.id WHERE s.id = ?
		`).bind(id),
		env.DB.prepare('SELECT role, text, emotion FROM turns WHERE session_id = ? ORDER BY id').bind(id)
	]);
	const row = sessions.results[0] as unknown as SessionRow | undefined;
	if (!row) return null;
	const rows = turns.results as unknown as Array<{ role: Turn['role']; text: string; emotion: Emotion | null }>;
	return {
		...summary(row),
		role: row.role as Role,
		level: row.level as Level,
		turns: rows.map((turn) => ({ role: turn.role, text: turn.text, emotion: turn.emotion ?? undefined })),
		checksMet: JSON.parse(row.checks_met) as number[],
		report: row.score_json ? (JSON.parse(row.score_json) as Report) : null,
		review: row.teacher_score_json ? { scores: JSON.parse(row.teacher_score_json) as number[], note: row.teacher_note ?? '' } : null
	};
}

export async function requireActiveSession(id: string) {
	const session = await getSession(id);
	if (!session) error(404, 'Latihan tidak ditemukan.');
	if (session.status !== 'active') error(409, 'Latihan ini sudah selesai.');
	return session;
}

export async function updateChecks(id: string, checks: number[]) {
	await env.DB.prepare('UPDATE sessions SET checks_met = ? WHERE id = ?').bind(JSON.stringify(checks), id).run();
}

export async function saveReport(id: string, report: Report, model: string) {
	await env.DB.batch([
		env.DB.prepare('INSERT OR IGNORE INTO reports (session_id, model, score_json) VALUES (?, ?, ?)').bind(id, model, JSON.stringify(report)),
		env.DB.prepare("UPDATE sessions SET status = 'finished', checks_met = ? WHERE id = ? AND status = 'active'").bind(JSON.stringify(report.checksMet), id)
	]);
}

export async function listClassSessions(query: string) {
	const { results } = await env.DB.prepare(`
		SELECT s.*, r.teacher_score_json FROM sessions s LEFT JOIN reports r ON r.session_id = s.id
		WHERE s.class_code IS NOT NULL AND s.status = 'finished' AND lower(s.class_code) LIKE ?
		ORDER BY s.created_at DESC LIMIT 100
	`).bind(`%${query.toLowerCase()}%`).all<SessionRow>();
	return results.map(summary);
}

export async function listSessions(ids: string[]) {
	if (!ids.length) return [];
	const marks = ids.map(() => '?').join(',');
	const { results } = await env.DB.prepare(`
		SELECT s.*, r.teacher_score_json FROM sessions s LEFT JOIN reports r ON r.session_id = s.id
		WHERE s.id IN (${marks}) AND s.status = 'finished' ORDER BY s.created_at DESC
	`).bind(...ids).all<SessionRow>();
	return results.map(summary);
}

export async function saveReview(id: string, review: TeacherReview) {
	const result = await env.DB.prepare('UPDATE reports SET teacher_score_json = ?, teacher_note = ? WHERE session_id = ?')
		.bind(JSON.stringify(review.scores), review.note, id)
		.run();
	return result.meta.changes > 0;
}
