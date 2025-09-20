const { spawn } = require("child_process");
const os = require("os");
const path = require("path");

async function textToSpeech(text, lang = "en", gender = "female", outputFile = null) {
    if (!text) throw new Error("Text is required");

    const platform = os.platform();

    if (platform === "linux") {
        let voiceCode = lang; // default language
        if (lang === "en") {
            if (gender === "male") voiceCode = "en+m1";
            else if (gender === "female") voiceCode = "en+f3";
        }

        if (!outputFile) {
            // Speak aloud
            return new Promise((resolve, reject) => {
                const espeak = spawn("espeak", ["-v", voiceCode, text]);
                espeak.on("error", reject);
                espeak.on("close", () => resolve());
            });
        } else {
            // Save to wav
            return new Promise((resolve, reject) => {
                const espeak = spawn("espeak", ["-v", voiceCode, "--stdout", text]);
                const fs = require("fs");
                const out = fs.createWriteStream(outputFile);
                espeak.stdout.pipe(out);
                espeak.on("error", reject);
                espeak.on("close", (code) => {
                    if (code !== 0) return reject(new Error(`espeak exited with code ${code}`));
                    resolve(outputFile);
                });
            });
        }
    } else {
        // macOS / Windows
        const say = require("say");
        return new Promise((resolve, reject) => {
            say.speak(text, null, 1.0, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    }
}


module.exports = { textToSpeech };
