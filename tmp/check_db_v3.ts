import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://lanhphammttb:Fjb8sHLDxZrpWBRb@gatapbay.u7f7ezb.mongodb.net/gatapbay?retryWrites=true&w=majority";

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
});

const UserProgress = mongoose.models.UserProgress || mongoose.model('UserProgress', UserProgressSchema, 'userprogress');

async function check() {
  try {
    console.log('Connecting to gatapbay db...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected');

    const roadmapId = "69c13f39010dd44a2c1571df";

    // 1. ALL DATA
    const all = await UserProgress.find().limit(5).lean();
    console.log('--- DB SAMPLES (5) ---');
    console.log(JSON.stringify(all, null, 2));

    // 2. SPECIFIC ROADMAP
    const roadmapDocs = await UserProgress.find({ roadmapId: new mongoose.Types.ObjectId(roadmapId) }).lean();
    console.log(`--- ROADMAP ${roadmapId} DOCS ---`);
    console.log(JSON.stringify(roadmapDocs, null, 2));

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

check();
