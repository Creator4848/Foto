import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN, // Token Vercel environment variables orqali olinadi
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Faqat POST so'rovlar qabul qilinadi" });
  }

  const { compressedImage } = req.body;

  try {
    const output = await replicate.run(
      "sczhou/codeformer:cc4956dd26fa5a7185d5660cc9100fab1b8070a1d1654a8bb5eb6d443b020bb2",
      {
        input: {
          image: compressedImage,         // Frontend yuboradigan rasm
          face_upsample: true,            // Yuzni tiniqlashtirish
          upscale: 2,                     // 2 barobar sifatni oshirish
          codeformer_fidelity: 0.5        // Aniqlik
        }
      }
    );

    // Oldingi Code (frontend) 'resultUrl' orqali kutadi
    res.status(200).json({ resultUrl: output });
  } catch (error) {
    console.error("API error", error);
    res.status(500).json({ error: error.message });
  }
}
