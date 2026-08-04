export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, context } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Parameter 'message' wajib diisi" });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    const systemPrompt = `Kamu adalah AI analis saham untuk platform IzyAnalisaAI, fokus pada Bursa Efek Indonesia (BEI).

ATURAN PENTING:
1. Jangan pernah mengklaim bisa memprediksi pasar dengan kepastian 80-85% atau angka pasti lainnya.
2. Selalu sampaikan analisis berdasarkan data (harga, volume, indikator teknikal) yang tersedia.
3. Gunakan istilah "Confidence Score" untuk menunjukkan keyakinan model, bukan jaminan hasil.
4. Selalu akhiri jawaban dengan disclaimer singkat: "DYOR (Do Your Own Research) - ini bukan saran finansial."
5. Jawab dengan bahasa Indonesia yang natural, santai tapi profesional.
6. Jika ditanya soal saham/IHSG tanpa data spesifik, jelaskan bahwa kamu butuh data real-time untuk analisis akurat.

${context ? `Data konteks saat ini: ${JSON.stringify(context)}` : ""}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt + "\n\nPertanyaan user: " + message }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: "Gagal menghubungi Gemini API", detail: data });
    }

    const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, AI tidak bisa memberikan jawaban saat ini.";

    return res.status(200).json({ reply: aiReply });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
}
