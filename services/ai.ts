

import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Student } from "../types";

const getApiKey = (): string | undefined => {
  return process.env.API_KEY;
};

const getClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

// --- LIVE API HELPERS ---
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buffer;
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// --- BASE64 HELPER ---
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- MULTIMODAL DOUBT SOLVER WITH SEARCH GROUNDING ---
export const solveDoubtWithImage = async (message: string, imageFile?: File, useSearch: boolean = false) => {
  const client = getClient();
  if (!client) return { text: "AI Offline. Check API Key." };

  try {
    let contentParts: any[] = [{ text: message }];

    if (imageFile) {
        const imagePart = await fileToGenerativePart(imageFile);
        contentParts = [imagePart, { text: message }];
    }

    const config: any = {
      systemInstruction: "You are an expert academic tutor. Be specific, helpful, and encourage the student. If an image is provided, analyze it deeply. If Google Search is enabled, use it to find the most recent and accurate information.",
    };

    // Add search tool if requested
    if (useSearch) {
        config.tools = [{ googleSearch: {} }];
    }

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: contentParts },
      config: config
    });

    return {
        text: response.text || "I couldn't analyze that.",
        groundingMetadata: response.candidates?.[0]?.groundingMetadata
    };
  } catch (error) {
    console.error("Multimodal Error:", error);
    return { text: "Error processing your request. Please try again." };
  }
};

// --- TTS WELLNESS GENERATOR ---
export const generateMeditationAudio = async (mood: number, stress: number): Promise<string | null> => {
    const client = getClient();
    if (!client) return null;

    const prompt = `
      Speak a short, calming, and encouraging message to a student who feels mood level ${mood}/5 and stress level ${stress}/5.
      Keep it under 30 seconds. Speak slowly and softly.
    `;

    try {
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || null;
    } catch (error) {
        console.error("TTS Error:", error);
        return null;
    }
};

// --- STUDY PLANNER ---
export const deconstructStudyGoal = async (goal: string) => {
    const client = getClient();
    if (!client) return null;

    const prompt = `
        The student wants to achieve this goal: "${goal}".
        Break this down into 3-5 concrete, actionable study sessions.
        For each session, provide a title and a duration (in minutes).
    `;

    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            duration: { type: Type.NUMBER },
                            priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] }
                        }
                    }
                }
            }
        });

        if (response.text) return JSON.parse(response.text);
        return null;
    } catch (error) {
        console.error("Planner Error:", error);
        return null;
    }
};

// --- LEGACY/EXISTING ---
export const getCareerAdvice = async (student: Student) => {
  const client = getClient();
  if (!client) return null;

  const prompt = `
    Analyze this student profile and suggest 2 suitable career paths.
    Student: ${JSON.stringify(student)}
  `;

  try {
     const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { 
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    analysis: { type: Type.STRING },
                    careers: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                match: { type: Type.NUMBER },
                                description: { type: Type.STRING },
                                roadmap: { type: Type.ARRAY, items: { type: Type.STRING } }
                            }
                        }
                    }
                }
            }
        }
     });
     if (response.text) return JSON.parse(response.text);
  } catch (e) {
      console.error(e);
  }
  
  return {
      analysis: "AI Service Unavailable. Showing demo data.",
      careers: []
  }
};

export const getDropoutAnalysis = async (student: Student) => {
    const client = getClient();
    if (!client) return "AI Offline";

    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze dropout risk for student: ${JSON.stringify(student)}. Keep it under 15 words.`,
        });
        return response.text;
    } catch (e) {
        return "Analysis failed.";
    }
};

export const chatWithBot = async (history: any[], message: string) => {
    // Basic chat fallback
    const res = await solveDoubtWithImage(message);
    return res.text;
};

export const generateTimetable = async () => {
    const client = getClient();
    if (!client) return null;
    return [
        { day: 'Monday', time: '09:00', subject: 'AI Ethics', code: 'AI101', professorName: 'Dr. Gemini', roomId: 'Virtual', color: 'bg-neo-pink' },
        { day: 'Wednesday', time: '14:00', subject: 'Deep Learning', code: 'CS404', professorName: 'Prof. LeCun', roomId: '303', color: 'bg-neo-blue' },
    ];
};
