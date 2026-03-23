import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

// Define simple schema for inspection
const UserProgressSchema = new mongoose.Schema({
  userId: String,
  email: String,
  roadmapId: mongoose.Schema.Types.ObjectId,
  articleTasks: [
    {
      articleId: mongoose.Schema.Types.ObjectId,
      taskIndices: [Number]
    }
  ],
  xp: Number,
  streak: Number
}, { collection: 'userprogress' }); // Ensure name is correct

const UserProgress = mongoose.models.UserProgress || mongoose.model('UserProgress', UserProgressSchema);

async function check() {
  try {
    if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined in .env');
    
    console.log('Connecting...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected');

    const roadmapId = "69c13f39010dd44a2c1571df";
    const articleId = "69c13758e17ec109cb8335ba";

    // 1. ALL DATA
    const all = await UserProgress.find().limit(3).lean();
    console.log('--- ALL (3) ---');
    console.log(JSON.stringify(all, null, 2));

    // 2. SPECIFIC ROADMAP
    const roadmapDocs = await UserProgress.find({ roadmapId: new mongoose.Types.ObjectId(roadmapId) }).lean();
    console.log(`--- ROADMAP ${roadmapId} ---`);
    console.log(JSON.stringify(roadmapDocs, null, 2));

    // 3. SPECIFIC USER/EMAIL if found
    if (roadmapDocs.length > 0) {
        const email = roadmapDocs[0].email;
        console.log(`--- EMAIL ${email} ---`);
        const userDocs = await UserProgress.find({ email }).lean();
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
