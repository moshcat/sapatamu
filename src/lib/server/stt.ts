import * as env from '$app/env/private';

export class TranscriptionError extends Error {}

// Prompt berisi nama dan istilah dari skenario supaya Whisper tidak salah dengar nama tempat atau tamu.
export async function transcribe(audio: File, prompt = '') {
	if (!env.GROQ_API_KEY) throw new TranscriptionError('GROQ_API_KEY belum diisi');
	const form = new FormData();
	form.append('file', audio, audio.name || 'answer.webm');
	form.append('model', env.GROQ_STT_MODEL || 'whisper-large-v3-turbo');
	form.append('language', 'en');
	form.append('response_format', 'json');
	if (prompt) form.append('prompt', prompt);
	const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
		method: 'POST',
		headers: { Authorization: `Bearer ${env.GROQ_API_KEY}` },
		body: form,
		signal: AbortSignal.timeout(20_000)
	});
	if (!response.ok) throw new TranscriptionError(`Transkripsi gagal dengan status ${response.status}`);
	const data = (await response.json()) as { text?: unknown };
	return typeof data?.text === 'string' ? data.text.trim() : '';
}
