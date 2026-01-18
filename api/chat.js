// api/chat.js

export default async function handler(req, res) {
    // Sirf POST request allow karo
    if (req.method !== 'POST') {
        return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
    }

    const userMessage = req.body.message;

    // Aapki API settings
    const API_URL = "https://usesir.vercel.app/api/WORMgpt";
    const API_KEY = "test7"; // Wahi key jo aapne Python me use ki thi

    try {
        // External API ko call lagana (Python ke requests.get jaisa)
        // URL encode zaruri hai taaki spaces wagera se link na toote
        const targetUrl = `${API_URL}?key=${API_KEY}&text=${encodeURIComponent(userMessage)}`;
        
        const response = await fetch(targetUrl);
        const data = await response.json();

        // Jaisa data API de raha hai, waisa hi Frontend ko wapas karo
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ 
            status: 'error', 
            message: 'Internal Server Error: Could not reach WORMgpt API.' 
        });
    }
}
