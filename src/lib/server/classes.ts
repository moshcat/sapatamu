import { env as bindings } from 'cloudflare:workers';
import * as env from '$app/env/private';
import { CLASS_DAILY_SESSIONS, type ClassCode } from '$lib/types';
import { generateClassCode, parseAccessCodes } from './access';
import { summarizeClass, type RecapRow } from './recap';

export const MAX_CLASSES = 30;

export async function accessLimit(code: string) {
	const fixed = parseAccessCodes(env.ACCESS_CODES).get(code);
	if (fixed) return fixed;
	const row = await bindings.DB.prepare('SELECT 1 FROM class_codes WHERE code = ?').bind(code).first();
	return row ? CLASS_DAILY_SESSIONS : undefined;
}

export async function listClasses() {
	const { results } = await bindings.DB.prepare(`
		SELECT c.code, c.name, count(s.id) AS finished FROM class_codes c
		LEFT JOIN sessions s ON s.class_code = c.code AND s.status = 'finished'
		GROUP BY c.code ORDER BY c.created_at DESC
	`).all<ClassCode>();
	return results;
}

export async function classRecap(code: string) {
	const { results } = await bindings.DB.prepare(`
		SELECT s.nickname, s.scenario_id, s.checks_met, r.score_json, r.teacher_score_json FROM sessions s
		JOIN reports r ON r.session_id = s.id
		WHERE s.class_code = ? AND s.status = 'finished'
	`).bind(code).all<RecapRow>();
	return summarizeClass(results);
}

export async function countClasses() {
	const row = await bindings.DB.prepare('SELECT count(*) AS total FROM class_codes').first<{ total: number }>();
	return row?.total ?? 0;
}

export async function createClass(name: string): Promise<ClassCode> {
	const code = generateClassCode();
	await bindings.DB.prepare('INSERT INTO class_codes (code, name) VALUES (?, ?)').bind(code, name).run();
	return { code, name, finished: 0 };
}

export async function deleteClass(code: string) {
	const result = await bindings.DB.prepare('DELETE FROM class_codes WHERE code = ?').bind(code).run();
	return result.meta.changes > 0;
}
