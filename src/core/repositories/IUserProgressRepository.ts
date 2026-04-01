import { UserProgressEntity } from '../entities/UserProgress';

export interface IUserProgressRepository {
  findByUserAndRoadmap(userId: string, roadmapId: string): Promise<UserProgressEntity | null>;
  save(progress: UserProgressEntity): Promise<UserProgressEntity>;
  update(userId: string, roadmapId: string, updates: Partial<UserProgressEntity>): Promise<UserProgressEntity>;
}
