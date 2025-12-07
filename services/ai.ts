import { GoogleGenAI, Type } from "@google/genai";
import { Student } from "../types";

// Helper to safely get the API key or return null
const getApiKey = (): string | undefined => {
  return process.env.API_KEY;
};

// Initialize the client only when needed to avoid early failures if key is missing
const getClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const getCareerAdvice = async (student: Student) => {
  const client = getClient();
  if (!client) {
    // Fallback if no API key
    return {
      advice: "AI service unavailable. Please configure API_KEY.",
      careers: []
    };
  }

  const prompt = `
    Analyze this student profile and suggest 3 suitable career paths.
    
    Student: ${student.name}
    Skills: ${student.skills.join(', ')}
    Interests: ${student.interests.join(', ')}
    Grades: ${JSON.stringify(student.grades)}
    
    Return a JSON object with this schema:
    {
      "analysis": "A brief analysis of the student's potential.",
      "careers": [
        {
          "title": "Job Title",
          "match": 85, // Number 0-100
          "description": "Why this is a good fit",
          "roadmap": ["Step 1", "Step 2", "Step 3"]
        }
      ]
    }
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-pro-preview',
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
    
    if (response.text) {
        return JSON.parse(response.text);
    }
    throw new Error("No response text");

  } catch (error) {
    console.error("AI Error:", error);
    return null;
  }
};

export const getDropoutAnalysis = async (student: Student) => {
    const client = getClient();
    if (!client) return "AI Analysis Unavailable";

    const prompt = `
      Analyze the dropout risk for this student. Keep it short (max 2 sentences).
      Attendance: ${student.attendance}%
      Grades: ${JSON.stringify(student.grades)}
      Risk Score: ${student.riskScore}
      
      Provide a constructive observation and one intervention.
    `;

    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (e) {
        return "Could not generate analysis.";
    }
};

export const chatWithBot = async (history: { role: 'user' | 'model', text: string }[], message: string) => {
    const client = getClient();
    if (!client) return "I'm offline right now (No API Key).";

    try {
        // Convert history to format expected by API if using chat session, 
        // but for simplicity here we can just use generateContent with context or chat helper.
        // Let's use the Chat helper for proper history management.
        const chat = client.chats.create({
            model: 'gemini-3-pro-preview',
            history: history.map(h => ({
                role: h.role,
                parts: [{ text: h.text }]
            })),
            config: {
                systemInstruction: "You are AXIOM Bot, a helpful educational assistant for students and teachers. Be concise and encouraging."
            }
        });

        const result = await chat.sendMessage({ message });
        return result.text;
    } catch (error) {
        console.error("Chat error", error);
        return "Sorry, I encountered an error processing your request.";
    }
};

export const generateTimetable = async () => {
    const client = getClient();
    if (!client) return null;

    const prompt = `
      Generate a realistic weekly class schedule for a Computer Science university student.
      The schedule must use the following days: Monday, Tuesday, Wednesday, Thursday, Friday.
      The schedule must use the following times: 09:00, 10:00, 11:00, 12:00, 14:00, 15:00.
      
      Generate about 12-15 sessions distributed across the week.
      Include a mix of Computer Science subjects (AI, Database, Algorithms, Networks, OS) and some general electives (Math, Physics, Ethics).
      Assign realistic course codes (e.g., CS101, PHY202).
      Assign realistic professor names.
      Assign varied room IDs (e.g., 101, LAB-A, 302, HALL-1).
      
      Return the data as a JSON array of objects.
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
                            day: { type: Type.STRING, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
                            time: { type: Type.STRING, enum: ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00'] },
                            subject: { type: Type.STRING },
                            code: { type: Type.STRING },
                            professorName: { type: Type.STRING },
                            roomId: { type: Type.STRING }
                        }
                    }
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text);
        }
        return null;
    } catch (error) {
        console.error("Timetable generation error", error);
        return null;
    }
};