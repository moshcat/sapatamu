import { describe, expect, it } from 'vitest';
import { generateClassCode, normalizeCode, parseAccessCodes } from './access';

describe('parseAccessCodes', () => {
	it('membaca kode dan jatah harian', () => {
		const codes = parseAccessCodes('KELAS-A:40, kelas-b:60');
		expect(codes.get('KELAS-A')).toBe(40);
		expect(codes.get('KELAS-B')).toBe(60);
	});

	it('mengabaikan isian rusak dan env kosong', () => {
		expect(parseAccessCodes('TANPA-JATAH,NOL:0,MINUS:-2,:5').size).toBe(0);
		expect(parseAccessCodes(undefined).size).toBe(0);
	});
});

describe('generateClassCode', () => {
	it('membuat 6 karakter tanpa huruf dan angka yang mirip', () => {
		const codes = Array.from({ length: 200 }, () => generateClassCode());
		expect(codes.every((code) => /^[A-HJKMNP-Z2-9]{6}$/.test(code))).toBe(true);
		expect(new Set(codes).size).toBeGreaterThan(190);
	});
});

describe('normalizeCode', () => {
	it('tidak membedakan huruf besar dan spasi di tepi', () => {
		expect(normalizeCode('  kelas-a ')).toBe('KELAS-A');
		expect(normalizeCode(undefined)).toBe('');
	});
});
