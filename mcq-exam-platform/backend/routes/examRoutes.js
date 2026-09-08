// ================== routes/examRoutes.js ==================
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/examController');

// পাবলিক রুট (Student join পেজের জন্য) — auth লাগবে না
router.get('/public/:code', ctrl.getExamByCode);

// বাকি সব রুট শুধু Teacher এর জন্য
router.use(protect, authorize('teacher'));

router.post('/upload', upload.single('pdf'), ctrl.uploadExamPdf);
router.get('/', ctrl.getMyExams);
router.get('/:id', ctrl.getExamById);
router.put('/:id/settings', ctrl.updateExamSettings);
router.post('/:id/publish', ctrl.publishExam);
router.delete('/:id', ctrl.deleteExam);
router.put('/:id/resource-link', ctrl.setResourceLink);
router.post('/:id/resource-pdf', upload.single('pdf'), ctrl.setResourcePdf);
router.delete('/:id/resource', ctrl.removeResource);
router.post('/:id/questions', ctrl.addQuestion);
router.put('/:id/questions/reorder', ctrl.reorderQuestions);
router.put('/questions/:questionId', ctrl.updateQuestion);
router.delete('/questions/:questionId', ctrl.deleteQuestion);
router.get('/:id/results', ctrl.getExamResults);
router.get('/:id/results/export', ctrl.exportResultsExcel);
router.get('/attempts/:attemptId', ctrl.getAttemptDetails);

module.exports = router;
