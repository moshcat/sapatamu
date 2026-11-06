export class ApiError extends Error {
	constructor(
		readonly status: number,
		message: string
	) {
		super(message);
	}
}

interface RequestOptions {
	method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
	json?: unknown;
	form?: FormData;
}

export async function request<T>(path: string, { method = 'GET', json, form }: RequestOptions = {}): Promise<T> {
	const headers: Record<string, string> = { accept: 'application/json' };
	if (json !== undefined) headers['content-type'] = 'application/json';
	let response: Response;
	try {
		response = await fetch(path, { method, headers, body: json !== undefined ? JSON.stringify(json) : form });
	} catch {
		throw new ApiError(0, 'Koneksi terputus. Periksa internet, lalu coba lagi.');
	}
	if (response.ok) return (await response.json()) as T;
	const data = (await response.json().catch(() => null)) as { message?: string } | null;
	const readable = response.status < 500 || response.status === 503;
	throw new ApiError(response.status, (readable && data?.message) || 'Server sedang bermasalah. Coba lagi.');
}

export const errorMessage = (cause: unknown) =>
	cause instanceof ApiError ? cause.message : 'Terjadi gangguan. Coba lagi.';
