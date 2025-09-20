// models/stt.js (CommonJS)

const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const WHISPER_PATH = path.resolve("../../whisper.cpp/whisper-cli");
const MODEL_PATH = path.resolve("../../whisper.cpp/models/ggml-base.bin");

const transcribeAudio = (audioPath) => {
  return new Promise((resolve, reject) => {
    const cmd = `${WHISPER_PATH} -m ${MODEL_PATH} -f ${audioPath} -otxt`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(stderr);
      const resultFile = audioPath.replace(/\.[^/.]+$/, "") + ".txt";
      fs.readFile(resultFile, "utf8", (readErr, data) => {
        if (readErr) reject(readErr);
        fs.unlink(audioPath, (delErr) => {
          if (delErr) console.error("Failed to delete audio file:", delErr);
        });

        fs.unlink(resultFile, (delErr) => {
          if (delErr) console.error("Failed to delete transcription file:", delErr);
        });

        resolve(data.trim());
      });
    });
  });
};

module.exports = { transcribeAudio };
