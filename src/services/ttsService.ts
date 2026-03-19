import { GoogleGenAI, Modality } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY no está configurada. Por favor, añádela a las variables de entorno.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

// Reutilizar el AudioContext para evitar latencia de inicialización
let sharedAudioContext: AudioContext | null = null;

function getAudioContext() {
  if (!sharedAudioContext) {
    sharedAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return sharedAudioContext;
}

// Cache de AudioBuffers (ya decodificados) para respuesta instantánea
const audioBufferCache: Record<string, AudioBuffer> = {};

export async function speakText(text: string, useIA: boolean = true, voice: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr' = 'Kore') {
  if (!text) return;

  const cacheKey = `${text.toLowerCase().trim()}_${voice}`;
  const ctx = getAudioContext();

  // 1. Respuesta instantánea si está en caché
  if (audioBufferCache[cacheKey]) {
    playAudioBuffer(audioBufferCache[cacheKey]);
    return;
  }

  // 2. Si no se usa IA, usar síntesis nativa directamente
  if (!useIA) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
    return;
  }

  try {
    const ai = getAI();
    // Prompt más corto = Generación más rápida
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Diga: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audioBuffer = decodePCM(base64Audio, ctx);
      audioBufferCache[cacheKey] = audioBuffer;
      playAudioBuffer(audioBuffer);
    }
  } catch (error: any) {
    console.error("Error al generar audio con Gemini, intentando fallback nativo:", error);
    
    // Fallback: Usar la síntesis de voz nativa del navegador
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR'; // El contenido es en portugués
      utterance.rate = 0.9; // Un poco más lento para niños
      window.speechSynthesis.speak(utterance);
    } catch (fallbackError) {
      console.error("Fallback de voz también falló:", fallbackError);
    }

    // Propagar el error original para que la UI muestre el aviso de cuota
    throw error;
  }
}

function decodePCM(base64Data: string, ctx: AudioContext): AudioBuffer {
  const binaryString = window.atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const int16Array = new Int16Array(bytes.buffer);
  const float32Array = new Float32Array(int16Array.length);
  
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768;
  }

  const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
  audioBuffer.getChannelData(0).set(float32Array);
  return audioBuffer;
}

function playAudioBuffer(buffer: AudioBuffer) {
  const ctx = getAudioContext();
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
}
