import { z } from 'zod';
import dbConnect from '@/lib/db';
import Roadmap from '@/models/Roadmap';
import { requireAdmin, unauthorized, apiError, notFound, ok, validationError, badRequest, getErrorMessage, isValidObjectId } from '@/lib/api-helpers';

const RoadmapUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  title_en: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
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

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    const roadmap = await Roadmap.findById(id);
    if (!roadmap) return notFound('Roadmap');
    return ok(roadmap);
  } catch (error) {
    return apiError(getErrorMessage(error));
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  if (!isValidObjectId(id)) return badRequest('Invalid roadmap ID');

  try {
    await dbConnect();
    const body = await request.json();
    const parsed = RoadmapUpdateSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error.flatten());

    const roadmap = await Roadmap.findByIdAndUpdate(id, parsed.data, { returnDocument: 'after' });
    if (!roadmap) return notFound('Roadmap');
    return ok(roadmap);
  } catch (error) {
    return apiError(getErrorMessage(error));
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  if (!isValidObjectId(id)) return badRequest('Invalid roadmap ID');

  try {
    await dbConnect();
    const roadmap = await Roadmap.findByIdAndDelete(id);
    if (!roadmap) return notFound('Roadmap');
    return ok({ success: true });
  } catch (error) {
    return apiError(getErrorMessage(error));
  }
}
