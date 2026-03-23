import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://lanhphammttb:Fjb8sHLDxZrpWBRb@gatapbay.u7f7ezb.mongodb.net/";

async function check() {
  try {
    console.log('Connecting...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected');

    const admin = mongoose.connection.useDb('admin').db;
    if (!admin) throw new Error('Admin DB object is undefined');

    console.log('--- DATABASES ---');
    const dbs = await admin.admin().listDatabases();
    console.log(dbs.databases.map(d => d.name));

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

check();
