import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

// Simple .env.local parser
const env = fs.readFileSync('.env.local', 'utf8');
const keyMatch = env.match(/GEMINI_API_KEY=([^\n\r]*)/);
const apiKey = keyMatch ? keyMatch[1].trim() : null;

if (!apiKey) {
  console.error('Missing GEMINI_API_KEY in .env.local');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function checkModels() {
  const modelsToTry = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro',
    'gemini-pro',
    'gemini-1.0-pro'
  ];

  for (const modelName of modelsToTry) {
    try {
      console.log(`--- Testing ${modelName} ---`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Hi');
      console.log(`Success with ${modelName}!`);
      process.exit(0);
    } catch (e) {
      console.error(`Error with ${modelName}:`, e.message);
    }
  }
  console.error('ALL MODELS FAILED.');
}

checkModels();
