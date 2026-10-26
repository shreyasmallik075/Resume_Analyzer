const natural = require('natural');
const { getEmbedding } = require('./openaiHelper');

const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

const calculateScore = async (question, answer, idealAnswer, apiKey) => {
  const embA = await getEmbedding(answer, apiKey);
  const embB = await getEmbedding(idealAnswer, apiKey);
  const semantic = cosineSimilarity(embA, embB);

  const tokenizer = new natural.WordTokenizer();
  const tokensAnswer = tokenizer.tokenize(answer.toLowerCase());
  const tokensIdeal = tokenizer.tokenize(idealAnswer.toLowerCase());
  const matchCount = tokensAnswer.filter(t => tokensIdeal.includes(t)).length;
  const keywords = Math.min(matchCount / (tokensIdeal.length * 0.5), 1);

  const starRegex = {
    situation: /\b(situation|context|background|when I was)\b/gi,
    task: /\b(task|goal|objective|aim|responsibility|assigned)\b/gi,
    action: /\b(action|did|built|managed|implemented|created|resolved)\b/gi,
    result: /\b(result|outcome|achieved|consequently|impact|measured by)\b/gi
  };
  let starScore = 0;
  if (starRegex.situation.test(answer)) starScore += 0.25;
  if (starRegex.task.test(answer)) starScore += 0.25;
  if (starRegex.action.test(answer)) starScore += 0.25;
  if (starRegex.result.test(answer)) starScore += 0.25;

  const wordCount = tokensAnswer.length;
  let lengthScore = 0;
  if (wordCount >= 50 && wordCount <= 200) lengthScore = 1;
  else if (wordCount > 20 && wordCount < 300) lengthScore = 0.5;

  const uniqueTokens = new Set(tokensAnswer);
  const redundancy = uniqueTokens.size / tokensAnswer.length;

  const fillers = answer.match(/\b(um|uh|like|you know)\b/gi) || [];
  const fillerPenalty = fillers.length * -0.02;
  const quantificationBonus = (/\d+/.test(answer)) ? 0.05 : 0;
  const actionVerbsBonus = (/(led|built|managed|created|improved|developed|implemented)/gi.test(answer)) ? 0.05 : 0;

  let totalScore = (
    semantic * 0.45 +
    keywords * 0.15 +
    starScore * 0.25 +
    lengthScore * 0.10 +
    redundancy * 0.05 +
    fillerPenalty +
    quantificationBonus +
    actionVerbsBonus
  );

  totalScore = Math.max(0, Math.min(10, totalScore * 10));

  return {
    totalScore: parseFloat(totalScore.toFixed(1)),
    breakdown: {
      semantic: Math.round(semantic * 100),
      keywords: Math.round(keywords * 100),
      star: Math.round(starScore * 100),
      length: Math.round(lengthScore * 100),
      redundancy: Math.round(redundancy * 100),
      filler: fillers.length,
      quantification: quantificationBonus > 0 ? 1 : 0,
      actionVerbs: actionVerbsBonus > 0 ? 1 : 0
    }
  };
};

module.exports = { calculateScore };