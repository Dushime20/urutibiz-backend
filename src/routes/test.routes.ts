import { Router } from 'express';
import path from 'path';

const router = Router();

// Serve test HTML files
router.get('/test-push', (req, res) => {
    res.sendFile(path.join(__dirname, '../../test-push.html'));
});

router.get('/simple-notification-test', (req, res) => {
    res.sendFile(path.join(__dirname, '../../simple-notification-test.html'));
});

router.get('/debug', (req, res) => {
    res.sendFile(path.join(__dirname, '../../debug-test.html'));
});

router.get('/firebase-script', (req, res) => {
    res.sendFile(path.join(__dirname, '../../firebase-script-test.html'));
});

export default router;
