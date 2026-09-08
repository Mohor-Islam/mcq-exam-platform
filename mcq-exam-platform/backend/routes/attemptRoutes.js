// ================== routes/attemptRoutes.js ==================
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/attemptController');

// এই রুটগুলো পাবলিক (Student এর জন্য) — শুধু examCode/accessCode দিয়ে সুরক্ষিত
router.post('/join', ctrl.joinExam);
router.put('/:attemptId/answer', ctrl.saveAnswer);
router.post('/:attemptId/submit', ctrl.submitAttempt);
router.get('/:attemptId/download-pdf', ctrl.downloadResultPdf);

module.exports = router;
