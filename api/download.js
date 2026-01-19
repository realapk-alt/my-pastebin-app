// api/download.js

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ status: 'error', message: 'Method not allowed' });
    }

    const { platform, url } = req.body;
    const API_KEY = "test7"; // Aapki API Key

    // Endpoints based on your python code
    const IG_API = "https://usesir-ig-reel-trail.vercel.app/api/ig-reel";
    const PIN_API = "https://usesir-ig-reel-trail.vercel.app/api/pin-download";

    let targetApi = "";

    // Decide which API to call
    if (platform === 'ig') {
        targetApi = IG_API;
    } else if (platform === 'pin') {
        targetApi = PIN_API;
    } else {
        return res.status(400).json({ status: 'error', message: 'Invalid platform' });
    }

    try {
        // Construct URL: API?key=...&url=...
        const fetchUrl = `${targetApi}?key=${API_KEY}&url=${encodeURIComponent(url)}`;
        
        const response = await fetch(fetchUrl);
        const data = await response.json();

        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ 
            status: 'error', 
            message: 'Server failed to fetch data' 
        });
    }
}
