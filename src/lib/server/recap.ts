import { findScenario } from '$lib/scenarios';
import { criteria, type ClassRecap, type Criterion, type Report } from '$lib/types';

export interface RecapRow {
	nickname: string;
	scenario_id: string;
	score_json: string;
	teacher_score_json: string | null;
	checks_met: string;
}

const HELP_BELOW = 3;
const HELP_LIMIT = 3;

const mean = (values: number[]) => (values.length ? values.reduce((total, value) => total + value, 0) / values.length : null);
const round = (value: number | null) => (value === null ? null : Math.round(value * 10) / 10);

// Skor guru menggantikan skor AI pada kriteria yang sama, seperti di folio siswa.
export function summarizeClass(rows: RecapRow[]): ClassRecap {
	const byCriterion = new Map<Criterion, number[]>(criteria.map((criterion) => [criterion, []]));
	const byStudent = new Map<string, { nickname: string; sessions: number; scores: number[] }>();
	let reviewed = 0;
	let targetsMet = 0;
	let targetsTotal = 0;

	for (const row of rows) {
		const report = JSON.parse(row.score_json) as Report;
		const corrected = row.teacher_score_json ? (JSON.parse(row.teacher_score_json) as number[]) : null;
		if (corrected) reviewed += 1;
		const scores = report.lines.map((line, index) => {
			const score = corrected?.[index] ?? line.score;
			byCriterion.get(line.criterion)?.push(score);
			return score;
		});

		const name = row.nickname.trim();
		const key = name.toLowerCase();
		const student = byStudent.get(key) ?? { nickname: name, sessions: 0, scores: [] };
		student.sessions += 1;
		student.scores.push(...scores);
		byStudent.set(key, student);

		const checks = findScenario(row.scenario_id)?.checks.length ?? 0;
		targetsTotal += checks;
		targetsMet += Math.min((JSON.parse(row.checks_met) as number[]).length, checks);
	}

	const averages = criteria.map((criterion) => ({ criterion, average: round(mean(byCriterion.get(criterion) ?? [])) }));
	const scored = averages.filter((item): item is { criterion: Criterion; average: number } => item.average !== null);
	const lowest = Math.min(...scored.map((item) => item.average));
	const weakest = scored.filter((item) => item.average === lowest).map((item) => item.criterion);
	const needsHelp = [...byStudent.values()]
		.map((student) => ({ nickname: student.nickname, sessions: student.sessions, average: round(mean(student.scores)) ?? 0 }))
		.filter((student) => student.average < HELP_BELOW)
		.sort((a, b) => a.average - b.average || a.nickname.localeCompare(b.nickname))
		.slice(0, HELP_LIMIT);

	return {
		sessions: rows.length,
		students: byStudent.size,
		reviewed,
		criteria: averages,
		weakest,
		needsHelp,
		targetRate: targetsTotal ? Math.round((targetsMet / targetsTotal) * 100) : null
	};
}
