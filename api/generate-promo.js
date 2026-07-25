export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { toko, produk, detail, waktu, gaya } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API Key Gemini belum disetting di Vercel.' });
    }

    const prompt = `Buatkan teks pesan broadcast WhatsApp promosi kuliner yang menarik.
Nama Toko: ${toko}
Produk: ${produk}
Detail Promo: ${detail}
Batas Waktu: ${waktu}
Gaya Bahasa: ${gaya}

Aturan:
- Gunakan emoji secukupnya.
- Jangan gunakan formatting markdown bold/italic bintang (*) yang berlebihan jika tidak perlu.
- Di akhir kalimat, WAJIB sertakan penutup persis seperti ini: "Terimakasih udah mampir dan dukung terus ${toko} yaa 🙏"
- Langsung berikan hasil teksnya saja tanpa basa-basi pembuka.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 500
                }
            })
        });

        if (!response.ok) {
            const errData = await response.text();
            throw new Error(`Google API Error: ${errData}`);
        }

        const data = await response.json();
        const aiText = data.candidates[0].content.parts[0].text;
        
        return res.status(200).json({ text: aiText });
    } catch (error) {
        console.error("AI Generation Error:", error);
        return res.status(500).json({ error: 'Gagal memuat AI. ' + error.message });
    }
}
