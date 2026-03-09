import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
        "relative p-4 bg-white rounded-2xl border border-black/5 font-bold text-slate-700 transition-all text-center flex items-center justify-center",
        isLoading ? "border-brand-primary bg-brand-primary/5" : "hover:border-brand-primary",
        iconOnly && "p-2 rounded-full",
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
    const newCompleted = completedDays.includes(day)
      ? completedDays.filter(d => d !== day)
      : [...completedDays, day];
    setCompletedDays(newCompleted);
    localStorage.setItem('completedDays', JSON.stringify(newCompleted));
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
              "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-black/5 flex flex-col md:relative md:translate-x-0",
              !sidebarOpen && "hidden md:flex"
            )}
          >
            <div className="p-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h1 className="font-bold text-lg leading-none tracking-tight">Do Zero</h1>
                  <p className="text-xs text-slate-400 mt-1">à Leitura em 90 Dias</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2">
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
              <button
                onClick={() => {
                  setView('home');
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all",
                  view === 'home' ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <HomeIcon size={20} />
                <span className="text-sm font-semibold">Introdução</span>
              </button>

              <div className="px-3 mt-6 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Configurações de Voz
              </div>
              <div className="px-3 py-2">
                <div className="bg-slate-50 rounded-2xl p-3 border border-black/5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Modo de Áudio</span>
                    {useIA ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">
                        <Star size={10} fill="currentColor" /> PREMIUM
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                        <Zap size={10} fill="currentColor" /> RÁPIDO
                      </span>
                    )}
                  </div>
                  <div className="flex bg-white rounded-xl p-1 border border-black/5">
                    <button 
                      onClick={() => setUseIA(false)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold transition-all",
                        !useIA ? "bg-orange-500 text-white shadow-sm" : "text-slate-400 hover:bg-slate-50"
                      )}
                    >
                      <Zap size={12} /> NATIVO
                    </button>
                    <button 
                      onClick={() => setUseIA(true)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold transition-all",
                        useIA ? "bg-brand-primary text-white shadow-sm" : "text-slate-400 hover:bg-slate-50"
                      )}
                    >
                      <Star size={12} /> IA
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2 leading-tight">
                    {useIA 
                      ? "Voz humana de alta qualidade (pode demorar 1-2s)." 
                      : "Voz instantânea do sistema (sem espera)."}
                  </p>
                </div>
              </div>

              <div className="px-3 mt-6 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Capítulos Teóricos
              </div>
              {BOOK_CONTENT.chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => {
                    setView('chapters');
                    setCurrentChapterId(chapter.id);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left",
                    view === 'chapters' && currentChapterId === chapter.id 
                      ? "bg-brand-primary/10 text-brand-primary font-bold" 
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <span className="text-xs line-clamp-1">{chapter.title}</span>
                </button>
              ))}

              <div className="px-3 mt-6 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Fases do Método
              </div>
              {BOOK_CONTENT.phases.map((phase) => (
                <button
                  key={phase.id}
                  onClick={() => {
                    setView('phase');
                    setCurrentPhaseId(phase.id);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all group",
                    view === 'phase' && currentPhaseId === phase.id 
                      ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20" 
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                    view === 'phase' && currentPhaseId === phase.id ? "bg-white/20" : "bg-slate-100"
                  )}>
                    {phase.id}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold leading-tight">{phase.title}</p>
                    <p className={cn(
                      "text-[10px] mt-0.5",
                      view === 'phase' && currentPhaseId === phase.id ? "text-white/70" : "text-slate-400"
                    )}>
                      {phase.focus}
                    </p>
                  </div>
                </button>
              ))}

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
      <main className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-16">
        <div className="max-w-4xl mx-auto">
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="text-center mb-12">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-widest mb-6">
                    <Heart size={14} fill="currentColor" />
                    Bem-vinda, Mãe
                  </div>
                  <h2 className="text-5xl md:text-7xl font-serif font-semibold text-slate-900 mb-6 tracking-tight">
                    {BOOK_CONTENT.introduction.title}
                  </h2>
                </div>

                <div className="card p-8 md:p-12">
                  <div className="prose prose-slate prose-lg max-w-none">
                    {BOOK_CONTENT.introduction.content.split('\n\n').map((para, i) => (
                      <p key={i} className="text-slate-600 leading-relaxed mb-6 font-serif text-xl italic">
                        {para}
                      </p>
                    ))}
                  </div>
                  
                  <div className="mt-12 flex flex-col items-center gap-6">
                    <button 
                      onClick={() => {
                        setView('phase');
                        setCurrentPhaseId(1);
                      }}
                      className="btn-primary text-lg px-12 py-4 flex items-center gap-3"
                    >
                      Começar Jornada <ChevronRight size={20} />
                    </button>
                    <p className="text-sm text-slate-400 font-medium">
                      Apenas 15-20 minutos por dia mudam tudo.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    { title: "Consistência", desc: "Sessões curtas e frequentes são a chave.", icon: Clock },
                    { title: "Lúdico", desc: "Transforme cada lição em uma brincadeira.", icon: Sparkles },
                    { title: "Amor", desc: "O vínculo emocional acelera o aprendizado.", icon: Heart },
                  ].map((item, i) => (
                    <div key={i} className="card text-center">
                      <div className="w-12 h-12 bg-brand-bg rounded-2xl flex items-center justify-center text-brand-primary mx-auto mb-4">
                        <item.icon size={24} />
                      </div>
                      <h4 className="font-bold text-slate-900 mb-2">{item.title}</h4>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
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
                <h2 className="text-4xl font-serif font-bold text-slate-900 mb-4">{currentChapter.title}</h2>
                <div className="card p-8">
                  <p className="text-lg text-slate-600 mb-8 leading-relaxed">{currentChapter.content}</p>
                  <div className="space-y-12">
                    {currentChapter.sections?.map((section, i) => (
                      <div key={i} className="border-l-4 border-brand-primary/20 pl-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-3">{section.title}</h3>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{section.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
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
                      <p className="text-slate-600 leading-relaxed">
                        {currentPhase.description}
                      </p>
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
                  <div className="prose prose-slate prose-lg max-w-none">
                    {BOOK_CONTENT.finalWord?.content.split('\n\n').map((para, i) => (
                      <p key={i} className="text-slate-600 leading-relaxed mb-6 font-serif text-xl italic">
                        {para}
                      </p>
                    ))}
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
                  <p className="text-lg text-slate-600 mb-8">{BOOK_CONTENT.scientificBasis.content}</p>
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
      "group relative flex flex-col md:flex-row md:items-center gap-4 p-5 rounded-3xl border transition-all cursor-pointer",
      isCompleted 
        ? "bg-emerald-50/50 border-emerald-100" 
        : "bg-white border-black/5 hover:border-brand-primary/30 hover:shadow-md"
    )} onClick={onToggle}>
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0 transition-colors",
        isCompleted ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-brand-primary group-hover:text-white"
      )}>
        {isCompleted ? <CheckCircle2 size={24} /> : activity.day}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className={cn(
            "font-bold transition-colors",
            isCompleted ? "text-emerald-700" : "text-slate-900"
          )}>
            {activity.title}
          </h4>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full">
            {activity.duration}
          </span>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed">
          {activity.description}
        </p>
      </div>

      <div className="flex items-center gap-6 md:pl-6 md:border-l border-black/5">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Material</span>
          <span className="text-xs font-medium text-slate-600">{activity.material}</span>
        </div>
        <button 
          onClick={handlePlay}
          disabled={isLoading}
          className={cn(
            "w-10 h-10 rounded-full border border-black/5 flex items-center justify-center transition-all",
            isLoading 
              ? "text-brand-primary bg-brand-primary/5 border-brand-primary/30" 
              : "text-slate-400 hover:text-brand-primary hover:border-brand-primary/30 hover:bg-brand-primary/5"
          )}
          title="Ouvir instrução"
        >
          {isLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <PlayCircle size={20} />
          )}
        </button>
      </div>
    </div>
  );
}
