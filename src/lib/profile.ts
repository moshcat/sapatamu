import { levels, roles, type Level, type Role } from '$lib/types';

export interface LearnerProfile {
	role: Role;
	nickname: string;
	classCode: string;
	level: Level;
}

export interface TeacherProfile {
	role: 'Guru';
}

export type Profile = LearnerProfile | TeacherProfile;

const PROFILE_KEY = 'sapatamu:profile';
const DONE_KEY = 'sapatamu:done';
const SESSIONS_KEY = 'sapatamu:sessions';
const MAX_SESSIONS = 50;

// Cadangan selama tab terbuka kalau localStorage diblokir, supaya alur tetap jalan.
const memory = new Map<string, string>();

function read(key: string) {
	try {
		return localStorage.getItem(key) ?? memory.get(key) ?? null;
	} catch {
		return memory.get(key) ?? null;
	}
}

function write(key: string, value: string) {
	memory.set(key, value);
	try {
		localStorage.setItem(key, value);
	} catch {
		return;
	}
}

function readJson(key: string): unknown {
	try {
		return JSON.parse(read(key) ?? 'null');
	} catch {
		return null;
	}
}

const readList = (key: string) => {
	const value = readJson(key);
	return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
};

export function readProfile(): Profile | null {
	const value = readJson(PROFILE_KEY) as Partial<LearnerProfile> | { role: 'Guru' } | null;
	if (value?.role === 'Guru') return { role: 'Guru' };
	const learner = value as Partial<LearnerProfile> | null;
	if (!learner || !roles.includes(learner.role as Role) || !levels.includes(learner.level as Level)) return null;
	if (typeof learner.nickname !== 'string' || !learner.nickname) return null;
	return {
		role: learner.role as Role,
		nickname: learner.nickname,
		classCode: typeof learner.classCode === 'string' ? learner.classCode : '',
		level: learner.level as Level
	};
}

export const saveProfile = (profile: Profile) => write(PROFILE_KEY, JSON.stringify(profile));

export function clearProfile() {
	memory.delete(PROFILE_KEY);
	try {
		localStorage.removeItem(PROFILE_KEY);
	} catch {
		return;
	}
}

export const homePath = (profile: Profile) => (profile.role === 'Guru' ? '/guru' : '/latihan');

export const doneScenarios = () => new Set(readList(DONE_KEY));

export const markScenarioDone = (scenarioId: string) =>
	write(DONE_KEY, JSON.stringify([...doneScenarios().add(scenarioId)]));

export const sessionIds = () => readList(SESSIONS_KEY);

export const rememberSession = (id: string) =>
	write(SESSIONS_KEY, JSON.stringify([id, ...sessionIds().filter((item) => item !== id)].slice(0, MAX_SESSIONS)));
