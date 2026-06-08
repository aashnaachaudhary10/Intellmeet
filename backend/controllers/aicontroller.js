// AI Controller - summarize meeting transcripts and provide analytics
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "../config/prisma.js";

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
        priority: ["low", "medium", "high"].includes(item.priority)
          ? item.priority
          : "medium",
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
  const cleanedText = responseText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

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
          ("summary" in parsed ||
            "keyPoints" in parsed ||
            "actionItems" in parsed)
        ) {
          return parsed;
        }
      } catch {
        // Keep checking earlier blocks in the response.
      }
    }
  }

  throw new Error(
    "AI response did not contain a valid meeting summary JSON object."
  );
};

export const summarizeText = async (req, res) => {
  try {
    const { text, transcript, meetingId } = req.body;

    const meeting = meetingId
      ? await prisma.meeting.findUnique({
          where: { id: meetingId },
        })
      : null;

    const content = (text || transcript || meeting?.transcript || "").trim();

    if (!content) {
      return res
        .status(400)
        .json({ message: "Transcript text is required for summarization" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res
        .status(500)
        .json({ message: "Gemini API key is not configured in .env" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const modelId = process.env.GENERATIVE_MODEL || "gemini-1.5-flash";

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
      console.error("generateContent error:", genErr?.message || genErr);
      try {
        const listResp = await genAI.listModels();
        console.error(
          "Available generative models:",
          JSON.stringify(listResp, null, 2)
        );
      } catch (listErr) {
        console.error("listModels failed:", listErr?.message || listErr);
      }
      throw genErr;
    }

    const responseText = result.response.text();
    console.log("Raw AI Response:", responseText);
    const parsedData = parseMeetingSummaryResponse(responseText);
    const actionItems = normalizeActionItems(parsedData.actionItems);

    const createdTasks = [];
    if (meeting && actionItems.length > 0) {
      for (const item of actionItems) {
        try {
          const task = await prisma.task.create({
            data: {
              title: item.task,
              description: item.task,
              status: "todo",
              userId: req.user.id,
              meetingId: meeting.id,
              assigneeName: item.assignee,
              priority: item.priority,
            },
            include: {
              user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
            },
          });
          createdTasks.push(task);
        } catch (taskErr) {
          console.error("Failed to create task from action item:", taskErr);
        }
      }
    }

    const payload = {
      summary: parsedData.summary || "No summary generated.",
      keyPoints: Array.isArray(parsedData.keyPoints)
        ? parsedData.keyPoints
        : [],
      actionItems,
    };

    if (meeting) {
      await prisma.meeting.update({
        where: { id: meeting.id },
        data: {
          transcript: content,
          summary: payload.summary,
          keyPoints: payload.keyPoints,
          actionItems: payload.actionItems,
        },
      });
    }

    res.status(200).json({
      ...payload,
      createdTasks,
    });
  } catch (error) {
    console.error("AI Summarization Error:", error);
    res.status(500).json({
      message: "AI Summarization failed.",
      error: error.message,
    });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const meetings = await prisma.meeting.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        tasks: true,
      },
    });

    const totalMeetings = meetings.length;
    const totalDuration = meetings.reduce(
      (sum, meeting) => sum + (meeting.duration || 0),
      0
    );

    const allTasks = meetings.flatMap((meeting) => meeting.tasks || []);
    const totalActionItems = allTasks.length;
    const completedActionItems = allTasks.filter(
      (task) => task.status === "done"
    ).length;

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
      avgDuration: totalMeetings
        ? Math.round(totalDuration / totalMeetings)
        : 0,
      totalActionItems,
      completedActionItems,
      completionRate: totalActionItems
        ? Math.round(
            (completedActionItems / totalActionItems) * 100
          )
        : 0,
      weeklyData,
      weekLabels,
    });
  } catch (error) {
    res.status(500).json({
      message: "Analytics failed.",
      error: error.message,
    });
  }
};
