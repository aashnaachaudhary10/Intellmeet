export const summarizeText = async (req, res) => {
  const { text } = req.body;

  const summary = text.slice(0, 100) + "...";

  const actionItems = [
    "Follow up with team",
    "Complete pending tasks"
  ];

  res.json({ summary, actionItems });
};