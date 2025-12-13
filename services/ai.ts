
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

// --- HELPER: SAFE JSON PARSE ---
const safeJsonParse = (text: string) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    // Check for markdown code blocks (```json ... ``` or just ``` ... ```)
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e2) {
        console.error("JSON Parse Error (Inner):", e2);
      }
    }
    console.error("JSON Parse Error:", e);
    return null;
  }
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

        if (response.text) return safeJsonParse(response.text);
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
     if (response.text) return safeJsonParse(response.text);
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

// --- GLOBAL CHATBOT (RESTRICTED TO APP CONTEXT) ---
export const chatWithBot = async (history: {role: string, text: string}[], message: string) => {
    const client = getClient();
    if (!client) return "AI Offline. Check API Key.";

    // Strictly limit the chatbot to the application domain
    const systemInstruction = `You are AXIOM_BOT, the dedicated AI assistant for the AXIOM Education Platform.
Your ONLY purpose is to assist users with the AXIOM web application.
You must NOT answer general knowledge questions, solve math problems, or discuss topics unrelated to the AXIOM interface and features.

The AXIOM platform includes these modules:
1. Dashboard: Overview of stats, attendance, and grades.
2. AXIOM Live: Real-time video tutoring with interactive whiteboard.
3. Timetable: Class scheduling for students and teachers.
4. Attendance: QR-based tracking and manual entry.
5. Student Tracker: Gamified profile with badges and achievements.
6. Career Advisor: AI-based career path suggestions.
7. Alumni Network: Directory of graduates and mentorship.
8. Dropout Risk Analysis: Predictive analytics for teachers (Confidential).
9. Gamified Learning: Quiz battles and leaderboards.
10. Learning Hub: Video and document library.
11. Certificate Validator: Blockchain verification of credentials.
12. Wellness Center: Mood tracking, breathing exercises, and AI meditation.
13. Study Planner: AI-powered task breakdown and focus timer.
14. Doubt Solver: The place to ask academic questions (Not here in the global chat).

If a user asks a general question (e.g. "What is 2+2?", "Who is the president?", "Write code"), politely refuse and guide them to the specific module (e.g., "For academic help, please use the Doubt Solver module.").
If a user asks about the app (e.g. "How do I check attendance?", "Where is the whiteboard?"), answer helpfully and concisely.`;

    try {
        // Convert simple history to API format if needed, or just use sendChat if keeping state locally in component
        // Since the component manages state, we'll try to sync it, but simple generation with history is easier for this stateless function style
        // Construct the history for the model
        const chatHistory = history.map(h => ({
            role: h.role === 'model' ? 'model' : 'user',
            parts: [{ text: h.text }]
        }));

        // Remove the last message from history as it is the current message we are sending
        // The component likely appends the user message to history before calling this.
        // Actually, looking at Chatbot.tsx: setMessages(prev => [...prev, userMsg]); then calls chatWithBot(history...)
        // So history contains the new message? No, "const history = messages.map..." is derived from state *before* the new message is fully committed?
        // In Chatbot.tsx:
        // setMessages(prev => [...prev, userMsg]);
        // const history = messages.map... -> This uses the OLD 'messages' state because setMessages is async/batched.
        // So 'message' is the new one, 'history' is the past. This is correct.

        const chat = client.chats.create({
            model: 'gemini-2.5-flash',
            config: { systemInstruction },
            history: chatHistory
        });

        const result = await chat.sendMessage({ message });
        return result.text;
    } catch (error) {
        console.error("Global Chat Error:", error);
        return "System Malfunction. Unable to process request.";
    }
};

export const generateTimetable = async () => {
    const client = getClient();
    if (!client) return null;
    return [
        { day: 'Monday', time: '09:00', subject: 'AI Ethics', code: 'AI101', professorName: 'Dr. Gemini', roomId: 'Virtual', color: 'bg-neo-pink' },
        { day: 'Wednesday', time: '14:00', subject: 'Deep Learning', code: 'CS404', professorName: 'Prof. LeCun', roomId: '303', color: 'bg-neo-blue' },
    ];
};
