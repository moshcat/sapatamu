import { describe, expect, it } from 'vitest';
import { scenarios } from './scenarios';

describe('skenario', () => {
	it.each(['Hotel', 'Restoran'])('menyediakan minimal 20 kasus untuk %s', (area) => {
		expect(scenarios.filter((item) => item.area === area).length).toBeGreaterThanOrEqual(20);
	});

	it('memakai id dan nomor kamar atau meja yang unik', () => {
		expect(new Set(scenarios.map((item) => item.id)).size).toBe(scenarios.length);
		expect(new Set(scenarios.map((item) => `${item.unit}${item.room}`)).size).toBe(scenarios.length);
	});

	it('mempertahankan id lama supaya riwayat tetap terbaca', () => {
		const ids = scenarios.map((item) => item.id);
		expect(ids).toEqual(expect.arrayContaining(['fasilitas', 'checkin', 'keluhan', 'pesanan', 'alergi', 'terlambat']));
	});

	it.each(scenarios.map((item) => [item.id, item] as const))('%s lengkap dan punya sapaan untuk memilih suara', (_, item) => {
		expect(item.guest).toMatch(/^(Mr|Ms)\. /);
		expect(item.checks).toHaveLength(3);
		expect(item.opening.length).toBeLessThanOrEqual(400);
		expect(`${item.context}${item.title}${item.guest}`).not.toMatch(/—/);
	});

	it('menjaga kasus satu topik tetap berurutan untuk daftar berkelompok', () => {
		const order = scenarios.map((item) => `${item.area}/${item.topic}`).filter((key, index, list) => key !== list[index - 1]);
		expect(new Set(order).size).toBe(order.length);
	});
});
