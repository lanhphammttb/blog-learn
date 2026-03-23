import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import UserProgress from '@/models/UserProgress';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { articleId, taskIndex, completed, roadmapId } = await request.json();
    await dbConnect();
    
    const userId = (session.user as any).id;
    const providerId = (session.user as any).providerId;
    const email = session.user.email;

    if (!roadmapId || !mongoose.Types.ObjectId.isValid(roadmapId)) {
      return NextResponse.json({ success: false, error: 'Roadmap context required' }, { status: 200 });
    }

    const roadmapIdObj = new mongoose.Types.ObjectId(roadmapId);
    const articleIdObj = new mongoose.Types.ObjectId(articleId);
    
    // 1. Find or Create Document
    const userFilter = {
      $or: [
        { userId: userId || providerId },
        { email: email }
      ].filter(f => Object.values(f)[0]), 
      roadmapId: roadmapIdObj
    };

    let doc = await UserProgress.findOne(userFilter);
    if (!doc) {
      doc = await UserProgress.create({
        userId: userId || providerId || email,
        email: email,
        roadmapId: roadmapIdObj,
        articleTasks: [],
        xp: 0,
        streak: 1,
        lastActive: new Date()
      });
    }

    // 2. Ensure articleTasks is initialized
    if (!doc.articleTasks) doc.articleTasks = [];

    // 3. Precise Memory Manipulation (Ensures absolute truth)
    let entry = doc.articleTasks.find(at => at.articleId.toString() === articleId);
    
    if (!entry) {
      // Create entry if missing
      const newEntry = { articleId: articleIdObj, taskIndices: [] };
      doc.articleTasks.push(newEntry as any);
      entry = newEntry as any;
    }

    const indexInArray = entry.taskIndices.indexOf(taskIndex);

    if (completed) {
      if (indexInArray === -1) {
        entry.taskIndices.push(taskIndex);
        doc.xp = (doc.xp || 0) + 10;
      }
    } else {
      if (indexInArray !== -1) {
        entry.taskIndices.splice(indexInArray, 1);
      }
    }

    doc.lastActive = new Date();
    doc.lastUpdated = new Date();
    
    // 4. Force Mongoose to track changes in the nested array
    doc.markModified('articleTasks');
    
    // 5. Guaranteed Save
    await doc.save();

    // 5. Return Absolute Truth from the saved document
    return NextResponse.json({ 
      success: true, 
      completedTasks: entry.taskIndices,
      xp: doc.xp || 0,
      streak: doc.streak || 0
    });
  } catch (error: any) {
    console.error(`[FATAL ERROR] TaskAPI:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
