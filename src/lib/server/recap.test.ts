import { describe, expect, it } from 'vitest';
import { summarizeClass, type RecapRow } from './recap';

const lines = (scores: number[]) =>
	['Kejelasan', 'Kesopanan', 'Penyelesaian masalah', 'Kelengkapan layanan'].map((criterion, index) => ({
		criterion,
		score: scores[index],
		reason: '',
		quote: '',
		needsReview: false
	}));

const row = (nickname: string, scores: number[], extra: Partial<RecapRow> = {}): RecapRow => ({
	nickname,
	scenario_id: 'checkin',
	score_json: JSON.stringify({ lines: lines(scores), better: '', checksMet: [] }),
	teacher_score_json: null,
	checks_met: '[0,1,2]',
	...extra
});

describe('summarizeClass', () => {
	it('mengembalikan rekap kosong untuk kelas tanpa latihan', () => {
		const recap = summarizeClass([]);
		expect(recap.sessions).toBe(0);
		expect(recap.weakest).toEqual([]);
		expect(recap.targetRate).toBeNull();
		expect(recap.criteria.every((item) => item.average === null)).toBe(true);
	});

	it('memakai skor guru bila sudah dikoreksi', () => {
		const recap = summarizeClass([row('Ayu', [2, 2, 2, 2], { teacher_score_json: '[4,4,4,4]' })]);
		expect(recap.reviewed).toBe(1);
		expect(recap.criteria[0].average).toBe(4);
		expect(recap.needsHelp).toEqual([]);
	});

	it('menghitung rata-rata, kriteria terlemah, dan target', () => {
		const recap = summarizeClass([
			row('Ayu', [3, 4, 2, 3]),
			row('ayu ', [4, 4, 1, 3], { checks_met: '[0]' }),
			row('Made', [2, 3, 2, 2])
		]);
		expect(recap.students).toBe(2);
		expect(recap.criteria.map((item) => item.average)).toEqual([3, 3.7, 1.7, 2.7]);
		expect(recap.weakest).toEqual(['Penyelesaian masalah']);
		expect(recap.targetRate).toBe(78);
	});

	it('menyebut semua kriteria terlemah bila nilainya seri', () => {
		const recap = summarizeClass([row('Ayu', [3, 2, 2, 2]), row('Made', [3, 3, 3, 3])]);
		expect(recap.weakest).toEqual(['Kesopanan', 'Penyelesaian masalah', 'Kelengkapan layanan']);
	});

	it('mengurutkan siswa yang perlu dibantu dari rata-rata terendah', () => {
		const recap = summarizeClass([row('Made', [2, 3, 2, 2]), row('Komang', [1, 2, 1, 2]), row('Ayu', [4, 4, 3, 4])]);
		expect(recap.needsHelp.map((student) => student.nickname)).toEqual(['Komang', 'Made']);
		expect(recap.needsHelp[0]).toEqual({ nickname: 'Komang', sessions: 1, average: 1.5 });
	});
});
