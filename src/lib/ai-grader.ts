import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function gradeWithAI(requirements: string, content: string) {
  console.log('[AI_GRADER] Testing with API Key...');
  if (!process.env.GEMINI_API_KEY) {
    return { status: 'pending', feedback: 'Hệ thống AI đang bảo trì. Vui lòng đợi Admin duyệt.' };
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  const prompt = `
    You are an expert English teacher at EnglishHub.
    Mission: Grade an English assignment based on specific requirements.

    REQUIREMENTS FROM TEACHER:
    "${requirements}"

    STUDENT SUBMISSION:
    "${content}"

    TASK:
    1. Analyze if the student's submission reasonably fulfills the requirements.
    2. If it's a URL (Google Drive, Youtube, Blog), assume it's valid if the link is well-formed, but suggest the teacher to check.
    3. If it's text, grade it for grammar, vocabulary, and relevance to the requirements.
    4. Decide status: "approved" (if good), "rejected" (if poor or irrelevant), or "pending" (if you're unsure).
    5. Provide a short, encouraging feedback in VIETNAMESE.

    OUTPUT FORMAT (JSON ONLY):
    {
      "status": "approved" | "rejected" | "pending",
      "feedback": "Your feedback in Vietnamese here",
      "score": 0-10
    }
  `;

  let retries = 3;
  while (retries > 0) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      console.log('[AI_GRADER] Raw AI response:', text);

      return JSON.parse(text);
    } catch (error: any) {
      if (error.status === 429 || error.message?.includes('429')) {
        console.warn(`[AI_GRADER] Quota exceeded. Retrying in 10s... (${retries} retries left)`);
        await delay(10000);
        retries--;
      } else {
        console.error('AI Grading Error:', error);
        return { status: 'pending', feedback: 'Lỗi khi gọi AI. Đợi Admin duyệt.' };
      }
    }
  }

  return { status: 'pending', feedback: 'Hệ thống AI hiện đang quá tải (Quota). Vui lòng thử lại sau hoặc đợi Admin duyệt.' };
}
