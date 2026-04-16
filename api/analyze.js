export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Faqat POST so'rovlar qabul qilinadi" });
  }

  const { compressedImage } = req.body;
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Vercel muhitida (Environment Variables) API kalit topilmadi! Iltimos, Vercel sozlamalariga GROQ_API_KEY ni kiriting." });
  }

  let apiUrl = "https://openrouter.ai/api/v1/chat/completions";
  let apiModel = "openai/gpt-4o-mini";

  if (apiKey.startsWith("gsk_")) {
      apiUrl = "https://api.groq.com/openai/v1/chat/completions";
      apiModel = "meta-llama/llama-4-scout-17b-16e-instruct";
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://fotomemory.vercel.app",
        "X-Title": "PhotoMemory AI"
      },
      body: JSON.stringify({
        model: apiModel,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "You are an AI photo restorer. Look at this photo. Decide the best enhancement values. Return ONLY a pure JSON object in this format: {\"enhance\": 0.8, \"saturate\": 0.6} where values represent percentages (0.0 to 1.0). Use 'saturate' around 0.8 for black/white images, and 'enhance' around 0.9 for blurry/damaged ones." },
              { type: "image_url", image_url: { url: compressedImage } }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok || !data.choices) {
      throw new Error(data.error ? data.error.message : "Noma'lum API xatosi");
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("API error", error);
    res.status(500).json({ error: error.message });
  }
}
