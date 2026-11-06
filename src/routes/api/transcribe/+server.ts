import { error, json } from '@sveltejs/kit';
import { requireActiveSession } from '$lib/server/db';
import { DAY_MS, limitRequests, SESSION_CALLS } from '$lib/server/limits';
import { transcribe, TranscriptionError } from '$lib/server/stt';
import type { RequestHandler } from './$types';

const MAX_REQUEST_BYTES = 1024 * 1024;

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	await limitRequests(`stt:${getClientAddress()}`, 18);
	const size = Number(request.headers.get('content-length'));
	if (!size || size > MAX_REQUEST_BYTES) error(413, 'Rekaman terlalu panjang. Coba jawab lebih singkat.');
	const form = await request.formData();
	const session = await requireActiveSession(String(form.get('sessionId') ?? ''));
	await limitRequests(`stt-session:${session.id}`, SESSION_CALLS, DAY_MS);
	const audio = form.get('audio');
	if (!(audio instanceof File) || audio.size === 0) error(400, 'Rekaman tidak ditemukan.');
	try {
		return json({ text: await transcribe(audio) });
	} catch (cause) {
		if (cause instanceof TranscriptionError) error(503, 'Suara belum bisa diubah menjadi teks. Ketik jawabanmu atau coba lagi.');
		throw cause;
	}
};
