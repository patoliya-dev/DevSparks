import { exec } from "child_process";
import path from "path";

const WHISPER_PATH = path.resolve("whisper.cpp/main");
const MODEL_PATH = path.resolve("whisper.cpp/models/ggml-base.en.bin");

export const transcribeAudio = (audioPath) => {
  return new Promise((resolve, reject) => {
    const cmd = `${WHISPER_PATH} -m ${MODEL_PATH} -f ${audioPath} -otxt`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(stderr);
      // Whisper.cpp writes result to file, so read it
      const resultFile = audioPath.replace(/\.[^/.]+$/, "") + ".txt";
      import("fs").then(fs => {
        fs.readFile(resultFile, "utf8", (err, data) => {
          if (err) reject(err);
          else resolve(data.trim());
        });
      });
    });
  });
};
