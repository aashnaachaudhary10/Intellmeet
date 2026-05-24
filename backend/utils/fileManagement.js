import fs from "fs";
import path from "path";

export function safePath(userPath = "") {
  return path.normalize(userPath);
}

export function getDownloadName(targetPath) {
  const trimmed = targetPath.replace(/[\\/]+$/, "");
  return path.basename(trimmed) || "download";
}

export function addDirectoryToZip(zipfile, sourceDir, zipDir) {
  const entries = fs.readdirSync(sourceDir);

  if (entries.length === 0) {
    zipfile.addEmptyDirectory(zipDir);
    return;
  }

  entries.forEach((entry) => {
    const fullPath = path.join(sourceDir, entry);

    const entryZipPath = zipDir
      ? path.posix.join(zipDir, entry)
      : entry;

    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      addDirectoryToZip(zipfile, fullPath, entryZipPath);
      return;
    }

    if (stats.isFile()) {
      zipfile.addFile(fullPath, entryZipPath);
    }
  });
}

export const mimeTypes = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".pdf": "application/pdf"
};
