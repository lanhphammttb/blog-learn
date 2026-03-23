import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://lanhphammttb:Fjb8sHLDxZrpWBRb@gatapbay.u7f7ezb.mongodb.net/test";

async function check() {
  try {
    console.log('Connecting to test db...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected');

    const db = mongoose.connection.db;
    if (!db) throw new Error('DB object is undefined');

    console.log('--- USERPROGRESSES DATA ---');
    const data = await db.collection('userprogresses').find().toArray();
    console.log(JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

check();
