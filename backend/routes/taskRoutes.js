import express from "express";
import { getTasks, createTask, updateTask, deleteTask, updateTaskStatus } from "../controllers/taskController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from "../validators/authValidators.js";

const router = express.Router();

router.route("/")
  .get(authMiddleware, getTasks)
  .post(authMiddleware, validateRequest(createTaskSchema, "body"), createTask);

router.route("/:id")
  .put(authMiddleware, validateRequest(updateTaskSchema, "body"), updateTask)
  .delete(authMiddleware, deleteTask);

router.patch("/:id/status", authMiddleware, validateRequest(updateTaskStatusSchema, "body"), updateTaskStatus);

export default router;
