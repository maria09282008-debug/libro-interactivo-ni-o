import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Sparkles, Music, Mic, Plus, Play, BookOpen, CheckCircle2, Loader2, Settings, Zap, Crown } from 'lucide-react';
import { speakText } from '../services/ttsService';

export function RhymeExplorer({ useIA }: { useIA: boolean }) {
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const rhymes = [
    { word: "Gato", rhyme: "Pato" },
    { word: "Bola", rhyme: "Escola" },
    { word: "Leão", rhyme: "Melão" },
    { word: "Mão", rhyme: "Pão" }
  ];

  const handleSpeak = async (word: string, rhyme: string) => {
    if (isPlaying) return;
    setIsPlaying(true);
    setActiveWord(word);
    try {
      await speakText(`${word} rima com ${rhyme}`, useIA);
    } catch (error: any) {
      console.error(error);
      const isQuotaError = error?.message?.toLowerCase().includes('quota') || 
                          error?.message?.toLowerCase().includes('429');
      
      if (isQuotaError) {
        window.dispatchEvent(new CustomEvent('app-error', { 
          detail: 'Límite de audio IA alcanzado. Usando voz de respaldo...' 
        }));
      }
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <div className="card bg-indigo-50/50 border-indigo-100 mt-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white">
          <Music size={18} />
        </div>
        <h3 className="font-bold text-indigo-900">Explorador de Rimas Interativo</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {rhymes.map((pair) => (
          <button
            key={pair.word}
            disabled={isPlaying}
            onClick={() => handleSpeak(pair.word, pair.rhyme)}
            className={`p-4 rounded-2xl border-2 transition-all text-center relative ${
              activeWord === pair.word 
                ? "bg-white border-indigo-500 shadow-lg scale-105" 
                : "bg-white border-transparent hover:border-indigo-200"
            }`}
          >
            {isPlaying && activeWord === pair.word && (
              <div className="absolute top-2 right-2">
                <Loader2 size={14} className="animate-spin text-indigo-500" />
              </div>
            )}
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Rima com</p>
            <p className="text-lg font-bold text-slate-900">{pair.word}</p>
            {activeWord === pair.word && (
              <motion.p 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl font-serif font-bold text-indigo-600 mt-2"
              >
                {pair.rhyme}!
              </motion.p>
            )}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-indigo-400 mt-4 text-center font-medium">
        Clique para ouvir as rimas! (Áudio gerado por IA)
      </p>
    </div>
  );
}

export function SoundBoard({ useIA }: { useIA: boolean }) {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);

  const letters = [
    { char: "A", sound: "Aaaaaa", desc: "O som que o bebê faz" },
    { char: "M", sound: "Mmmmm", desc: "Lábios fechados, som nasal" },
    { char: "P", sound: "P!", desc: "Som explosivo seco" },
    { char: "B", sound: "B-b-b", desc: "Vibra na garganta" }
  ];

  const handleSpeak = async (char: string) => {
    if (isPlaying) return;
    setIsPlaying(char);
    try {
      await speakText(`O som da letra ${char} é: ${char}`, useIA);
    } catch (error: any) {
      console.error(error);
      const isQuotaError = error?.message?.toLowerCase().includes('quota') || 
                          error?.message?.toLowerCase().includes('429');
      
      if (isQuotaError) {
        window.dispatchEvent(new CustomEvent('app-error', { 
          detail: 'Límite de audio IA alcanzado. Usando voz de respaldo...' 
        }));
      }
    } finally {
      setIsPlaying(null);
    }
  };

  return (
    <div className="card bg-emerald-50/50 border-emerald-100 mt-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
          <Volume2 size={18} />
        </div>
        <h3 className="font-bold text-emerald-900">Quadro de Sons Interativo</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {letters.map((l) => (
          <button 
            key={l.char} 
            disabled={isPlaying !== null}
            onClick={() => handleSpeak(l.char)}
            className={`bg-white p-4 rounded-2xl border transition-all text-center group hover:shadow-md relative ${
              isPlaying === l.char ? "border-emerald-500 scale-105 shadow-lg" : "border-emerald-100"
            }`}
          >
            {isPlaying === l.char && (
              <div className="absolute top-2 right-2">
                <Loader2 size={14} className="animate-spin text-emerald-500" />
              </div>
            )}
            <div className="text-4xl font-bold text-emerald-600 mb-2">{l.char}</div>
            <p className="text-sm font-bold text-slate-700">{l.sound}</p>
            <p className="text-[10px] text-slate-400 mt-1 leading-tight">{l.desc}</p>
            {isPlaying === l.char && (
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity }}
                className="mt-2 text-emerald-500"
              >
                <Volume2 size={16} className="mx-auto" />
              </motion.div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SyllableBuilder({ useIA }: { useIA: boolean }) {
  const [syllables, setSyllables] = useState(['MA', 'TO', 'PA', 'BO', 'LA', 'DA', 'DE', 'DO']);
  const [currentWord, setCurrentWord] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const addSyllable = (s: string) => {
    if (currentWord.length < 4) {
      setCurrentWord([...currentWord, s]);
    }
  };

  const clear = () => setCurrentWord([]);

  const playWord = async () => {
    if (currentWord.length === 0 || isPlaying) return;
    setIsPlaying(true);
    const word = currentWord.join('');
    try {
      await speakText(word, useIA);
    } catch (error: any) {
      console.error(error);
      const isQuotaError = error?.message?.toLowerCase().includes('quota') || 
                          error?.message?.toLowerCase().includes('429');
      
      if (isQuotaError) {
        window.dispatchEvent(new CustomEvent('app-error', { 
          detail: 'Límite de audio IA alcanzado. Usando voz de respaldo...' 
        }));
      }
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <div className="card bg-amber-50/50 border-amber-100 mt-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white">
          <Plus size={18} />
        </div>
        <h3 className="font-bold text-amber-900">Construtor de Sílabas</h3>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 min-h-[60px] p-4 bg-white rounded-2xl border-2 border-dashed border-amber-200 items-center justify-center">
        <AnimatePresence>
          {currentWord.map((s, i) => (
            <motion.div
              key={`${s}-${i}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="px-4 py-2 bg-amber-500 text-white font-bold rounded-xl shadow-sm"
            >
              {s}
            </motion.div>
          ))}
        </AnimatePresence>
        {currentWord.length === 0 && <span className="text-slate-300 text-sm">Escolha as sílabas abaixo...</span>}
      </div>

      <div className="grid grid-cols-4 gap-2 mb-6">
        {syllables.map((s) => (
          <button
            key={s}
            onClick={() => addSyllable(s)}
            className="p-3 bg-white border border-amber-100 rounded-xl font-bold text-amber-700 hover:bg-amber-50 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button 
          onClick={playWord}
          disabled={currentWord.length === 0 || isPlaying}
          className="flex-1 btn-primary bg-amber-600 flex items-center justify-center gap-2"
        >
          {isPlaying ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
          {isPlaying ? 'Gerando Áudio...' : 'Ouvir Palavra'}
        </button>
        <button 
          onClick={clear}
          className="px-6 py-3 border border-amber-200 rounded-full text-amber-700 font-medium hover:bg-amber-50"
        >
          Limpar
        </button>
      </div>
    </div>
  );
}

export function StoryReader({ story, useIA }: { story: { title: string; content: string[] }; useIA: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleRead = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      await speakText(`${story.title}. ${story.content.join(' ')}`, useIA);
    } catch (error: any) {
      console.error(error);
      const isQuotaError = error?.message?.toLowerCase().includes('quota') || 
                          error?.message?.toLowerCase().includes('429');
      
      if (isQuotaError) {
        window.dispatchEvent(new CustomEvent('app-error', { 
          detail: 'Límite de audio IA alcanzado. Usando voz de respaldo...' 
        }));
      }
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <div className="card bg-blue-50/50 border-blue-100 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
            <BookOpen size={18} />
          </div>
          <h3 className="font-bold text-blue-900">Leitor de Histórias</h3>
        </div>
        <button 
          onClick={handleRead}
          disabled={isPlaying}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          {isPlaying ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} />}
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-blue-100">
        <h4 className="text-xl font-serif font-bold text-slate-900 mb-4">{story.title}</h4>
        <div className="space-y-4">
          {story.content.map((line, i) => (
            <p key={i} className="text-slate-600 font-serif leading-relaxed italic">
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
