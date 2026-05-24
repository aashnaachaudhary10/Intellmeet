import fs from "fs";
import os from "os";
import path from "path";
import yazl from "yazl";
import {
  addDirectoryToZip,
  getDownloadName,
  mimeTypes,
  safePath
} from "../utils/fileManagement.js";

export const getFileServiceHealth = (req, res) => {
  res.json({
    success: true,
    message: "Remote File Server Running"
  });
};

export const getDrives = (req, res) => {
  if (os.platform() !== "win32") {
    return res.json({
      success: false,
      message: "Only supported on Windows"
    });
  }

  const drives = [];

  for (let i = 65; i <= 90; i += 1) {
    const drive = `${String.fromCharCode(i)}:/`;

    if (fs.existsSync(drive)) {
      drives.push(drive);
    }
  }

  res.json({
    success: true,
    drives
  });
};

export const listFiles = (req, res) => {
  try {
    const userPath = req.query.path || "";
    const finalPath = safePath(userPath);
    const files = fs.readdirSync(finalPath);

    const result = files.map((file) => {
      const filePath = path.join(finalPath, file);
      const stats = fs.statSync(filePath);

      return {
        name: file,
        type: stats.isDirectory() ? "folder" : "file",
        size: stats.isFile() ? stats.size : null
      };
    });

    res.json({
      success: true,
      currentPath: finalPath,
      files: result
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const downloadFile = (req, res) => {
  try {
    const userPath = req.query.path;

    if (!userPath) {
      return res.status(400).json({
        success: false,
        message: "Path required"
      });
    }

    const finalPath = safePath(userPath);

    if (!fs.existsSync(finalPath)) {
      return res.status(404).json({
        success: false,
        message: "File not found"
      });
    }

    res.download(finalPath);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const streamFile = (req, res) => {
  try {
    const userPath = req.query.path;

    if (!userPath) {
      return res.status(400).json({
        success: false,
        message: "Path required"
      });
    }

    const finalPath = safePath(userPath);

    if (!fs.existsSync(finalPath)) {
      return res.status(404).json({
        success: false,
        message: "File not found"
      });
    }

    const stat = fs.statSync(finalPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const ext = path.extname(finalPath).toLowerCase();
    const contentType = mimeTypes[ext] || "application/octet-stream";

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1]
        ? parseInt(parts[1], 10)
        : fileSize - 1;
      const chunkSize = (end - start) + 1;

      const file = fs.createReadStream(finalPath, {
        start,
        end
      });

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": contentType
      });

      file.pipe(res);
      return;
    }

    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": contentType
    });

    fs.createReadStream(finalPath).pipe(res);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const downloadFolder = async (req, res) => {
  try {
    const userPath = req.query.path;

    if (!userPath) {
      return res.status(400).json({
        success: false,
        message: "Path required"
      });
    }

    const finalPath = safePath(userPath);

    if (!fs.existsSync(finalPath)) {
      return res.status(404).json({
        success: false,
        message: "Folder not found"
      });
    }

    const stats = fs.statSync(finalPath);

    if (!stats.isDirectory()) {
      return res.status(400).json({
        success: false,
        message: "Not a folder"
      });
    }

    const folderName = getDownloadName(finalPath);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${folderName}.zip"`
    );

    const zipfile = new yazl.ZipFile();

    zipfile.on("error", (err) => {
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: err.message
        });
      }

      res.end();
    });

    zipfile.outputStream
      .pipe(res)
      .on("error", (err) => {
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: err.message
          });
        }

        res.end();
      });

    addDirectoryToZip(zipfile, finalPath, folderName);
    zipfile.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    } else {
      res.end();
    }
  }
};

export const downloadSelection = async (req, res) => {
  try {
    const selectedPaths = Array.isArray(req.body?.paths)
      ? req.body.paths
      : [];

    if (selectedPaths.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one file path is required"
      });
    }

    const normalizedPaths = selectedPaths.map((item) => safePath(item));
    const invalidPath = normalizedPaths.find((item) => !fs.existsSync(item));

    if (invalidPath) {
      return res.status(404).json({
        success: false,
        message: `File not found: ${invalidPath}`
      });
    }

    const directoryPath = req.body?.directoryPath
      ? safePath(req.body.directoryPath)
      : "";

    const archiveName = directoryPath
      ? `${getDownloadName(directoryPath)}-selection.zip`
      : "selected-files.zip";

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${archiveName}"`
    );

    const zipfile = new yazl.ZipFile();

    zipfile.on("error", (err) => {
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: err.message
        });
      }

      res.end();
    });

    zipfile.outputStream
      .pipe(res)
      .on("error", (err) => {
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: err.message
          });
        }

        res.end();
      });

    normalizedPaths.forEach((filePath) => {
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        return;
      }

      zipfile.addFile(filePath, path.basename(filePath));
    });

    zipfile.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    } else {
      res.end();
    }
  }
};
