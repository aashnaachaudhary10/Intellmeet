import { prisma } from "../config/prisma.js";
import { sendSuccess, sendError } from "../utils/response.js";

export const getTasks = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.user.id },
      include: {
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return sendSuccess(res, 200, "Tasks fetched", { tasks });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, description, status, meetingId } = req.body;

    if (!title) {
      return sendError(res, 400, "Please provide a task title");
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || "",
        status: status || "todo",
        userId: req.user.id,
        meetingId: meetingId || undefined,
      },
      include: {
        user: true,
      },
    });

    return sendSuccess(res, 201, "Task created", { task });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

export const updateTask = async (req, res) => {
  try {
    const { title, description, status } = req.body;

    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!existing) {
      return sendError(res, 404, "Task not found");
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        user: true,
      },
    });

    return sendSuccess(res, 200, "Task updated", { task: updated });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return sendError(res, 400, "Status is required");
    }

    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!existing) {
      return sendError(res, 404, "Task not found");
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        user: true,
      },
    });

    return sendSuccess(res, 200, "Task status updated", { task: updated });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!task) {
      return sendError(res, 404, "Task not found");
    }

    await prisma.task.delete({
      where: { id: req.params.id },
    });

    return sendSuccess(res, 200, "Task deleted successfully");
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};
