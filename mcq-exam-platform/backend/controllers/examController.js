// ================== controllers/examController.js ==================
const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Attempt = require('../models/Attempt');
const { extractQuestionsFromPdf } = require('../utils/pdfParser');
const { generateResultExcel } = require('../utils/excelExport');

// ---------- ১. PDF আপলোড করে নতুন Exam তৈরি করা ----------
exports.uploadExamPdf = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'PDF ফাইল আবশ্যক' });

    const title = req.body.title || req.file.originalname.replace(/\.pdf$/i, '');
    const parsedQuestions = await extractQuestionsFromPdf(req.file.path);

    if (parsedQuestions.length === 0) {
      return res.status(400).json({
        message:
          'PDF থেকে কোনো প্রশ্ন পার্স করা যায়নি। ফরম্যাট চেক করো: "1. প্রশ্ন? A. ... B. ... C. ... D. ... Answer: C"',
      });
    }

    const examCode = nanoid(8);

    const exam = await Exam.create({
      teacher: req.user.id,
      title,
      sourcePdfPath: req.file.path,
      examCode,
      status: 'draft',
    });

    const questionDocs = parsedQuestions.map((q) => ({ ...q, exam: exam._id }));
    await Question.insertMany(questionDocs);

    res.status(201).json({ exam, questionCount: questionDocs.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- ২. Teacher এর সব Exam লিস্ট ----------
exports.getMyExams = async (req, res) => {
  const exams = await Exam.find({ teacher: req.user.id }).sort({ createdAt: -1 });
  res.json(exams);
};

// ---------- ৩. একটি Exam এর ডিটেইলস + প্রশ্ন ----------
exports.getExamById = async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) return res.status(404).json({ message: 'Exam পাওয়া যায়নি' });
  if (exam.teacher.toString() !== req.user.id)
    return res.status(403).json({ message: 'অনুমতি নেই' });

  const questions = await Question.find({ exam: exam._id }).sort({ order: 1 });
  res.json({ exam, questions });
};

// ---------- ৪. Exam Settings আপডেট ----------
exports.updateExamSettings = async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) return res.status(404).json({ message: 'Exam পাওয়া যায়নি' });
  if (exam.teacher.toString() !== req.user.id)
    return res.status(403).json({ message: 'অনুমতি নেই' });

  exam.title = req.body.title ?? exam.title;
  exam.settings = { ...exam.settings.toObject(), ...req.body.settings };
  if (req.body.accessCode !== undefined) exam.accessCode = req.body.accessCode;

  await exam.save();
  res.json(exam);
};

// ---------- ৫. Exam Publish করা (লিংক active হবে) ----------
exports.publishExam = async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) return res.status(404).json({ message: 'Exam পাওয়া যায়নি' });
  if (exam.teacher.toString() !== req.user.id)
    return res.status(403).json({ message: 'অনুমতি নেই' });

  exam.status = 'published';
  await exam.save();
  res.json({ exam, shareLink: `${process.env.CLIENT_URL}/join/${exam.examCode}` });
};

// ---------- ৬. প্রশ্ন Edit / Delete / Add / Reorder ----------
exports.updateQuestion = async (req, res) => {
  const q = await Question.findById(req.params.questionId);
  if (!q) return res.status(404).json({ message: 'প্রশ্ন পাওয়া যায়নি' });

  const exam = await Exam.findById(q.exam);
  if (exam.teacher.toString() !== req.user.id)
    return res.status(403).json({ message: 'অনুমতি নেই' });

  Object.assign(q, req.body);
  await q.save();
  res.json(q);
};

exports.deleteQuestion = async (req, res) => {
  const q = await Question.findById(req.params.questionId);
  if (!q) return res.status(404).json({ message: 'প্রশ্ন পাওয়া যায়নি' });

  const exam = await Exam.findById(q.exam);
  if (exam.teacher.toString() !== req.user.id)
    return res.status(403).json({ message: 'অনুমতি নেই' });

  await q.deleteOne();
  res.json({ message: 'প্রশ্ন ডিলিট হয়েছে' });
};

exports.addQuestion = async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) return res.status(404).json({ message: 'Exam পাওয়া যায়নি' });
  if (exam.teacher.toString() !== req.user.id)
    return res.status(403).json({ message: 'অনুমতি নেই' });

  const count = await Question.countDocuments({ exam: exam._id });
  const q = await Question.create({ ...req.body, exam: exam._id, order: count });
  res.status(201).json(q);
};

// প্রশ্নের ক্রম পরিবর্তন — শরীরে [{questionId, order}, ...] পাঠাতে হবে
exports.reorderQuestions = async (req, res) => {
  const { orderList } = req.body;
  await Promise.all(
    orderList.map((item) => Question.findByIdAndUpdate(item.questionId, { order: item.order }))
  );
  res.json({ message: 'ক্রম আপডেট হয়েছে' });
};

exports.getExamResults = async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) return res.status(404).json({ message: 'Exam পাওয়া যায়নি' });
  if (exam.teacher.toString() !== req.user.id)
    return res.status(403).json({ message: 'অনুমতি নেই' });

  if (exam.settings.allowRepetition) {
    return res.json({
      disabled: true,
      message: 'Repetition অন করা আছে বলে এই পরীক্ষার রেজাল্ট ড্যাশবোর্ডে দেখানো হচ্ছে না। প্রতিটা স্টুডেন্ট পরীক্ষা শেষে নিজের রেজাল্ট দেখতে পাবে।',
    });
  }

  const attempts = await Attempt.find({ exam: exam._id }).sort({ obtainedMarks: -1 });
  res.json(attempts);
};
};

exports.getAttemptDetails = async (req, res) => {
  const attempt = await Attempt.findById(req.params.attemptId).populate('answers.question');
  if (!attempt) return res.status(404).json({ message: 'পাওয়া যায়নি' });

  const exam = await Exam.findById(attempt.exam);
  if (exam.teacher.toString() !== req.user.id)
    return res.status(403).json({ message: 'অনুমতি নেই' });

  res.json(attempt);
};

// ---------- ৮. Excel এ Export ----------
exports.exportResultsExcel = async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) return res.status(404).json({ message: 'Exam পাওয়া যায়নি' });
  if (exam.teacher.toString() !== req.user.id)
    return res.status(403).json({ message: 'অনুমতি নেই' });

  const attempts = await Attempt.find({ exam: exam._id });
  const workbook = await generateResultExcel(exam, attempts);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${exam.title}-results.xlsx`);
  await workbook.xlsx.write(res);
  res.end();
};

// ---------- ৯. পাবলিক: এক্সাম কোড দিয়ে Exam এর তথ্য দেখা (Join পেজের জন্য) ----------
exports.getExamByCode = async (req, res) => {
  const exam = await Exam.findOne({ examCode: req.params.code });
  if (!exam) return res.status(404).json({ message: 'এই লিংকে কোনো পরীক্ষা পাওয়া যায়নি' });
  if (exam.status !== 'published')
    return res.status(400).json({ message: 'পরীক্ষাটি এখনো চালু হয়নি অথবা বন্ধ হয়ে গেছে' });

  const { schedule } = exam.settings;
  if (schedule?.enabled) {
    const now = new Date();
    if (schedule.startAt && now < schedule.startAt)
      return res.status(400).json({ message: 'পরীক্ষা এখনো শুরু হয়নি' });
    if (schedule.endAt && now > schedule.endAt)
      return res.status(400).json({ message: 'পরীক্ষার সময় শেষ হয়ে গেছে' });
  }

  res.json({
    title: exam.title,
    examCode: exam.examCode,
    requiresAccessCode: !!exam.accessCode,
    totalTimeMinutes: exam.settings.totalTimeMinutes,
  });
};

// ---------- ১০. পুরো Exam ডিলিট করা (প্রশ্ন, রেজাল্ট ও PDF ফাইলসহ) ----------
exports.deleteExam = async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) return res.status(404).json({ message: 'Exam পাওয়া যায়নি' });
  if (exam.teacher.toString() !== req.user.id)
    return res.status(403).json({ message: 'অনুমতি নেই' });

  await Question.deleteMany({ exam: exam._id });
  await Attempt.deleteMany({ exam: exam._id });

  if (exam.sourcePdfPath && fs.existsSync(exam.sourcePdfPath)) {
    fs.unlink(exam.sourcePdfPath, () => {});
  }

  await exam.deleteOne();
  res.json({ message: 'পরীক্ষাটি ডিলিট হয়েছে' });
};

// ---------- ১১. রেজাল্ট পেজে দেখানোর জন্য অতিরিক্ত রিসোর্স (Google Drive লিংক বা PDF) সেট করা ----------
exports.setResourceLink = async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) return res.status(404).json({ message: 'Exam পাওয়া যায়নি' });
  if (exam.teacher.toString() !== req.user.id)
    return res.status(403).json({ message: 'অনুমতি নেই' });

  const { link } = req.body;
  if (!link) return res.status(400).json({ message: 'লিংক আবশ্যক' });

  if (exam.resource?.pdfPath && fs.existsSync(exam.resource.pdfPath)) {
    fs.unlink(exam.resource.pdfPath, () => {});
  }

  exam.resource = { kind: 'link', link, pdfPath: undefined, pdfOriginalName: undefined };
  await exam.save();
  res.json(exam);
};

exports.setResourcePdf = async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) return res.status(404).json({ message: 'Exam পাওয়া যায়নি' });
  if (exam.teacher.toString() !== req.user.id)
    return res.status(403).json({ message: 'অনুমতি নেই' });
  if (!req.file) return res.status(400).json({ message: 'PDF ফাইল আবশ্যক' });

  if (exam.resource?.pdfPath && fs.existsSync(exam.resource.pdfPath)) {
    fs.unlink(exam.resource.pdfPath, () => {});
  }

  exam.resource = {
    kind: 'pdf',
    pdfPath: req.file.path,
    pdfOriginalName: req.file.originalname,
    link: undefined,
  };
  await exam.save();
  res.json(exam);
};

exports.removeResource = async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) return res.status(404).json({ message: 'Exam পাওয়া যায়নি' });
  if (exam.teacher.toString() !== req.user.id)
    return res.status(403).json({ message: 'অনুমতি নেই' });

  if (exam.resource?.pdfPath && fs.existsSync(exam.resource.pdfPath)) {
    fs.unlink(exam.resource.pdfPath, () => {});
  }
  exam.resource = { kind: null, link: undefined, pdfPath: undefined, pdfOriginalName: undefined };
  await exam.save();
  res.json(exam);
};
