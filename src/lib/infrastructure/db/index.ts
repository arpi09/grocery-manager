import { getDb, initDatabase, type AppDatabase } from './init';

export { initDatabase, getDb, type AppDatabase };

export const db = new Proxy({} as AppDatabase, {
	get(_target, prop) {
		return Reflect.get(getDb(), prop);
	}
});
