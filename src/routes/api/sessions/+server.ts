import { error, json } from '@sveltejs/kit';
import * as env from '$app/env/private';
import { findScenario } from '$lib/scenarios';
import { normalizeCode } from '$lib/server/access';
import { accessLimit } from '$lib/server/classes';
import { createSession, listSessions } from '$lib/server/db';
import { DAY_MS, limitRequests } from '$lib/server/limits';
import { cleanText } from '$lib/server/validate';
import { levels, roles, type Level, type Role } from '$lib/types';
import type { RequestHandler } from './$types';

const PUBLIC_SESSIONS_PER_IP = 3;

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	await limitRequests(`session:${getClientAddress()}`, 10);
	const body = (await request.json()) as { scenarioId?: string; nickname?: string; role?: Role; level?: Level; classCode?: string };
	const scenario = findScenario(String(body.scenarioId));
	const nickname = cleanText(body.nickname, 40);
	if (!scenario || !nickname || !roles.includes(body.role as Role) || !levels.includes(body.level as Level)) error(400, 'Data latihan belum lengkap.');
	const classCode = normalizeCode(body.classCode) || null;
	if (classCode) {
		const limit = await accessLimit(classCode);
		if (!limit) error(400, 'Kode akses tidak dikenali. Buka Ganti peran untuk memperbaiki atau mengosongkannya.');
		await limitRequests(`code:${classCode}`, limit, DAY_MS, 'Jatah kode akses ini sudah habis hari ini. Coba lagi besok.');
	} else {
		await limitRequests(`public:${getClientAddress()}`, PUBLIC_SESSIONS_PER_IP, DAY_MS, `Jatah latihan hari ini sudah habis (${PUBLIC_SESSIONS_PER_IP} sesi). Coba lagi besok, atau masukkan kode akses dari guru.`);
		await limitRequests('public', Number(env.DAILY_SESSION_LIMIT || 60), DAY_MS, 'Batas latihan umum hari ini sudah tercapai. Coba lagi besok, atau masukkan kode akses dari guru.');
	}
	const id = await createSession({ nickname, classCode, role: body.role as Role, level: body.level as Level, scenarioId: scenario.id, opening: scenario.opening, emotion: scenario.openingEmotion });
	return json({ id, opening: scenario.opening, emotion: scenario.openingEmotion }, { status: 201 });
};

export const GET: RequestHandler = async ({ url }) => {
	const ids = (url.searchParams.get('ids') ?? '').split(',').filter(Boolean).slice(0, 50);
	return json(await listSessions(ids));
};
