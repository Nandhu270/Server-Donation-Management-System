const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verifyToken, requireAdmin } = require("../middleware/auth");

// All admin routes require valid JWT AND admin role
router.use(verifyToken, requireAdmin);

router.get("/users", adminController.getAllUsers);
router.patch("/users/:id/role", adminController.updateUserRole);
router.patch("/users/:id/status", adminController.toggleUserStatus);
router.get("/stats", adminController.getAdminDashboardStats);

module.exports = router;

