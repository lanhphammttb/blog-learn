export interface GradeResult {
  status: 'approved' | 'rejected' | 'pending';
  feedback: string;
  score: number;
}

export interface IGradeService {
  grade(requirements: string, content: string, locale?: string): Promise<GradeResult>;
}
