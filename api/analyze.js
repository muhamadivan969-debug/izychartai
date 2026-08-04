export default async function handler(req, res) {
  // Hanya izinkan GET request
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { kode } = req.query;

  if (!kode) {
    return res.status(400).json({ error: "Parameter 'kode' wajib diisi" });
  }

  try {
    const apiKey = process.env.GOAPI_KEY;
    const response = await fetch(`https://api.goapi.io/stock/idx/${kode}`, {
      headers: {
        "X-API-KEY": apiKey
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: "Gagal mengambil data saham", detail: data });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
}
