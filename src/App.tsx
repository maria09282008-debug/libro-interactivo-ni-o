import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  BookOpen, 
  CheckCircle2, 
  ChevronRight, 
  Home as HomeIcon, 
  Star, 
  Award, 
  Settings,
  Menu,
  X,
  PlayCircle,
  Clock,
  Package,
  Heart,
  Sparkles,
  AlertCircle,
  Loader2,
  Zap
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BOOK_CONTENT } from './data/bookContent';
import { Phase, Activity } from './types';
import { RhymeExplorer, SoundBoard, SyllableBuilder, StoryReader } from './components/InteractiveTools';
import { speakText } from './services/ttsService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type View = 'home' | 'phase' | 'wordLists' | 'stories' | 'chapters' | 'faq' | 'glossary' | 'science' | 'milestones' | 'specialSounds' | 'finalWord';

function WordButton({ 
  word, 
  useIA, 
  className,
  iconOnly = false
}: { 
  word: string; 
  useIA: boolean; 
  className?: string;
  iconOnly?: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSpeak = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await speakText(word, useIA);
    } catch (error: any) {
      console.error(error);
      const isQuotaError = error?.message?.toLowerCase().includes('quota') || 
                          error?.message?.toLowerCase().includes('429');
      
      if (isQuotaError) {
        window.dispatchEvent(new CustomEvent('app-error', { 
          detail: '¡Vaya! Hemos alcanzado el límite de audio por ahora. Por favor, intenta de nuevo en unos minutos.' 
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleSpeak}
      disabled={isLoading}
      className={cn(
        "relative p-4 bg-white rounded-2xl border-2 border-indigo-50 font-bold text-slate-700 transition-all text-center flex items-center justify-center shadow-sm",
        isLoading ? "border-brand-primary bg-indigo-50 scale-95" : "hover:border-brand-primary hover:scale-105 hover:shadow-md active:scale-95",
        iconOnly && "p-3 rounded-full",
        className
      )}
      title={iconOnly ? "Ouvir" : undefined}
    >
      {isLoading ? (
        <Loader2 size={iconOnly ? 20 : 16} className="animate-spin text-brand-primary" />
      ) : (
        iconOnly ? <PlayCircle size={20} className="text-brand-primary" /> : word
      )}
    </button>
  );
}

function FloatingElements() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-20">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%",
            rotate: Math.random() * 360,
            scale: 0.5 + Math.random() * 0.5
          }}
          animate={{ 
            y: [null, (Math.random() - 0.5) * 100 + "%"],
            rotate: [null, Math.random() * 360],
            scale: [null, 0.5 + Math.random() * 0.5]
          }}
          transition={{ 
            duration: 10 + Math.random() * 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute"
        >
          {i % 4 === 0 && <Star className="text-brand-accent fill-brand-accent" size={24 + Math.random() * 24} />}
          {i % 4 === 1 && <Heart className="text-brand-secondary fill-brand-secondary" size={20 + Math.random() * 20} />}
          {i % 4 === 2 && <Sparkles className="text-brand-primary" size={24 + Math.random() * 24} />}
          {i % 4 === 3 && <Zap className="text-brand-cyan fill-brand-cyan" size={20 + Math.random() * 20} />}
        </motion.div>
      ))}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<View>('home');
  const [currentPhaseId, setCurrentPhaseId] = useState(1);
  const [currentChapterId, setCurrentChapterId] = useState('c1');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [useIA, setUseIA] = useState(() => {
    const saved = localStorage.getItem('useIA');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('useIA', JSON.stringify(useIA));
  }, [useIA]);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    const saved = localStorage.getItem('completedDays');
    if (saved) setCompletedDays(JSON.parse(saved));

    const handleError = (e: any) => {
      showToast(e.detail);
    };
    window.addEventListener('app-error', handleError);
    return () => window.removeEventListener('app-error', handleError);
  }, []);

  const toggleDay = (day: number) => {
    const isAdding = !completedDays.includes(day);
    const newCompleted = isAdding
      ? [...completedDays, day]
      : completedDays.filter(d => d !== day);
    
    setCompletedDays(newCompleted);
    localStorage.setItem('completedDays', JSON.stringify(newCompleted));

    if (isAdding) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366F1', '#F43F5E', '#F59E0B', '#10B981', '#A855F7', '#06B6D4'],
        ticks: 200
      });
      
      const count = newCompleted.length;
      if (count % 5 === 0) {
        showToast(`🌟 ¡Increíble! ¡Ya tienes ${count} estrellas! ¡Sigue así, campeón!`, 'success');
      } else {
        showToast('⭐ ¡Ganaste una estrella! ¡Buen trabajo!', 'success');
      }
    }
  };

  const currentPhase = BOOK_CONTENT.phases.find(p => p.id === currentPhaseId)!;
  const currentChapter = BOOK_CONTENT.chapters.find(c => c.id === currentChapterId)!;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-brand-bg">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-black/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white">
            <BookOpen size={20} />
          </div>
          <span className="font-bold text-sm tracking-tight">Do Zero à Leitura</span>
        </div>
        <button onClick={() => setSidebarOpen(true)} className="p-2">
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 768) && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r-4 border-indigo-100 flex flex-col md:relative md:translate-x-0 transition-all shadow-2xl md:shadow-none",
              !sidebarOpen && "hidden md:flex"
            )}
          >
            <FloatingElements />
            <div className="p-8 flex items-center justify-between shrink-0 relative z-10">
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand-primary/30 group-hover:rotate-12 transition-transform duration-300">
                  <BookOpen size={28} />
                </div>
                <div>
                  <h1 className="font-bold text-xl leading-none tracking-tight text-indigo-900">Do Zero</h1>
                  <p className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest mt-1">à Leitura</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-brand-secondary transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="px-6 mb-4">
              <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-4 text-white shadow-lg shadow-amber-500/20 flex items-center justify-between overflow-hidden relative group">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <Star key={completedDays.length} size={16} fill="currentColor" className="animate-star-pop" />
                    <span className="text-[10px] font-black uppercase tracking-wider opacity-80">Suas Estrelas</span>
                  </div>
                  <div className="text-3xl font-black">{completedDays.length}</div>
                </div>
                <div className="relative z-10 w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Award size={24} className="group-hover:scale-125 transition-transform" />
                </div>
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl"
                />
              </div>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
              <button
                onClick={() => {
                  setView('home');
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-4 rounded-[1.5rem] transition-all group",
                  view === 'home' 
                    ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-[1.02]" 
                    : "text-slate-600 hover:bg-indigo-50 hover:text-brand-primary"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl transition-colors",
                  view === 'home' ? "bg-white/20" : "bg-indigo-50 group-hover:bg-white"
                )}>
                  <HomeIcon size={20} />
                </div>
                <span className="text-sm font-bold">Introdução</span>
              </button>

              <div className="px-4 mt-8 mb-3 flex items-center gap-2">
                <div className="h-[2px] flex-1 bg-indigo-50"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Voz</span>
                <div className="h-[2px] flex-1 bg-indigo-50"></div>
              </div>
              
              <div className="px-2">
                <div className="bg-indigo-50/50 rounded-[2rem] p-4 border-2 border-indigo-100/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Modo de Áudio</span>
                    <motion.div 
                      animate={useIA ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      {useIA ? (
                        <span className="flex items-center gap-1 text-[9px] font-black text-white bg-brand-primary px-2 py-1 rounded-full shadow-sm">
                          <Star size={8} fill="currentColor" /> IA
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[9px] font-black text-white bg-brand-accent px-2 py-1 rounded-full shadow-sm">
                          <Zap size={8} fill="currentColor" /> RÁPIDO
                        </span>
                      )}
                    </motion.div>
                  </div>
                  <div className="flex bg-white/80 backdrop-blur-sm rounded-2xl p-1.5 border-2 border-indigo-100 shadow-inner">
                    <button 
                      onClick={() => setUseIA(false)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black transition-all",
                        !useIA ? "bg-brand-accent text-white shadow-md scale-[1.02]" : "text-indigo-300 hover:text-indigo-500"
                      )}
                    >
                      <Zap size={14} /> NATIVO
                    </button>
                    <button 
                      onClick={() => setUseIA(true)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black transition-all",
                        useIA ? "bg-brand-primary text-white shadow-md scale-[1.02]" : "text-indigo-300 hover:text-indigo-500"
                      )}
                    >
                      <Star size={14} /> IA
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-4 mt-8 mb-3 flex items-center gap-2">
                <div className="h-[2px] flex-1 bg-indigo-50"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Capítulos</span>
                <div className="h-[2px] flex-1 bg-indigo-50"></div>
              </div>
              
              <div className="space-y-1">
                {BOOK_CONTENT.chapters.map((chapter, idx) => (
                  <button
                    key={chapter.id}
                    onClick={() => {
                      setView('chapters');
                      setCurrentChapterId(chapter.id);
                      setSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left group",
                      view === 'chapters' && currentChapterId === chapter.id 
                        ? "bg-indigo-50 text-brand-primary font-bold border-2 border-brand-primary/20" 
                        : "text-slate-500 hover:bg-indigo-50/50 hover:text-indigo-700"
                    )}
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      view === 'chapters' && currentChapterId === chapter.id 
                        ? "bg-brand-primary scale-125" 
                        : [
                            "bg-indigo-100 group-hover:bg-indigo-300",
                            idx % 3 === 0 && "bg-rose-200",
                            idx % 3 === 1 && "bg-amber-200",
                            idx % 3 === 2 && "bg-cyan-200"
                          ]
                    )} />
                    <span className="text-xs font-bold line-clamp-1">{chapter.title}</span>
                  </button>
                ))}
              </div>

              <div className="px-4 mt-8 mb-3 flex items-center gap-2">
                <div className="h-[2px] flex-1 bg-indigo-50"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Jornada</span>
                <div className="h-[2px] flex-1 bg-indigo-50"></div>
              </div>

              <div className="space-y-2">
                {BOOK_CONTENT.phases.map((phase) => (
                  <button
                    key={phase.id}
                    onClick={() => {
                      setView('phase');
                      setCurrentPhaseId(phase.id);
                      setSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full flex flex-col gap-1 px-4 py-4 rounded-[1.5rem] transition-all group relative overflow-hidden",
                      view === 'phase' && currentPhaseId === phase.id 
                        ? "bg-brand-primary text-white shadow-xl shadow-brand-primary/30 scale-[1.02]" 
                        : "bg-white border-2 border-indigo-50 text-slate-600 hover:border-brand-primary/30 hover:bg-indigo-50/30"
                    )}
                  >
                    {view === 'phase' && currentPhaseId === phase.id && (
                      <motion.div 
                        layoutId="active-phase-bg"
                        className="absolute inset-0 bg-gradient-to-br from-brand-primary to-indigo-700 -z-10"
                      />
                    )}
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-sm",
                        view === 'phase' && currentPhaseId === phase.id ? "bg-white/20 text-white" : "bg-indigo-100 text-brand-primary"
                      )}>
                        {phase.id}
                      </div>
                      <span className="text-sm font-black leading-tight">{phase.title}</span>
                    </div>
                    <p className={cn(
                      "text-[10px] font-bold mt-1 ml-11",
                      view === 'phase' && currentPhaseId === phase.id ? "text-white/70" : "text-slate-400"
                    )}>
                      {phase.focus}
                    </p>
                  </button>
                ))}
              </div>

              <div className="px-3 mt-6 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Recursos Extras
              </div>
              <button
                onClick={() => {
                  setView('wordLists');
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all",
                  view === 'wordLists' ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <Package size={20} />
                <span className="text-sm font-semibold">Listas de Palavras</span>
              </button>
              <button
                onClick={() => {
                  setView('stories');
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all",
                  view === 'stories' ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <BookOpen size={20} />
                <span className="text-sm font-semibold">Histórias para Praticar</span>
              </button>
              
              <div className="px-3 mt-6 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Informações
              </div>
              <button onClick={() => { setView('milestones'); setSidebarOpen(false); }} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm", view === 'milestones' ? "text-brand-primary font-bold" : "text-slate-600")}>Marcos de Desenvolvimento</button>
              <button onClick={() => { setView('specialSounds'); setSidebarOpen(false); }} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm", view === 'specialSounds' ? "text-brand-primary font-bold" : "text-slate-600")}>Sons Especiais (NH, LH, CH...)</button>
              <button onClick={() => { setView('faq'); setSidebarOpen(false); }} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm", view === 'faq' ? "text-brand-primary font-bold" : "text-slate-600")}>FAQ</button>
              <button onClick={() => { setView('glossary'); setSidebarOpen(false); }} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm", view === 'glossary' ? "text-brand-primary font-bold" : "text-slate-600")}>Glossário</button>
              <button onClick={() => { setView('science'); setSidebarOpen(false); }} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm", view === 'science' ? "text-brand-primary font-bold" : "text-slate-600")}>Base Científica</button>
              <button onClick={() => { setView('finalWord'); setSidebarOpen(false); }} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm mt-4 border-t border-black/5 pt-4", view === 'finalWord' ? "text-brand-primary font-bold" : "text-slate-600")}>Palavra Final</button>
            </nav>

            <div className="p-6 border-top border-black/5 shrink-0">
              <div className="bg-slate-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500">Progresso Geral</span>
                  <span className="text-xs font-bold text-brand-primary">
                    {Math.round((completedDays.length / 90) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-brand-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${(completedDays.length / 90) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-16 relative">
        <FloatingElements />
        <div className="max-w-4xl mx-auto relative z-10">
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4"
              >
                <div className={cn(
                  "p-4 rounded-2xl shadow-2xl flex items-center gap-3 border",
                  toast.type === 'error' ? "bg-red-50 border-red-100 text-red-800" : "bg-emerald-50 border-emerald-100 text-emerald-800"
                )}>
                  <AlertCircle size={20} />
                  <p className="text-sm font-bold">{toast.message}</p>
                  <button onClick={() => setToast(null)} className="ml-auto p-1 hover:bg-black/5 rounded-lg">
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait">
            {view === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-8"
              >
                <div className="text-center mb-12">
                  <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-rose-100 text-rose-600 text-sm font-bold uppercase tracking-widest mb-6 shadow-sm"
                  >
                    <Heart size={16} fill="currentColor" className="animate-pulse" />
                    Bem-vinda, Mãe
                  </motion.div>
                  <h2 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight">
                    {BOOK_CONTENT.introduction.title}
                  </h2>
                </div>

                <div className="card p-8 md:p-12 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50" />
                  <div className="markdown-body prose prose-slate prose-lg max-w-none relative z-10">
                    <Markdown remarkPlugins={[remarkGfm]}>{BOOK_CONTENT.introduction.content}</Markdown>
                  </div>
                  
                  <div className="mt-12 flex flex-col items-center gap-6 relative z-10">
                    <button 
                      onClick={() => {
                        setView('phase');
                        setCurrentPhaseId(1);
                      }}
                      className="btn-primary text-xl px-16 py-5 flex items-center gap-4 group"
                    >
                      Começar Jornada <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
                    </button>
                    <p className="text-base text-slate-400 font-medium flex items-center gap-2">
                      <Sparkles size={18} className="text-amber-400" />
                      Apenas 15-20 minutos por dia mudam tudo.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    { title: "Consistência", desc: "Sessões curtas e frequentes são a chave.", icon: Clock, color: "bg-indigo-100 text-indigo-600" },
                    { title: "Lúdico", desc: "Transforme cada lição em uma brincadeira.", icon: Sparkles, color: "bg-amber-100 text-amber-600" },
                    { title: "Amor", desc: "O vínculo emocional acelera o aprendizado.", icon: Heart, color: "bg-rose-100 text-rose-600" },
                  ].map((item, i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ scale: 1.05 }}
                      className="card text-center p-8"
                    >
                      <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner", item.color)}>
                        <item.icon size={32} />
                      </div>
                      <h4 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {view === 'chapters' && (
              <motion.div
                key={currentChapterId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-brand-primary rounded-3xl flex items-center justify-center text-white shadow-xl shadow-brand-primary/20">
                    <BookOpen size={32} />
                  </div>
                  <h2 className="text-4xl font-bold text-slate-900 tracking-tight">{currentChapter.title}</h2>
                </div>

                {currentChapterId === 'c5' ? (
                  <div className="space-y-8">
                    <div className="card p-8 bg-gradient-to-br from-white to-indigo-50/30">
                      <h3 className="text-2xl font-bold text-brand-primary mb-6 flex items-center gap-3">
                        <Sparkles className="text-brand-accent" />
                        Sons Mágicos: NH, LH e CH
                      </h3>
                      <div className="grid md:grid-cols-3 gap-6">
                        {[
                          { digraph: 'NH', sound: '/nh/', examples: ['NHOQUE', 'ANHA', 'MINHA'], desc: 'Som de afago: nhhh', color: 'bg-rose-50 border-rose-100 text-rose-600' },
                          { digraph: 'LH', sound: '/lh/', examples: ['FILHO', 'PALHA', 'OLHO'], desc: 'Língua no céu da boca', color: 'bg-indigo-50 border-indigo-100 text-indigo-600' },
                          { digraph: 'CH', sound: '/x/', examples: ['CHAVE', 'ACHO', 'CHUVA'], desc: 'Som de vento: xhhh', color: 'bg-cyan-50 border-cyan-100 text-cyan-600' }
                        ].map((item, i) => (
                          <motion.div 
                            key={i}
                            whileHover={{ y: -5 }}
                            className={cn("p-6 rounded-[2.5rem] border-4 flex flex-col items-center text-center shadow-sm", item.color)}
                          >
                            <div className="text-5xl font-black mb-2">{item.digraph}</div>
                            <div className="text-xs font-bold uppercase tracking-widest opacity-60 mb-4">{item.sound}</div>
                            <p className="text-sm font-bold mb-6 italic">"{item.desc}"</p>
                            <div className="flex flex-wrap justify-center gap-2">
                              {item.examples.map(ex => (
                                <WordButton key={ex} word={ex} useIA={useIA} className="py-2 px-3 text-[10px] bg-white/50 border-white" />
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="card p-8 border-l-8 border-brand-accent">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">RR e SS: Os Fortões</h3>
                        <div className="space-y-4">
                          <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-100">
                            <span className="font-black text-brand-accent text-2xl mr-3">RR</span>
                            <span className="text-slate-600 font-medium italic">Som forte e vibrante (CARRO, TERRA)</span>
                          </div>
                          <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-100">
                            <span className="font-black text-brand-accent text-2xl mr-3">SS</span>
                            <span className="text-slate-600 font-medium italic">Som de /s/ entre vogais (OSSO, PASSO)</span>
                          </div>
                        </div>
                      </div>
                      <div className="card p-8 border-l-8 border-brand-cyan">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">O Mistério do QU e GU</h3>
                        <div className="space-y-3">
                          {[
                            { label: 'QU + E/I', desc: 'U fica mudo (QUEIJO)', color: 'text-brand-cyan' },
                            { label: 'QU + A/O', desc: 'U aparece (QUANDO)', color: 'text-brand-cyan' },
                            { label: 'GU + E/I', desc: 'U fica mudo (GUERRA)', color: 'text-brand-cyan' },
                            { label: 'GU + A/O', desc: 'U aparece (ÁGUA)', color: 'text-brand-cyan' }
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm">
                              <div className={cn("font-black w-20", item.color)}>{item.label}</div>
                              <div className="text-slate-500 font-medium">{item.desc}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : currentChapterId === 'c9' ? (
                  <div className="space-y-12">
                    <div className="card p-8 bg-white border-b-8 border-brand-primary">
                      <p className="text-lg text-slate-600 leading-relaxed mb-8">
                        {currentChapter.content}
                      </p>
                      
                      <div className="space-y-6">
                        {[
                          { period: 'Semanas 1-3', phase: 'Fase 1', goal: 'Rima com facilidade, bate sílabas, identifica sons iniciais.', check: 'A criança ri e brinca com os sons sem esforço aparente.', color: 'border-rose-200 bg-rose-50/30' },
                          { period: 'Semanas 4-6', phase: 'Fase 2', goal: 'Conhece os sons de 15+ letras, lê as primeiras sílabas e palavras simples.', check: 'Consegue ler MATO, PATO, DADO sem ajuda, mesmo que devagar.', color: 'border-amber-200 bg-amber-50/30' },
                          { period: 'Semanas 7-10', phase: 'Fase 3', goal: 'Lê palavras de 2 a 3 sílabas, começa a ler frases curtas.', check: 'Lê um bilhetinho simples e entende o que está escrito.', color: 'border-emerald-200 bg-emerald-50/30' },
                          { period: 'Semanas 11-12', phase: 'Fase 4', goal: 'Lê pequenos textos, começa a ganhar fluência.', check: 'Lê uma história de 8 frases em voz alta com poucos erros.', color: 'border-indigo-200 bg-indigo-50/30' },
                          { period: 'Meses 4-6', phase: 'Pós-método', goal: 'Leitura mais fluida, vocabulário em expansão, interesse em livros cresce.', check: 'Escolhe pegar um livro por conta própria para ler.', color: 'border-purple-200 bg-purple-50/30' },
                          { period: 'Meses 7-12', phase: 'Pós-método', goal: 'Leitura independente consolidada, compreensão em desenvolvimento.', check: 'Conta o que leu com suas próprias palavras.', color: 'border-cyan-200 bg-cyan-50/30' }
                        ].map((item, i) => (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={cn("p-6 rounded-3xl border-2 flex flex-col md:flex-row gap-6 items-start md:items-center", item.color)}
                          >
                            <div className="shrink-0">
                              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{item.period}</div>
                              <div className="text-xl font-black text-slate-800">{item.phase}</div>
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-bold text-slate-700 mb-1">O que esperar:</div>
                              <div className="text-sm text-slate-600">{item.goal}</div>
                            </div>
                            <div className="flex-1 p-4 bg-white/60 rounded-2xl border border-white shadow-sm">
                              <div className="text-xs font-bold text-emerald-600 mb-1 flex items-center gap-2">
                                <CheckCircle2 size={14} /> Como saber se está indo bem:
                              </div>
                              <div className="text-sm italic text-slate-600">{item.check}</div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {currentChapter.sections?.map((section, i) => (
                      <div key={i} className="card p-8 border-l-8 border-brand-accent bg-amber-50/20">
                        <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                          <AlertCircle className="text-brand-accent" />
                          {section.title}
                        </h3>
                        <div className="markdown-body text-slate-600 leading-relaxed">
                          <Markdown remarkPlugins={[remarkGfm]}>{section.content}</Markdown>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="card p-8 md:p-12">
                    <div className="markdown-body prose prose-slate prose-lg max-w-none mb-12">
                      <Markdown remarkPlugins={[remarkGfm]}>{currentChapter.content}</Markdown>
                    </div>
                    <div className="space-y-12">
                      {currentChapter.sections?.map((section, i) => (
                        <div key={i} className="border-l-8 border-indigo-50 pl-8 relative">
                          <div className="absolute -left-[10px] top-0 w-4 h-4 rounded-full bg-brand-primary shadow-lg shadow-brand-primary/30" />
                          <h3 className="text-2xl font-bold text-slate-800 mb-4 tracking-tight">{section.title}</h3>
                          <div className="markdown-body text-slate-600 leading-relaxed">
                            <Markdown remarkPlugins={[remarkGfm]}>{section.content}</Markdown>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {view === 'phase' && (
              <motion.div
                key={currentPhaseId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <div className="mb-12">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-accent/10 text-brand-accent text-[10px] font-bold uppercase tracking-widest mb-4">
                    <Star size={12} fill="currentColor" />
                    Fase {currentPhase.id}
                  </div>
                  <h2 className="text-5xl md:text-6xl font-serif font-semibold text-slate-900 mb-4 tracking-tight">
                    {currentPhase.title}
                  </h2>
                  <p className="text-xl text-slate-500 font-serif italic mb-8">
                    {currentPhase.subtitle}
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="card">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">O que é?</h3>
                      <div className="markdown-body text-slate-600 leading-relaxed">
                        <Markdown remarkPlugins={[remarkGfm]}>{currentPhase.description}</Markdown>
                      </div>
                    </div>
                    <div className="card">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Objetivos</h3>
                      <ul className="space-y-3">
                        {currentPhase.learningGoals.map((goal, i) => (
                          <li key={i} className="flex items-center gap-3 text-slate-700">
                            <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                              <CheckCircle2 size={14} />
                            </div>
                            <span className="text-sm font-medium">{goal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Interactive Phase Tools */}
                  {currentPhaseId === 1 && <RhymeExplorer useIA={useIA} />}
                  {currentPhaseId === 2 && <SoundBoard useIA={useIA} />}
                  {currentPhaseId === 3 && <SyllableBuilder useIA={useIA} />}
                  {currentPhaseId === 4 && (
                    <div className="mt-8 space-y-4">
                      <h3 className="font-bold text-slate-900">Prática de Leitura</h3>
                      <StoryReader story={BOOK_CONTENT.stories[0]} useIA={useIA} />
                    </div>
                  )}
                </div>

                <div className="space-y-12">
                  {currentPhase.weeks.map((week) => (
                    <div key={week.number}>
                      <div className="flex items-center gap-4 mb-6">
                        <h3 className="text-2xl font-serif font-bold">Semana {week.number}: {week.title}</h3>
                        <div className="flex-1 h-px bg-slate-200" />
                      </div>
                      
                      <div className="grid gap-4">
                        {week.activities.map((activity) => (
                          <ActivityRow 
                            key={activity.id} 
                            activity={activity} 
                            isCompleted={completedDays.includes(activity.day)}
                            onToggle={() => toggleDay(activity.day)}
                            useIA={useIA}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {view === 'wordLists' && (
              <motion.div
                key="wordLists"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <h2 className="text-4xl font-serif font-bold text-slate-900 mb-8">Listas de Palavras por Fase</h2>
                
                <div className="space-y-12">
                  <section>
                    <h3 className="text-xl font-bold text-brand-primary mb-4">Fase 2: Palavras com M, P, B, T, D, N</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {BOOK_CONTENT.wordLists.phase2.map(word => (
                        <WordButton key={word} word={word} useIA={useIA} />
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xl font-bold text-brand-primary mb-4">Fase 3: Palavras com S, F, V, L, R, C, G, J, Z</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {BOOK_CONTENT.wordLists.phase3.map(word => (
                        <WordButton key={word} word={word} useIA={useIA} />
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xl font-bold text-brand-primary mb-4">Palavras de Alta Frequência</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {BOOK_CONTENT.wordLists.highFrequency.map(word => (
                        <WordButton key={word} word={word} useIA={useIA} className="p-3 text-sm font-medium text-slate-600" />
                      ))}
                    </div>
                  </section>

                  {BOOK_CONTENT.wordLists.fluencyPhrases && (
                    <section>
                      <h3 className="text-xl font-bold text-brand-primary mb-4">Fase 4: Frases para Praticar Fluência</h3>
                      <div className="space-y-3">
                        {BOOK_CONTENT.wordLists.fluencyPhrases.map((phrase, i) => (
                          <div key={i} className="card p-4 flex items-center gap-4 hover:border-brand-primary/30 transition-colors group">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                              {i + 1}
                            </div>
                            <p className="text-lg text-slate-700 font-medium">{phrase}</p>
                            <WordButton word={phrase} useIA={useIA} className="ml-auto p-2" iconOnly />
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </motion.div>
            )}

            {view === 'stories' && (
              <motion.div
                key="stories"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <h2 className="text-4xl font-serif font-bold text-slate-900 mb-8">Histórias para Praticar</h2>
                <div className="grid gap-8">
                  {BOOK_CONTENT.stories.map((story, i) => (
                    <StoryReader key={i} story={story} useIA={useIA} />
                  ))}
                </div>
              </motion.div>
            )}

            {view === 'milestones' && (
              <motion.div key="milestones" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <h2 className="text-4xl font-serif font-bold text-slate-900 mb-8">Marcos de Desenvolvimento</h2>
                <div className="grid gap-4">
                  {BOOK_CONTENT.milestones?.map((milestone, i) => (
                    <div key={i} className="card flex items-center gap-6 p-6">
                      <div className="w-20 h-20 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary font-bold shrink-0">
                        {milestone.month}
                      </div>
                      <p className="text-lg text-slate-700 font-medium">{milestone.goal}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {view === 'specialSounds' && (
              <motion.div key="specialSounds" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <h2 className="text-4xl font-serif font-bold text-slate-900 mb-8">Sons Especiais</h2>
                <div className="grid gap-6">
                  {BOOK_CONTENT.specialSounds?.map((item, i) => (
                    <div key={i} className="card p-8">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="text-4xl font-bold text-brand-primary">{item.digraph}</div>
                        <div className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-500">{item.sound}</div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Exemplos</span>
                          <div className="flex flex-wrap gap-2">
                            {item.examples.split(', ').map(ex => (
                              <WordButton key={ex} word={ex} useIA={useIA} className="py-2 px-4 text-sm" />
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Como Ensinar</span>
                          <p className="text-slate-600">{item.howToTeach}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {view === 'finalWord' && (
              <motion.div key="finalWord" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="text-center mb-12">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-widest mb-6">
                    <Award size={14} fill="currentColor" />
                    Parabéns pela Jornada
                  </div>
                  <h2 className="text-5xl md:text-7xl font-serif font-semibold text-slate-900 mb-6 tracking-tight">
                    {BOOK_CONTENT.finalWord?.title}
                  </h2>
                </div>
                <div className="card p-8 md:p-12">
                  <div className="markdown-body prose prose-slate prose-lg max-w-none">
                    <Markdown remarkPlugins={[remarkGfm]}>{BOOK_CONTENT.finalWord?.content}</Markdown>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'faq' && (
              <motion.div key="faq" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <h2 className="text-4xl font-serif font-bold text-slate-900 mb-8">Perguntas Frequentes</h2>
                {BOOK_CONTENT.faq.map((item, i) => (
                  <div key={i} className="card">
                    <h4 className="font-bold text-slate-900 mb-2">{item.question}</h4>
                    <p className="text-slate-600">{item.answer}</p>
                  </div>
                ))}
              </motion.div>
            )}

            {view === 'glossary' && (
              <motion.div key="glossary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <h2 className="text-4xl font-serif font-bold text-slate-900 mb-8">Glossário de Termos</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {BOOK_CONTENT.glossary.map((item, i) => (
                    <div key={i} className="card">
                      <h4 className="font-bold text-brand-primary mb-1">{item.term}</h4>
                      <p className="text-sm text-slate-600">{item.definition}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {view === 'science' && (
              <motion.div key="science" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <h2 className="text-4xl font-serif font-bold text-slate-900 mb-4">{BOOK_CONTENT.scientificBasis.title}</h2>
                <div className="card p-8">
                  <div className="markdown-body text-lg text-slate-600 mb-8">
                    <Markdown remarkPlugins={[remarkGfm]}>{BOOK_CONTENT.scientificBasis.content}</Markdown>
                  </div>
                  <h4 className="font-bold text-slate-800 mb-4">Principais Referências:</h4>
                  <ul className="space-y-3">
                    {BOOK_CONTENT.scientificBasis.references.map((ref, i) => (
                      <li key={i} className="text-sm text-slate-500 border-l-2 border-slate-200 pl-4">{ref}</li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function ActivityRow({ 
  activity, 
  isCompleted, 
  onToggle,
  useIA
}: { 
  activity: Activity; 
  isCompleted: boolean; 
  onToggle: () => void;
  useIA: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await speakText(`Atividade: ${activity.title}. ${activity.description}`, useIA);
    } catch (error: any) {
      console.error("Failed to play audio", error);
      const isQuotaError = error?.message?.toLowerCase().includes('quota') || 
                          error?.message?.toLowerCase().includes('429');
      
      if (isQuotaError) {
        window.dispatchEvent(new CustomEvent('app-error', { 
          detail: 'Límite de audio alcanzado. Por favor, espera unos minutos antes de volver a intentarlo.' 
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn(
      "group relative flex flex-col md:flex-row md:items-center gap-6 p-6 rounded-[2rem] border-2 transition-all cursor-pointer",
      isCompleted 
        ? "bg-emerald-50 border-emerald-200 shadow-inner" 
        : "bg-white border-indigo-50 hover:border-brand-primary hover:shadow-xl hover:-translate-y-1"
    )} onClick={onToggle}>
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0 transition-all shadow-lg relative",
        isCompleted ? "bg-emerald-500 text-white rotate-12" : "bg-indigo-50 text-indigo-500 group-hover:bg-brand-primary group-hover:text-white group-hover:-rotate-12"
      )}>
        {isCompleted ? <CheckCircle2 size={28} /> : activity.day}
        {isCompleted && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-amber-400 text-white p-1 rounded-full shadow-md border-2 border-white"
          >
            <Star size={12} fill="currentColor" />
          </motion.div>
        )}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h4 className={cn(
            "text-lg font-bold transition-colors",
            isCompleted ? "text-emerald-700" : "text-slate-900"
          )}>
            {activity.title}
          </h4>
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full",
            isCompleted ? "bg-emerald-100 text-emerald-600" : "bg-indigo-50 text-indigo-500"
          )}>
            {activity.duration}
          </span>
        </div>
        <p className={cn(
          "text-sm leading-relaxed",
          isCompleted ? "text-emerald-600/80" : "text-slate-500"
        )}>
          {activity.description}
        </p>
      </div>

      <div className="flex items-center gap-8 md:pl-8 md:border-l-2 border-indigo-50">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Material</span>
          <span className={cn(
            "text-xs font-bold",
            isCompleted ? "text-emerald-600" : "text-slate-600"
          )}>{activity.material}</span>
        </div>
        <button 
          onClick={handlePlay}
          disabled={isLoading}
          className={cn(
            "w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all shadow-sm",
            isLoading 
              ? "text-brand-primary bg-indigo-50 border-brand-primary" 
              : isCompleted
                ? "text-emerald-500 border-emerald-200 hover:bg-emerald-100"
                : "text-slate-400 border-indigo-50 hover:text-brand-primary hover:border-brand-primary hover:bg-indigo-50"
          )}
          title="Ouvir instrução"
        >
          {isLoading ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <PlayCircle size={24} />
          )}
        </button>
      </div>
    </div>
  );
}
