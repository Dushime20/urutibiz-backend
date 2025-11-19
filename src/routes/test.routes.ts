import { Router } from 'express';
import path from 'path';

const router = Router();

// Serve test HTML files
router.get('/test-push', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../test-push.html'));
});

router.get('/simple-notification-test', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../simple-notification-test.html'));
});

router.get('/debug', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../debug-test.html'));
});

router.get('/firebase-script', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../firebase-script-test.html'));
});

export default router;
