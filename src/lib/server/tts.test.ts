import { describe, expect, it, vi } from 'vitest';

vi.mock('cloudflare:workers', () => ({ env: {} }));
vi.mock('$app/env/private', () => ({}));

const { speechKey, voiceFor } = await import('./tts');

describe('speechKey', () => {
	it('sama untuk kalimat, suara, dan emosi yang sama', async () => {
		expect(await speechKey('Kore', 'senang', 'Hello')).toBe(await speechKey('Kore', 'senang', 'Hello'));
	});

	it('berbeda bila emosi atau suara berubah', async () => {
		const base = await speechKey('Kore', 'senang', 'Hello');
		expect(await speechKey('Kore', 'sedih', 'Hello')).not.toBe(base);
		expect(await speechKey('Puck', 'senang', 'Hello')).not.toBe(base);
	});
});

describe('voiceFor', () => {
	it('memakai suara pria untuk tamu Mr.', () => {
		expect(voiceFor({ guest: 'Mr. Wayne' }).voice).toBe('Puck');
		expect(voiceFor({ guest: 'Ms. Novak' }).voice).toBe('Kore');
	});
});
