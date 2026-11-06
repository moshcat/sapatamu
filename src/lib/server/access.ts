export const normalizeCode = (value: unknown) => String(value ?? '').trim().toUpperCase().slice(0, 20);

// Format ACCESS_CODES: KODE:jatah_harian,KODE:jatah_harian
export function parseAccessCodes(raw = '') {
	const codes = new Map<string, number>();
	for (const entry of raw.split(',')) {
		const [code, limit] = entry.split(':');
		const daily = Number(limit);
		if (normalizeCode(code) && Number.isInteger(daily) && daily > 0) codes.set(normalizeCode(code), daily);
	}
	return codes;
}

// Tanpa huruf dan angka yang mirip (0, O, 1, I, L) supaya mudah disalin dari papan tulis.
const CODE_LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateClassCode() {
	const bytes = crypto.getRandomValues(new Uint8Array(6));
	return Array.from(bytes, (byte) => CODE_LETTERS[byte % CODE_LETTERS.length]).join('');
}
