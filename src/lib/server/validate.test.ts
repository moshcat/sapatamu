import { describe, expect, it } from 'vitest';
import { cleanText, parseGuestReply, parseReport } from './validate';

const answer = 'I am very sorry. Let me check your booking.';
const report = (criterion: (index: number) => string, score = 3) =>
	JSON.stringify({
		lines: [0, 1, 2, 3].map((index) => ({ criterion: criterion(index), score, reason: 'Jelas.', quote: 'Let me check', needs_review: false })),
		better: 'Let me check that for you.',
		checks_met: [0, 9]
	});

describe('parseGuestReply', () => {
	it('memakai emosi netral untuk nilai tidak dikenal', () => {
		const result = parseGuestReply('{"reply":"Hello","emotion":"angry","checks_met":[1,7],"finished":true}', 3);
		expect(result).toEqual({ reply: 'Hello', emotion: 'netral', checksMet: [1], finished: true });
	});

	it('menolak balasan kosong', () => {
		expect(() => parseGuestReply('{"reply":""}', 3)).toThrow();
	});
});

describe('parseReport', () => {
	it('tetap membaca skor saat nama kriteria berbeda', () => {
		const result = parseReport(report((index) => `Criterion ${index}`), [answer], 3);
		expect(result.lines.map((line) => line.criterion)).toEqual(['Kejelasan', 'Kesopanan', 'Penyelesaian masalah', 'Kelengkapan layanan']);
		expect(result.checksMet).toEqual([0]);
	});

	it('menandai kutipan yang tidak ada di jawaban', () => {
		const result = parseReport(report(() => 'Kejelasan').replaceAll('Let me check', 'Invented quote'), [answer], 3);
		expect(result.lines[0]).toMatchObject({ quote: '', needsReview: true });
	});

	it('menolak skor di luar 1 sampai 4', () => {
		expect(() => parseReport(report(() => 'Kejelasan', 5), [answer], 3)).toThrow();
	});
});

describe('cleanText', () => {
	it('merapikan spasi dan membatasi panjang', () => {
		expect(cleanText('  halo\n\tdunia ', 40)).toBe('halo dunia');
		expect(cleanText('a'.repeat(600), 500)).toHaveLength(500);
		expect(cleanText(undefined, 40)).toBe('');
	});
});
