import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { leaveApply, getMyLeaveList, getAllLeaves } from '../controllers/leaveController.js';
const router = express.Router();


router.post('/applyLeave', authenticate, authorize(['EMPLOYEE', 'MANAGER', 'ADMIN']), leaveApply, (req, res) => {
    // Logic for applying leave
    res.status(201).json({ message: 'Leave applied successfully' });
});
router.get('/myLeaves', authenticate, authorize(['EMPLOYEE', 'MANAGER', 'ADMIN']), getMyLeaveList, (req, res) => {
    // Logic for viewing own leaves
    res.json({ leaves: [] });
});

router.get('/viewLeaves', authenticate, authorize(['MANAGER', 'ADMIN']), getAllLeaves, (req, res) => {
    // Logic for viewing leaves
    res.json({ leaves: [] });
});

export default router;

