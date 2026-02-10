import { initDb, seedDb } from './client.js';

console.log('Initializing database...');
initDb();
console.log('Seeding data...');
seedDb();
console.log('Done.');
