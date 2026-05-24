import express from "express";
import {
  downloadFile,
  downloadFolder,
  downloadSelection,
  getDrives,
  getFileServiceHealth,
  listFiles,
  streamFile
} from "../controllers/fileController.js";

const router = express.Router();

router.get("/health", getFileServiceHealth);
router.get("/drives", getDrives);
router.get("/", listFiles);
router.get("/download", downloadFile);
router.get("/stream", streamFile);
router.get("/download-folder", downloadFolder);
router.post("/download-selection", downloadSelection);

export default router;
