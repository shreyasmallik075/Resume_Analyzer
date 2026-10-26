const OpenAI = require('openai');

const getOpenAIClient = (apiKey) => {
  return new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
};

const analyzeResume = async (text, apiKey) => {
  try {
    const openai = getOpenAIClient(apiKey);
    const prompt = `Analyze this resume and return JSON:
{
  "score": <0-100>,
  "skills": [<detected skills>],
  "strengths": [<3-5 strengths>],
  "weaknesses": [<3-5 weaknesses>],
  "missingKeywords": [<ATS keywords missing>],
  "field": "<predicted job role>",
  "suggestions": [<improvement tips>],
  "atsFeedback": "<ATS friendliness feedback>",
  "grammarFeedback": "<grammar/formatting issues>"
}

Resume:
${text}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('OpenAI Analysis Error:', error.message);
    throw new Error(`AI Analysis Failed: ${error.message}`);
  }
};

const generateCoverLetter = async (resumeText, jobRole, company, jobDescription, apiKey) => {
  try {
    const openai = getOpenAIClient(apiKey);
    const prompt = `Write a professional cover letter.
Resume: ${resumeText}
Job Role: ${jobRole}
Company: ${company}
Job Description: ${jobDescription}

Make it 3 paragraphs, formal, persuasive.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Cover Letter Error:', error.message);
    throw new Error(`Failed to generate cover letter: ${error.message}`);
  }
};

const generateQuestions = async (resumeText, apiKey) => {
  try {
    const openai = getOpenAIClient(apiKey);
    const prompt = `Based on this resume, generate 10 interview questions:
- 5 technical questions
- 3 HR questions
- 2 behavioral STAR questions (e.g., "Tell me about a time you...")

Resume: ${resumeText}

Return as JSON object with questions array: { "questions": ["Q1", "Q2", ...] }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content).questions;
  } catch (error) {
    console.error('Question Generation Error:', error.message);
    throw new Error(`Failed to generate questions: ${error.message}`);
  }
};

const generateIdealAnswer = async (question, resumeText, apiKey) => {
  try {
    const openai = getOpenAIClient(apiKey);
    const prompt = `Generate ideal answer for interview question based on resume.
Question: ${question}
Resume: ${resumeText}

Answer should be 100-150 words, include STAR structure if behavioral.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Answer Generation Error:', error.message);
    throw new Error(`Failed to generate answer: ${error.message}`);
  }
};

const getEmbedding = async (text, apiKey) => {
  const openai = getOpenAIClient(apiKey);
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
};

module.exports = { analyzeResume, generateCoverLetter, generateQuestions, generateIdealAnswer, getEmbedding };