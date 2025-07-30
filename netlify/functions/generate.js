const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body);
        const { prompt, apiKey, imageBase64, mimeType } = body;

        if (!prompt || !apiKey) {
            return { statusCode: 400, body: JSON.stringify({ error: "Prompt and API Key are required." }) };
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        
        let model;
        let modelParams;

        if (imageBase64 && mimeType) {
            model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
            const imagePart = {
                inlineData: {
                    data: imageBase64,
                    mimeType: mimeType
                }
            };
            modelParams = [prompt, imagePart];
        } else {
            model = genAI.getGenerativeModel({ model: "gemini-pro" });
            modelParams = [prompt];
        }
        
        const result = await model.generateContent(modelParams);
        const response = await result.response;
        const text = response.text();

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
                candidates: [{
                    content: {
                        parts: [{ text: text }],
                        role: "model"
                    }
                }]
            }),
        };

    } catch (error) {
        console.error("Error calling Google Generative AI:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || "An internal server error occurred." }),
        };
    }
};