// ================== utils/pdfParser.js ==================
// PDF ফাইল থেকে টেক্সট বের করে MCQ প্রশ্ন-উত্তর পার্স করার ফাংশন।
// প্রত্যাশিত ফরম্যাট (প্রতি প্রশ্ন):
//   1. প্রশ্ন লেখা?
//   A. অপশন এক
//   B. অপশন দুই
//   C. অপশন তিন
//   D. অপশন চার
//   Answer: C
const fs = require('fs');
const pdfParse = require('pdf-parse');

async function extractQuestionsFromPdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const pdfData = await pdfParse(dataBuffer);
  const rawText = pdfData.text;

  return parseMcqText(rawText);
}

function parseMcqText(rawText) {
  // লাইনগুলো পরিষ্কার করে নেয়া হলো
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const questions = [];
  let current = null;

  // রেজেক্স প্যাটার্নসমূহ
  const questionStartRegex = /^(\d+)[\.\)]\s*(.+)/; // "1. প্রশ্ন" বা "1) প্রশ্ন"
  const optionRegex = /^([A-Da-d])[\.\)]\s*(.+)/; // "A. অপশন"
  const answerRegex = /^Answer\s*[:\-]\s*([A-Da-d])/i; // "Answer: C"

  for (const line of lines) {
    const qMatch = line.match(questionStartRegex);
    const oMatch = line.match(optionRegex);
    const aMatch = line.match(answerRegex);

    if (qMatch && !oMatch) {
      // নতুন প্রশ্ন শুরু — আগেরটা থাকলে সেভ করো (যদি সম্পূর্ণ হয়)
      if (current && current.options.length >= 2 && current.correctOptionIndex !== null) {
        questions.push(current);
      }
      current = { questionText: qMatch[2].trim(), options: [], correctOptionIndex: null };
    } else if (oMatch && current) {
      current.options.push(oMatch[2].trim());
    } else if (aMatch && current) {
      const letter = aMatch[1].toUpperCase();
      current.correctOptionIndex = letter.charCodeAt(0) - 'A'.charCodeAt(0);
    } else if (current && current.options.length === 0 && !aMatch) {
      // প্রশ্ন একাধিক লাইনে চলে গেলে জোড়া লাগানো
      current.questionText += ' ' + line;
    }
  }
  // শেষ প্রশ্নটা যোগ করো
  if (current && current.options.length >= 2 && current.correctOptionIndex !== null) {
    questions.push(current);
  }

  return questions.map((q, idx) => ({ ...q, order: idx }));
}

module.exports = { extractQuestionsFromPdf, parseMcqText };
