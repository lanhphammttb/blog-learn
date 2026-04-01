export interface UserProjectSubmission {
  bossId: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  feedback?: string;
}

export interface UserProgressEntity {
  id?: string;
  userId: string;
  email?: string;
  roadmapId: string;
  completedArticles: string[];
  completedProjects: string[];
  projectSubmissions: UserProjectSubmission[];
  xp: number;
  streak: number;
  lastActive: Date;
  lastUpdated: Date;
}
