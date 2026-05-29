import {
	getDb,
	getDatabaseBackend,
	initDatabase,
	type AppDatabase,
	type DatabaseBackend
} from './init';

export { initDatabase, getDb, getDatabaseBackend, type AppDatabase, type DatabaseBackend };

export const db = new Proxy({} as AppDatabase, {
	get(_target, prop) {
		return Reflect.get(getDb(), prop);
	}
});
