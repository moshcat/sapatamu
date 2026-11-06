CREATE TABLE sessions (
	id TEXT PRIMARY KEY,
	nickname TEXT NOT NULL,
	class_code TEXT,
	role TEXT NOT NULL,
	level TEXT NOT NULL,
	scenario_id TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'active',
	checks_met TEXT NOT NULL DEFAULT '[]',
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE turns (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	session_id TEXT NOT NULL REFERENCES sessions(id),
	role TEXT NOT NULL,
	text TEXT NOT NULL,
	emotion TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE reports (
	session_id TEXT PRIMARY KEY REFERENCES sessions(id),
	model TEXT NOT NULL,
	score_json TEXT NOT NULL,
	teacher_score_json TEXT,
	teacher_note TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE rate_limits (
	key TEXT NOT NULL,
	window INTEGER NOT NULL,
	count INTEGER NOT NULL DEFAULT 1,
	PRIMARY KEY (key, window)
);

CREATE INDEX turns_session ON turns(session_id, id);
CREATE INDEX sessions_class ON sessions(class_code, created_at);
