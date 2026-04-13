import { z } from 'zod';
import dbConnect from '@/lib/db';
import Roadmap from '@/models/Roadmap';
import { requireAdmin, unauthorized, apiError, created, ok, validationError, getErrorMessage } from '@/lib/api-helpers';

const RoadmapCreateSchema = z.object({
  title: z.string().min(1),
  title_en: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  description_en: z.string().optional(),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
  roadmap_image_url: z.string().url().optional().or(z.literal('')),
  target_outcome: z.string().optional(),
  target_outcome_en: z.string().optional(),
  phases: z.array(z.any()).optional(),
});

export async function GET() {
  try {
    await dbConnect();
    const roadmaps = await Roadmap.find({ isPublished: true }).sort({ createdAt: -1 }).lean();
    const res = ok(roadmaps);
    res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res;
  } catch (error) {
    return apiError(getErrorMessage(error));
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  try {
    await dbConnect();
    const body = await request.json();
    const parsed = RoadmapCreateSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error.flatten());

    const roadmap = await Roadmap.create(parsed.data);
    return created(roadmap);
  } catch (error) {
    return apiError(getErrorMessage(error));
  }
}
