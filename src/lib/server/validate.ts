import { criteria, emotions, type Emotion, type Report } from '$lib/types';

export interface GuestReply {
	reply: string;
	emotion: Emotion;
	checksMet: number[];
	finished: boolean;
}

const asRecord = (value: unknown): Record<string, unknown> => {
	if (typeof value !== 'object' || value === null) throw new Error('Respons AI bukan objek JSON');
	return value as Record<string, unknown>;
};

const normalize = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

const asIndexes = (value: unknown, count: number) =>
	Array.isArray(value)
		? [...new Set(value.filter((item): item is number => Number.isInteger(item) && item >= 0 && item < count))]
		: [];

export function parseGuestReply(raw: string, checkCount: number): GuestReply {
	const data = asRecord(JSON.parse(raw));
	const reply = typeof data.reply === 'string' ? data.reply.trim() : '';
	if (!reply) throw new Error('Respons tamu kosong');
	return {
		reply: reply.slice(0, 400),
		emotion: emotions.includes(data.emotion as Emotion) ? (data.emotion as Emotion) : 'netral',
		checksMet: asIndexes(data.checks_met, checkCount),
		finished: data.finished === true
	};
}

export function parseReport(raw: string, answers: string[], checkCount: number): Report {
	const data = asRecord(JSON.parse(raw));
	if (!Array.isArray(data.lines) || data.lines.length < criteria.length) throw new Error('Laporan AI tidak berisi semua skor');
	const rows = data.lines.map(asRecord);
	const lines = criteria.map((criterion, index) => {
		const line = rows.find((row) => row.criterion === criterion) ?? rows[index];
		const score = Number(line.score);
		if (!Number.isInteger(score) || score < 1 || score > 4) throw new Error(`Skor ${criterion} tidak valid`);
		const quote = typeof line.quote === 'string' ? line.quote.trim().replace(/^["'“”]+|["'“”]+$/g, '') : '';
		const quoteFound = quote.length > 0 && answers.some((answer) => normalize(answer).includes(normalize(quote)));
		return {
			criterion,
			score,
			reason: typeof line.reason === 'string' ? line.reason.trim().slice(0, 300) : '',
			quote: quoteFound ? quote : '',
			needsReview: line.needs_review === true || !quoteFound
		};
	});
	return {
		lines,
		better: typeof data.better === 'string' ? data.better.trim().slice(0, 300) : '',
		checksMet: asIndexes(data.checks_met, checkCount)
	};
}

export const cleanText = (value: unknown, max: number) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

export const mergeChecks = (first: number[], second: number[]) => [...new Set([...first, ...second])].sort();
