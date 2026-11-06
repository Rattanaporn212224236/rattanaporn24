const express = require('express');
const router = express.Router();
const AppUserController = require('./appUser.controller');
const { sendEventReminders } = require('../../utils/notification');

router.post('/test-notify', async (req, res) => {
    await sendEventReminders();
    res.json({ message: "Notification process started" });
});
router.post('/register', AppUserController.handleOpenApp);
router.post('/save-event', AppUserController.bookmarkEvent);

module.exports = router;