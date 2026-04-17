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
    // 1-bosqich: Chiziqlarni (scratches) va eskilik alomatlarini yo'qotish uchun Microsoft modeli
    const scratchRemoved = await replicate.run(
      "microsoft/bringing-old-photos-back-to-life:c75db81db6cbd809d93cc3b7e7a088a351a3349c9fa02b6d393e35e0d51ba799",
      {
        input: {
          image: compressedImage,
          HR: true,
          with_scratch: true
        }
      }
    );

    // 2-bosqich: CodeFormer orqali yuzlarni o'ta aniq tiniqlashtirish va umumiy sifatni oshirish (mukammallashtirish)
    // CodeFormer natijani mukammal qilish uchun fidelity: 0.1 o'rnatamiz (yoki original qiyofani biroz saqlash uchun 0.1 yuzga yaqin)
    const output = await replicate.run(
      "sczhou/codeformer:cc4956dd26fa5a7185d5660cc9100fab1b8070a1d1654a8bb5eb6d443b020bb2",
      {
        input: {
          image: scratchRemoved,          // Birinchi bosqichdan olingan chiziqsiz rasm
          face_upsample: true,            // Yuzni tiniqlashtirish
          background_enhance: true,       // Fon sifatini ham oshirish
          upscale: 2,                     // Rasmni kattalashtirish
          codeformer_fidelity: 0.1        // Mukammal sifat va AI tiklashi (chiziqlarsiz)
        }
      }
    );

    // Frontend 'resultUrl' orqali kutadi
    res.status(200).json({ resultUrl: output });
  } catch (error) {
    console.error("API error", error);
    res.status(500).json({ error: error.message });
  }
}
