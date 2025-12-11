import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '../constants/Config';
import * as FileSystem from 'expo-file-system';

let genAI;
let model;

const initGemini = () => {
    if (!genAI) {
        if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
            console.warn('Gemini API Key is missing');
            return false;
        }
        genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        // Use Gemini 1.5 Flash for speed/cost effectiveness, or Pro for better multimodal
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        return true;
    }
    return true;
};

export const getEmbedding = async (text) => {
    if (!initGemini()) return null;
    try {
        const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await embeddingModel.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error('Error getting embedding:', error);
        return null;
    }
};

export const enhanceNote = async (note) => {
    if (!initGemini()) return { error: 'API Key missing' };

    try {
        let textToProcess = note.content;
        let prompt = "";

        if (note.type === 'image' && note.metadata?.imageUri) {
            // Handle Image Logic
            const base64 = await FileSystem.readAsStringAsync(note.metadata.imageUri, { encoding: FileSystem.EncodingType.Base64 });

            prompt = "Analyze this image. If it contains handwritten text, transcribe it fully. Then provide a summary and 3 key tags. Return in JSON format: { transcription: string, summary: string, tags: string[] }";

            const result = await model.generateContent([prompt, { inlineData: { data: base64, mimeType: "image/jpeg" } }]);
            const response = result.response;
            const text = response.text();
            // Simple parsing (robust parsing would use getSchema or stronger regex)
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return { summary: text, tags: [] };

        } else if (note.type === 'voice' && note.metadata?.audioUri) {
            // Handle Audio Logic (Gemini 1.5 allows audio input directly)
            const base64 = await FileSystem.readAsStringAsync(note.metadata.audioUri, { encoding: FileSystem.EncodingType.Base64 });

            prompt = "Listen to this audio. Transcribe it exactly. Then provide a summary and 3 key tags. Return in JSON format: { transcription: string, summary: string, tags: string[] }";

            // Audio mime type might vary, assuming m4a/mp4 for iOS voice recorder default
            const result = await model.generateContent([prompt, { inlineData: { data: base64, mimeType: "audio/mp4" } }]);
            const response = result.response;
            const text = response.text();

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return { summary: text, tags: [] };
        } else {
            // Text Note
            prompt = `Analyze the following note. Provide a concise summary and 3 related tags. Return in JSON format: { summary: string, tags: string[] }\n\nNote Content:\n${textToProcess}`;

            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            let structuredData = { summary: text, tags: [] };
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                structuredData = JSON.parse(jsonMatch[0]);
            }

            // Generate Embedding
            const embedding = await getEmbedding(textToProcess);

            return { ...structuredData, embedding: JSON.stringify(embedding) };
        }

    } catch (error) {
        console.error('Error enhancing note:', error);
        return { error: error.message };
    }
};
