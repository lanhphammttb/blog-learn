import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://lanhphammttb:Fjb8sHLDxZrpWBRb@gatapbay.u7f7ezb.mongodb.net/";

async function check() {
  try {
    console.log('Connecting...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected');

    const dbNames = ['test', 'docsave', 'hala_handmade'];

    for (const dbName of dbNames) {
        const db = mongoose.connection.useDb(dbName).db;
        if (!db) continue;
        console.log(`--- COLLECTIONS IN ${dbName} ---`);
        const collections = await db.listCollections().toArray();
        console.log(collections.map(c => c.name));
        for (const coll of collections) {
            const count = await db.collection(coll.name).countDocuments();
            console.log(`Collection: ${coll.name}, Count: ${count}`);
        }
    }

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

check();
