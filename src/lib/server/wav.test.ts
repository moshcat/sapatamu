import { describe, expect, it } from 'vitest';
import { readPcm, toWav } from './wav';

const chunk = (name: string, body: Uint8Array) => {
	const bytes = new Uint8Array(8 + body.length + (body.length % 2));
	new TextEncoder().encodeInto(name, bytes);
	new DataView(bytes.buffer).setUint32(4, body.length, true);
	bytes.set(body, 8);
	return bytes;
};

function geminiWav(voice: Uint8Array, rate: number) {
	const format = new Uint8Array(16);
	const view = new DataView(format.buffer);
	view.setUint16(0, 1, true);
	view.setUint16(2, 1, true);
	view.setUint32(4, rate, true);
	const parts = [chunk('fmt ', format), chunk('data', voice), chunk('C2PA', new Uint8Array(64).fill(0x75))];
	const file = new Uint8Array(12 + parts.reduce((total, part) => total + part.length, 0));
	new TextEncoder().encodeInto('RIFF', file);
	new TextEncoder().encodeInto('WAVE', file.subarray(8));
	let offset = 12;
	for (const part of parts) {
		file.set(part, offset);
		offset += part.length;
	}
	return file;
}

describe('readPcm', () => {
	it('mengambil data suara saja dari WAV dan membuang metadata C2PA', () => {
		const voice = new Uint8Array([1, 2, 3, 4]);
		const { pcm, rate } = readPcm(geminiWav(voice, 16000), 'audio/wav');
		expect([...pcm]).toEqual([...voice]);
		expect(rate).toBe(16000);
	});

	it('menerima PCM mentah dan membaca rate dari mime type', () => {
		const voice = new Uint8Array([9, 8, 7, 6]);
		const { pcm, rate } = readPcm(voice, 'audio/L16;codec=pcm;rate=24000');
		expect(pcm).toBe(voice);
		expect(rate).toBe(24000);
	});

	it('menolak WAV tanpa data suara', () => {
		const file = geminiWav(new Uint8Array(), 24000).subarray(0, 36);
		expect(() => readPcm(file)).toThrow();
	});
});

describe('toWav', () => {
	it('memasang hening di depan dan menutup file tepat di akhir suara', () => {
		const voice = new Uint8Array([5, 6]);
		const wav = toWav(voice, 100);
		const { pcm, rate } = readPcm(wav);
		expect(rate).toBe(100);
		expect(pcm.length).toBe(60 + voice.length);
		expect([...pcm.subarray(0, 60)].every((sample) => sample === 0)).toBe(true);
		expect([...pcm.subarray(-2)]).toEqual([5, 6]);
		expect(wav.length).toBe(44 + pcm.length);
	});
});
