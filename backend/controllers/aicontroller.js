import { GoogleGenerativeAI } from "@google/generative-ai";
import Meeting from "../models/Meeting.js";

const normalizeActionItems = (items = []) =>
  items
    .map((item) => {
      if (typeof item === "string") {
        return {
          task: item,
          assignee: "Unassigned",
          priority: "medium",
          completed: false,
        };
      }

      return {
        task: item.task || item.title || item.description || "",
        assignee: item.assignee || "Unassigned",
        priority: ["low", "medium", "high"].includes(item.priority) ? item.priority : "medium",
        completed: Boolean(item.completed),
      };
    })
    .filter((item) => item.task.trim());

const extractJsonObjects = (text) => {
  const objects = [];
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = inString;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{") {
      if (depth === 0) start = i;
      depth += 1;
    } else if (char === "}" && depth > 0) {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        objects.push(text.slice(start, i + 1));
        start = -1;
      }
    }
  }

  return objects;
};

const parseMeetingSummaryResponse = (responseText) => {
  const cleanedText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(cleanedText);
  } catch {
    const candidates = extractJsonObjects(cleanedText);

    for (let i = candidates.length - 1; i >= 0; i--) {
      try {
        const parsed = JSON.parse(candidates[i]);
        if (
          parsed &&
          typeof parsed === "object" &&
          ("summary" in parsed || "keyPoints" in parsed || "actionItems" in parsed)
        ) {
          return parsed;
        }
      } catch {
        // Keep checking earlier JSON-like blocks in the response.
      }
    }
  }

  throw new Error("AI response did not contain a valid meeting summary JSON object.");
};

const transcribeAudioBlob = async (audioBlob, filename = "meeting-audio.webm") => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured in .env");
  }

  const formData = new FormData();
  formData.append("file", audioBlob, filename);
  formData.append("model", process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Audio transcription failed");
  }

  return data.text || "";
};

const transcribeRecordingParts = async (meeting) => {
  const parts = [...(meeting.recordingParts || [])]
    .filter((part) => part.url)
    .sort((a, b) => (a.partNumber || 0) - (b.partNumber || 0));

  if (parts.length === 0) return meeting.transcript || "";

  const transcripts = [];

  for (const part of parts) {
    if (part.transcribed && part.transcript) {
      transcripts.push(part.transcript);
      continue;
    }

    const response = await fetch(part.url);
    if (!response.ok) {
      throw new Error(`Failed to download recording part ${part.partNumber || part.name}`);
    }

    const audioBlob = await response.blob();
    const text = await transcribeAudioBlob(audioBlob, part.name || `part-${part.partNumber}.webm`);
    part.transcript = text;
    part.transcribed = true;
    transcripts.push(text);
  }

  const transcript = transcripts.filter(Boolean).join("\n");
  meeting.transcript = transcript;
  await meeting.save();

  return transcript;
};

export const summarizeText = async (req, res) => {
  try {
    const { text, transcript, meetingId } = req.body;
    const meeting = meetingId ? await Meeting.findById(meetingId) : null;
    const hasRecordingParts = Boolean(meeting?.recordingParts?.some((part) => part.url));
    const content = hasRecordingParts
      ? await transcribeRecordingParts(meeting)
      : text || transcript || meeting?.transcript;

    if (!content) {
      return res.status(400).json({ message: "Text content is required for summarization" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: "Gemini API key is not configured in .env" });
    }

    // Initialize the Google Generative AI with the API Key from environment variables
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  
    let modelId = process.env.GENERATIVE_MODEL || null;

    const model = genAI.getGenerativeModel({
      model: modelId,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `
      You are an AI meeting assistant. Analyze the following meeting transcript.
      Provide a brief summary and a list of actionable items exactly as a JSON response.
      Do NOT include any markdown code block formatting (like \`\`\`json) in your response, just the raw JSON object.
      
      Format:
      {
        "summary": "A brief 2 to 3 sentence summary of the meeting.",
        "keyPoints": ["Important decision or discussion point"],
        "actionItems": [
          {
            "task": "Clear task to complete",
            "assignee": "Person responsible or Unassigned",
            "priority": "low | medium | high",
            "completed": false
          }
        ]
      }

      Transcript to process:
      "${content}"
    `;

    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (genErr) {
      console.error('generateContent error:', genErr?.message || genErr);
      // Try to list models to help debugging
      try {
        const listResp = await genAI.listModels();
        console.error('Available generative models:', JSON.stringify(listResp, null, 2));
      } catch (listErr) {
        console.error('listModels failed:', listErr?.message || listErr);
      }
      throw genErr;
    }

    const responseText = result.response.text();
    console.log("Raw AI Response:", responseText);
    const parsedData = parseMeetingSummaryResponse(responseText);
    const payload = {
      summary: parsedData.summary || "No summary generated.",
      keyPoints: Array.isArray(parsedData.keyPoints) ? parsedData.keyPoints : [],
      actionItems: normalizeActionItems(parsedData.actionItems),
    };

    if (meeting) {
      meeting.transcript = content;
      meeting.summary = payload.summary;
      meeting.keyPoints = payload.keyPoints;
      meeting.actionItems = payload.actionItems;
      await meeting.save();
    }

    res.status(200).json(payload);

  } catch (error) {
    console.error("AI Summarization Error:", error);
    res.status(500).json({ message: "AI Summarization failed.", error: error.message });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const meetings = await Meeting.find().sort({ createdAt: -1 });
    const totalMeetings = meetings.length;
    const totalDuration = meetings.reduce((sum, meeting) => sum + (meeting.duration || 0), 0);
    const allActionItems = meetings.flatMap((meeting) => meeting.actionItems || []);
    const completedActionItems = allActionItems.filter((item) => item.completed).length;

    const weekLabels = [];
    const weeklyData = [];
    const now = new Date();

    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7 - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      weekLabels.push(`${weekStart.getMonth() + 1}/${weekStart.getDate()}`);
      weeklyData.push(
        meetings.filter((meeting) => {
          const createdAt = new Date(meeting.createdAt);
          return createdAt >= weekStart && createdAt < weekEnd;
        }).length
      );
    }

    res.status(200).json({
      totalMeetings,
      totalDuration,
      avgDuration: totalMeetings ? Math.round(totalDuration / totalMeetings) : 0,
      totalActionItems: allActionItems.length,
      completedActionItems,
      completionRate: allActionItems.length
        ? Math.round((completedActionItems / allActionItems.length) * 100)
        : 0,
      weeklyData,
      weekLabels,
    });
  } catch (error) {
    res.status(500).json({ message: "Analytics failed.", error: error.message });
  }
};
