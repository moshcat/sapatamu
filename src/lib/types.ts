export const emotions = ['netral', 'senang', 'kesal', 'marah', 'sedih', 'bingung'] as const;
export type Emotion = (typeof emotions)[number];

export const roles = ['Siswa SMK', 'Lulusan SMK/D1-D3', 'Pekerja pariwisata'] as const;
export type Role = (typeof roles)[number];

export const levels = ['Dasar', 'Menengah', 'Mahir'] as const;
export type Level = (typeof levels)[number];

export type Area = 'Hotel' | 'Restoran';
export type Speaker = 'guest' | 'student';

export interface Turn {
	role: Speaker;
	text: string;
	emotion?: Emotion;
}

export const criteria = ['Kejelasan', 'Kesopanan', 'Penyelesaian masalah', 'Kelengkapan layanan'] as const;
export type Criterion = (typeof criteria)[number];

export interface ReportLine {
	criterion: Criterion;
	score: number;
	reason: string;
	quote: string;
	needsReview: boolean;
}

export interface Report {
	lines: ReportLine[];
	better: string;
	checksMet: number[];
}

export interface TeacherReview {
	scores: number[];
	note: string;
}

export interface SessionSummary {
	id: string;
	nickname: string;
	classCode: string | null;
	scenarioId: string;
	status: 'active' | 'finished';
	createdAt: string;
	reviewed: boolean;
}

export interface SessionDetail extends SessionSummary {
	role: Role;
	level: Level;
	turns: Turn[];
	checksMet: number[];
	report: Report | null;
	review: TeacherReview | null;
}

export interface ClassCode {
	code: string;
	name: string;
	finished: number;
}

export interface ClassRecap {
	sessions: number;
	students: number;
	reviewed: number;
	criteria: Array<{ criterion: Criterion; average: number | null }>;
	weakest: Criterion | null;
	needsHelp: Array<{ nickname: string; sessions: number; average: number }>;
	targetRate: number | null;
}

export const MAX_ANSWERS = 6;
export const CLASS_DAILY_SESSIONS = 30;
