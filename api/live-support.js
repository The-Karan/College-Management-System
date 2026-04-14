const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      message: "Method not allowed. Use POST."
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      message: "GEMINI_API_KEY is not configured on the server."
    });
  }

  let payload = req.body;

  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch (error) {
      return res.status(400).json({
        message: "Invalid JSON request body."
      });
    }
  }

  if (!payload || typeof payload !== "object") {
    return res.status(400).json({
      message: "Request body is required."
    });
  }

  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify(payload)
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json().catch(() => ({}))
      : { message: await response.text().catch(() => "") };

    if (!response.ok) {
      return res.status(response.status).json({
        message:
          data?.error?.message ||
          data?.message ||
          `Gemini request failed with status ${response.status}.`
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Unable to reach the Gemini API."
    });
  }
};
