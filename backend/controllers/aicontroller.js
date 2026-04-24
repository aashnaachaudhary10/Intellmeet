import { GoogleGenerativeAI } from "@google/generative-ai";

export const summarizeText = async (req, res) => {
  try {
    const { text, meetingId } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Text content is required for summarization" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: "Gemini API key is not configured in .env" });
    }

    // Initialize the Google Generative AI with the API Key from environment variables
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Using the recommended gemini-1.5-flash or gemini-pro interchangeably
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an AI meeting assistant. Analyze the following meeting transcript.
      Provide a brief summary and a list of actionable items exactly as a JSON response.
      Do NOT include any markdown code block formatting (like \`\`\`json) in your response, just the raw JSON object.
      
      Format:
      {
        "summary": "A brief 2 to 3 sentence summary of the meeting.",
        "actionItems": ["Action Item 1", "Action Item 2"]
      }

      Transcript to process:
      "${text}"
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean up any unexpected markdown tags just in case
    const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanedText);

    res.status(200).json({ 
      summary: parsedData.summary || "No summary generated.", 
      actionItems: parsedData.actionItems || [] 
    });

  } catch (error) {
    console.error("AI Summarization Error:", error);
    res.status(500).json({ message: "AI Summarization failed.", error: error.message });
  }
};