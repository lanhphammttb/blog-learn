import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import UserProgress from '@/models/UserProgress';
import Roadmap from '@/models/Roadmap';
import mongoose from 'mongoose';

// Only Admin can access
async function checkAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return false;
  }
  return true;
}

export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    
    // Find all progress records that have pending submissions
    const progressRecords = await UserProgress.find({
      'projectSubmissions.status': 'pending'
    }).lean();

    // Enrich with Roadmap details
    const enrichedSubmissions = await Promise.all(progressRecords.map(async (record) => {
      const roadmap = await Roadmap.findById(record.roadmapId).select('title').lean();
      
      // Filter only pending submissions from this record
      const pendingOnes = record.projectSubmissions.filter((s:any) => s.status === 'pending');
      
      return pendingOnes.map((s:any) => ({
        ...s,
        userId: record.userId,
        userEmail: record.email,
        roadmapId: record.roadmapId,
        roadmapTitle: roadmap?.title || 'Unknown Roadmap',
        progressId: record._id
      }));
    }));

    // Flatten the array
    const flatSubmissions = enrichedSubmissions.flat();

    return NextResponse.json(flatSubmissions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { progressId, bossId, status, feedback } = await request.json();

    if (!progressId || !bossId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const progress = await UserProgress.findById(progressId);
    if (!progress) {
      return NextResponse.json({ error: 'Progress record not found' }, { status: 404 });
    }

    // Find the submission in the array
    const submissionIndex = progress.projectSubmissions.findIndex(s => s.bossId === bossId);
    if (submissionIndex === -1) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Update status and feedback
    progress.projectSubmissions[submissionIndex].status = status;
    progress.projectSubmissions[submissionIndex].feedback = feedback;

    // If Approved: 
    // 1. Award +50 XP
    // 2. Add to completedProjects to allow unlocking next phase
    if (status === 'approved') {
       progress.xp = (progress.xp || 0) + 50;
       if (!progress.completedProjects.includes(bossId)) {
          progress.completedProjects.push(bossId);
       }
    }

    await progress.save();

    return NextResponse.json({ success: true, message: `Submission ${status}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
