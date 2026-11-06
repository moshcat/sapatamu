import { defineEnvVars } from '@sveltejs/kit/env';

const optional = (value: string | undefined) => value || undefined;

export const variables = defineEnvVars({
	GROQ_API_KEY: { schema: optional, description: 'Kunci API Groq untuk percakapan dan transkripsi' },
	GROQ_MODEL: { schema: optional },
	GROQ_STT_MODEL: { schema: optional },
	GEMINI_API_KEY: { schema: optional, description: 'Kunci API Gemini sebagai cadangan' },
	GEMINI_MODEL: { schema: optional },
	TEACHER_PIN: { schema: optional, description: 'PIN halaman guru' },
	DAILY_SESSION_LIMIT: { schema: optional, description: 'Batas sesi umum per hari' },
	ACCESS_CODES: { schema: optional, description: 'Kode akses dan jatah hariannya, format KODE:jatah,KODE:jatah' }
});
