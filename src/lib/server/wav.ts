const LEADING_SILENCE_SECONDS = 0.3;
const encoder = new TextEncoder();
const label = (bytes: Uint8Array, offset: number) => String.fromCharCode(...bytes.subarray(offset, offset + 4));

// Model 3.8 mengirim WAV dengan chunk C2PA di belakang data, model lain mengirim PCM mentah.
export function readPcm(audio: Uint8Array, mimeType = '') {
	const fallbackRate = Number(mimeType.match(/rate=(\d+)/)?.[1] ?? 24000);
	if (audio.length < 12 || label(audio, 0) !== 'RIFF') return { pcm: audio, rate: fallbackRate };
	const view = new DataView(audio.buffer, audio.byteOffset, audio.byteLength);
	let rate = fallbackRate;
	for (let offset = 12; offset + 8 <= audio.length; ) {
		const size = view.getUint32(offset + 4, true);
		const start = offset + 8;
		const chunk = label(audio, offset);
		if (chunk === 'fmt ') rate = view.getUint32(start + 4, true);
		if (chunk === 'data') return { pcm: audio.subarray(start, start + size), rate };
		offset = start + size + (size % 2);
	}
	throw new Error('Audio WAV tidak punya data suara');
}

export function toWav(pcm: Uint8Array, rate: number) {
	const silence = Math.floor(rate * LEADING_SILENCE_SECONDS) * 2;
	const size = silence + pcm.length;
	const wav = new Uint8Array(44 + size);
	const view = new DataView(wav.buffer);
	encoder.encodeInto('RIFF', wav);
	view.setUint32(4, 36 + size, true);
	encoder.encodeInto('WAVEfmt ', wav.subarray(8));
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	view.setUint16(22, 1, true);
	view.setUint32(24, rate, true);
	view.setUint32(28, rate * 2, true);
	view.setUint16(32, 2, true);
	view.setUint16(34, 16, true);
	encoder.encodeInto('data', wav.subarray(36));
	view.setUint32(40, size, true);
	wav.set(pcm, 44 + silence);
	return wav;
}
