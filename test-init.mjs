import { initDatabase } from './src/lib/infrastructure/db/init.ts';
try {
  await initDatabase();
  console.log('ok');
} catch (e) {
  console.error('ERR', e);
}
