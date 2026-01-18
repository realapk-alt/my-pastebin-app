// api/proxy.js
export default async function handler(req, res) {
    // CORS allow karne ke liye headers (Zaruri hai taaki frontend baat kar sake)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    
    // Agar request browser se pre-check (OPTIONS) hai to OK bhej do
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Aapka Pastebin DEV Key yaha dalein
    const API_DEV_KEY = 'YAHAN_APNA_DEV_KEY_DALEN'; 

    try {
        const { action, ...otherParams } = req.body; // Frontend se data lena

        let url = '';
        let bodyData = new URLSearchParams();
        bodyData.append('api_dev_key', API_DEV_KEY);

        // Action ke hisab se URL aur Data set karna
        if (action === 'login') {
            url = 'https://pastebin.com/api/api_login.php';
            bodyData.append('api_user_name', otherParams.username);
            bodyData.append('api_user_password', otherParams.password);
        } 
        else if (action === 'create') {
            url = 'https://pastebin.com/api/api_post.php';
            bodyData.append('api_user_key', otherParams.user_key);
            bodyData.append('api_paste_code', otherParams.code);
            bodyData.append('api_paste_name', otherParams.title);
            bodyData.append('api_paste_private', '2'); // 2 = Private
            bodyData.append('api_option', 'paste');
        } 
        else if (action === 'list') {
            url = 'https://pastebin.com/api/api_post.php';
            bodyData.append('api_user_key', otherParams.user_key);
            bodyData.append('api_option', 'list');
            bodyData.append('api_results_limit', '10');
        }

        // Pastebin ko request bhejna
        const pastebinResponse = await fetch(url, {
            method: 'POST',
            body: bodyData
        });

        const resultText = await pastebinResponse.text();

        // Agar List mangi hai to XML ko JSON me badalne ki simple koshish
        if (action === 'list' && resultText.includes('<paste>')) {
             // XML parsing basic regex se (simple rakhne ke liye)
             // Real project me 'xml2js' library use karein
             const pastes = [];
             const regex = /<paste_title>(.*?)<\/paste_title>.*?<paste_date>(.*?)<\/paste_date>.*?<paste_url>(.*?)<\/paste_url>/gs;
             let match;
             while ((match = regex.exec(resultText)) !== null) {
                 pastes.push({
                     title: match[1],
                     date: new Date(parseInt(match[2]) * 1000).toLocaleDateString(),
                     url: match[3]
                 });
             }
             return res.status(200).json({ status: 'success', data: pastes });
        }

        // Error checking
        if (resultText.includes('Bad API')) {
            return res.status(400).json({ status: 'error', message: resultText });
        }

        // Login aur Create ke liye simple response
        return res.status(200).json({ 
            status: 'success', 
            payload: resultText 
        });

    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
}
