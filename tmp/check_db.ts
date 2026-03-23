import dbConnect from '../src/lib/db';
import UserProgress from '../src/models/UserProgress';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Force load .env from root
dotenv.config({ path: path.join(__dirname, '../.env') });

async function check() {
  try {
    console.log('URI:', process.env.MONGODB_URI?.substring(0, 20) + '...');
    await dbConnect();
    console.log('Connected to MongoDB');

    const roadmapId = "69c13f39010dd44a2c1571df";
    
    // 1. Look for ALL progress docs to see the structure
    const all = await UserProgress.find().limit(3).lean();
    console.log('--- DB SAMPLES ---');
    console.log(JSON.stringify(all, null, 2));

    // 2. Look for the specific roadmap
    const found = await UserProgress.find({ roadmapId: new mongoose.Types.ObjectId(roadmapId) }).lean();
    console.log(`--- FOUND FOR ROADMAP ${roadmapId} ---`);
    console.log(JSON.stringify(found, null, 2));

    // 3. Look for the user mentioned in the sample if any
    if (all.length > 0) {
        const u = all[0];
        console.log(`--- CHECKING USER ${u.email} ---`);
        const userDocs = await UserProgress.find({ email: u.email }).lean();
        console.log(JSON.stringify(userDocs, null, 2));
    }

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

check();
