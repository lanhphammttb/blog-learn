import { IUserProgressRepository } from '../repositories/IUserProgressRepository';
import { IGradeService } from '../services/IGradeService';
import { UserProjectSubmission, UserProgressEntity } from '../entities/UserProgress';

export class SubmitProjectUseCase {
  constructor(
    private progressRepo: IUserProgressRepository,
    private gradeService: IGradeService
  ) {}

  async execute(params: {
    userId: string;
    roadmapId: string;
    bossId: string;
    content: string;
    requirements: string;
    email?: string;
    locale?: string;
  }) {
    const { userId, roadmapId, bossId, content, requirements, email, locale = 'vi' } = params;

    // 1. Perform automated grading
    const gradeResult = await this.gradeService.grade(requirements, content, locale);

    // 2. Fetch current progress
    let progress = await this.progressRepo.findByUserAndRoadmap(userId, roadmapId);

    if (!progress) {
      progress = {
        userId,
        email,
        roadmapId,
        completedArticles: [],
        completedProjects: [],
        projectSubmissions: [],
        xp: 0,
        streak: 1,
        lastActive: new Date(),
        lastUpdated: new Date(),
      };
    }

    // 3. Prepare submission record
    const submission: UserProjectSubmission = {
      bossId,
      content,
      status: gradeResult.status,
      submittedAt: new Date(),
      feedback: `[AI Feedback]: ${gradeResult.feedback}`
    };

    // 4. Update progress data
    // Remove duplicate submission for same boss if any
    const otherSubmissions = progress.projectSubmissions.filter(s => s.bossId !== bossId);
    progress.projectSubmissions = [...otherSubmissions, submission];

    let xpGain = 0;
    if (gradeResult.status === 'approved') {
      xpGain = 50;
      if (!progress.completedProjects.includes(bossId)) {
        progress.completedProjects.push(bossId);
        progress.xp += xpGain;
      }
    }

    progress.lastActive = new Date();
    progress.lastUpdated = new Date();

    // 5. Build final message
    const message = gradeResult.status === 'approved' 
      ? (locale === 'en' ? 'AI approved your submission! +50 XP.' : 'AI đã phê duyệt bài nộp của bạn! +50 XP.')
      : gradeResult.status === 'rejected'
      ? (locale === 'en' ? 'Submission rejected. Please check AI feedback.' : 'Bài nộp chưa đạt yêu cầu. Vui lòng xem phản hồi từ AI.')
      : (locale === 'en' ? 'Submission recorded, waiting for Admin review.' : 'Bài nộp đã được ghi nhận, đang chờ Admin xem xét.');

    // 6. Save and Return
    const savedProgress = await this.progressRepo.save(progress);

    return {
      success: true,
      aiStatus: gradeResult.status,
      message,
      projectSubmissions: savedProgress.projectSubmissions
    };
  }
}
