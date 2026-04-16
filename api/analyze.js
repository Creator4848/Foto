export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Faqat POST so'rovlar qabul qilinadi" });
  }

  const { compressedImage } = req.body;
  const token = process.env.REPLICATE_API_TOKEN || process.env.GROQ_API_KEY; // FaIlback if they mistakenly saved it as GROQ

  if (!token) {
    return res.status(500).json({ error: "Vercel muhitida (Environment Variables) REPLICATE_API_TOKEN topilmadi! Iltimos, Vercel sozlamalariga kiriting." });
  }

  try {
    // 1. Prediction yaratish
    const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        // microsoft/bringing-old-photos-back-to-life
        version: "c75db81db6cbd809d93cc3b7e7a088a351a3349c9fa02b6d393e35e0d51ba799",
        input: {
          image: compressedImage,
          HR: false,
          with_scratch: true
        }
      })
    });

    let prediction = await startResponse.json();
    if (startResponse.status !== 201) {
      throw new Error(prediction.detail || "Replicate API ishga tushirishda xatolik");
    }

    // 2. Kuting (Polling) natija tayyor bo'lmaguncha
    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed" &&
      prediction.status !== "canceled"
    ) {
      await new Promise(r => setTimeout(r, 2000)); // 2 soniya kutamiz
      const pollResponse = await fetch(prediction.urls.get, {
        headers: { "Authorization": `Token ${token}` },
      });
      prediction = await pollResponse.json();
    }

    if (prediction.status === "succeeded") {
      // Replicate natijasi fayl URL si sifatida qaytadi
      res.status(200).json({ resultUrl: prediction.output });
    } else {
      throw new Error(`Xatolik yuz berdi: ${prediction.error}`);
    }
  } catch (error) {
    console.error("API error", error);
    res.status(500).json({ error: error.message });
  }
}
