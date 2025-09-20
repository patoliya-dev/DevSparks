import { formatSingleLine, loadGPT4AllModel } from "../config/llm.js";

export const chat = async(req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
    }

    try {
        const response = await loadGPT4AllModel(prompt);
        const formattedResponse = formatSingleLine(response);
        console.log(formattedResponse);
        return res.json({ message: "Chat completed successfully", formattedResponse });
    } catch (error) {
        console.error(error);
    }

} 