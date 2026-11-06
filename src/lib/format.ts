const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

// SQLite menyimpan waktu UTC tanpa zona, misalnya "2026-11-06 08:30:00".
export function formatDate(value: string) {
	const hasZone = /(z|[+-]\d{2}:?\d{2})$/i.test(value);
	const date = new Date(hasZone ? value : `${value.replace(' ', 'T')}Z`);
	return Number.isNaN(date.getTime()) ? value : dateFormat.format(date);
}
