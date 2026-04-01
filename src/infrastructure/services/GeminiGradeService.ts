import { GoogleGenerativeAI } from '@google/generative-ai';
import { IGradeService, GradeResult } from '../../core/services/IGradeService';

export class GeminiGradeService implements IGradeService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
      }
    });
  }

  async grade(requirements: string, content: string, locale: string = 'vi'): Promise<GradeResult> {
    if (!process.env.GEMINI_API_KEY) {
      const maintenanceMsg = locale === 'en' ? 'AI System is under maintenance. Please wait for Admin review.' : 'Hệ thống AI đang bảo trì. Vui lòng đợi Admin duyệt.';
      return { status: 'pending', feedback: maintenanceMsg, score: 0 };
    }

    const languageName = locale === 'en' ? 'ENGLISH' : 'VIETNAMESE';

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
      5. Provide a short, encouraging feedback in ${languageName}.

      OUTPUT FORMAT (JSON ONLY):
      {
        "status": "approved" | "rejected" | "pending",
        "feedback": "Your feedback in ${languageName} here",
        "score": 0-10
      }
    `;

    let retries = 3;
    while (retries > 0) {
      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return JSON.parse(text);
      } catch (error: any) {
        if (error.status === 429 || error.message?.includes('429')) {
          await this.delay(10000);
          retries--;
        } else {
          console.error('[GeminiGradeService] Error:', error);
          const errorMsg = locale === 'en' ? 'Error calling AI. Waiting for Admin review.' : 'Lỗi khi gọi AI. Đợi Admin duyệt.';
          return { status: 'pending', feedback: errorMsg, score: 0 };
        }
      }
    }

    const quotaMsg = locale === 'en' ? 'AI System is overloaded (Quota). Please try again or wait for Admin review.' : 'Hệ thống AI hiện đang quá tải (Quota). Vui lòng thử lại sau hoặc đợi Admin duyệt.';
    return { status: 'pending', feedback: quotaMsg, score: 0 };
  }

  private delay(ms: number) {
    return new Promise(res => setTimeout(res, ms));
  }
}
