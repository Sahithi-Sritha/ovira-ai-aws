'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Send, ArrowLeft, Sparkles, AlertCircle, User, Bot } from 'lucide-react';
import Link from 'next/link';
import { getCurrentCycleInfo } from '@/lib/utils/cycle-analysis';
import { formatDate } from '@/lib/utils';
// @ts-ignore — motion/react types not resolving with bundler moduleResolution, runtime is fine
import { motion, AnimatePresence } from 'motion/react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    slmUsed?: boolean;
}

// ─── Thinking steps ───────────────────────────────────────────────────────────

const THINKING_STEPS = [
    { icon: '🧠', label: 'Reading Health Profile…'          },
    { icon: '📄', label: 'Reading Uploaded Reports…'        },
    { icon: '📚', label: 'Searching WHO Knowledge Base…'    },
    { icon: '🔍', label: 'Retrieving Similar Medical Context…' },
    { icon: '🤖', label: 'Selecting AI Model…'              },
    { icon: '✍️',  label: 'Generating Personalised Response…' },
] as const;

// Each step auto-advances every N ms (last step stays until response arrives)
const STEP_DURATION = 900; // ms per step


// ─── ThinkingIndicator component ─────────────────────────────────────────────

function ThinkingIndicator({ visible }: { visible: boolean }) {
    const [stepIndex, setStepIndex] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Reset and advance steps whenever visible turns true
    useEffect(() => {
        if (!visible) {
            setStepIndex(0);
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }
        setStepIndex(0);
        timerRef.current = setInterval(() => {
            setStepIndex(prev => {
                // Stop advancing at last step — stays until visible→false
                if (prev >= THINKING_STEPS.length - 1) {
                    clearInterval(timerRef.current!);
                    return prev;
                }
                return prev + 1;
            });
        }, STEP_DURATION);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [visible]);

    // Progress: 0→1 based on stepIndex
    const progress = (stepIndex + 1) / THINKING_STEPS.length;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    key="thinking"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6, transition: { duration: 0.3 } }}
                    transition={{ duration: 0.25 }}
                    className="flex gap-3 justify-start"
                >
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot size={16} className="text-white" />
                    </div>

                    {/* Thinking card */}
                    <div className="bg-surface-elevated border border-border/60 rounded-2xl rounded-tl-sm p-4 min-w-[260px] max-w-xs space-y-3">

                        {/* Step list */}
                        <div className="space-y-2">
                            {THINKING_STEPS.map((step, i) => {
                                const isDone    = i < stepIndex;
                                const isActive  = i === stepIndex;
                                const isPending = i > stepIndex;

                                return (
                                    <motion.div
                                        key={step.label}
                                        initial={false}
                                        animate={{
                                            opacity: isPending ? 0.35 : 1,
                                        }}
                                        transition={{ duration: 0.3 }}
                                        className="flex items-center gap-2.5"
                                    >
                                        {/* Icon / checkmark */}
                                        <span className="text-base leading-none w-5 text-center shrink-0">
                                            {isDone ? (
                                                <motion.span
                                                    key="check"
                                                    initial={{ scale: 0.5, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className="text-emerald-500 text-sm"
                                                >
                                                    ✓
                                                </motion.span>
                                            ) : step.icon}
                                        </span>

                                        {/* Label */}
                                        <span className={`text-xs font-medium transition-colors ${
                                            isDone   ? 'text-muted-foreground line-through' :
                                            isActive ? 'text-text-primary' :
                                                       'text-muted-foreground'
                                        }`}>
                                            {step.label}
                                        </span>

                                        {/* Active pulse dot */}
                                        {isActive && (
                                            <motion.span
                                                className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0"
                                                animate={{ opacity: [1, 0.2, 1] }}
                                                transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                                            />
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Progress bar */}
                        <div className="h-1 w-full rounded-full bg-border overflow-hidden">
                            <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                                initial={{ width: '0%' }}
                                animate={{ width: `${progress * 100}%` }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}


// ─── Starter questions ────────────────────────────────────────────────────────

const STARTER_QUESTIONS = [
    "What are common PMS symptoms?",
    "How can I manage period cramps?",
    "When should I see a doctor?",
    "What is a normal cycle length?",
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ChatPage() {
    const { user, userProfile } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput]       = useState('');
    const [loading, setLoading]   = useState(false);
    const [contextTags, setContextTags] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(() => { scrollToBottom(); }, [messages, loading]);

    // Fetch context tags for the header strip
    useEffect(() => {
        const fetchContext = async () => {
            if (!user) return;
            try {
                const res  = await fetch(`/api/context?userId=${user.username}`);
                const data = await res.json();
                if (data.success && data.context) {
                    const tags: string[] = [];
                    if (data.context.profile.conditions?.length) tags.push(...data.context.profile.conditions);
                    if (data.context.profile.diet)                tags.push(data.context.profile.diet);
                    if (data.context.profile.cycleLength)         tags.push(`Cycle: ${data.context.profile.cycleLength} days`);
                    if (data.context.documents?.length)           data.context.documents.forEach((d: any) => tags.push(`📄 ${d.category}`));
                    setContextTags(tags);
                }
            } catch (e) { console.error(e); }
        };
        fetchContext();
    }, [user]);

    // Build health summary for AI (unchanged)
    const [healthSummary, setHealthSummary] = useState('');
    useEffect(() => {
        const build = async () => {
            if (!user) return;
            try {
                const res  = await fetch(`/api/symptoms?userId=${user.username}&limit=100`);
                const data = await res.json();
                if (!data.success || !data.logs) return;
                const logs = data.logs as Array<{ date: string; flowLevel: string; painLevel: number; mood: string; energyLevel: string; symptoms: string[]; notes?: string; [key: string]: any }>;
                let profileLastPeriod: Date | null = null;
                if (userProfile?.lastPeriodStart) {
                    const lps = userProfile.lastPeriodStart as any;
                    profileLastPeriod = typeof lps === 'string' ? new Date(lps) : lps?.toDate?.() ?? null;
                }
                const cycleInfo   = getCurrentCycleInfo(logs, profileLastPeriod, (userProfile as any)?.averageCycleLength);
                const recentLogs  = logs.slice(0, 7);
                const recentSymptoms: string[] = []; let totalPain = 0; let painCount = 0; const moods: string[] = []; const flowLevels: string[] = [];
                for (const log of recentLogs) {
                    if (log.symptoms?.length) recentSymptoms.push(...log.symptoms);
                    if (log.painLevel != null) { totalPain += log.painLevel; painCount++; }
                    if (log.mood) moods.push(log.mood);
                    if (log.flowLevel && log.flowLevel !== 'none') flowLevels.push(log.flowLevel);
                }
                const avgPain         = painCount > 0 ? (totalPain / painCount).toFixed(1) : 'N/A';
                const uniqueSymptoms  = [...new Set(recentSymptoms)];
                const nextFormatted   = formatDate(cycleInfo.nextPeriodDate);
                let s = `USER HEALTH PROFILE:\n- Name: ${userProfile?.displayName || 'Unknown'}\n- Age: ${userProfile?.ageRange || 'Unknown'}\n`;
                if (userProfile?.conditions?.length) s += `- Conditions: ${userProfile.conditions.join(', ')}\n`;
                s += `\nCYCLE: Day ${cycleInfo.cycleDay} of ${cycleInfo.avgCycleLength}, ${cycleInfo.currentPhase} phase, next ~${nextFormatted}\n`;
                s += `RECENT: avg pain ${avgPain}/10, moods: ${moods.slice(0,3).join(', ')}\n`;
                if (uniqueSymptoms.length) s += `Symptoms: ${uniqueSymptoms.join(', ')}\n`;
                setHealthSummary(s);
            } catch (e) { console.error(e); }
        };
        build();
    }, [user, userProfile]);


    const sendMessage = async (content: string) => {
        if (!content.trim() || loading) return;
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: content.trim(), timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);
        try {
            const res  = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: content, history: messages.slice(-10), userId: user?.username }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.message,
                timestamp: new Date(),
                slmUsed: data.slmUsed === true,
            }]);
        } catch {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm sorry, I'm having trouble responding right now. Please try again.",
                timestamp: new Date(),
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col">

            {/* ── Header ───────────────────────────────────────────── */}
            <div className="flex items-center gap-4 mb-4">
                <Link href="/dashboard" className="p-2 rounded-xl hover:bg-surface-elevated transition-colors">
                    <ArrowLeft size={24} />
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Chat with Ovira AI</h1>
                            <p className="text-sm text-text-secondary">Your compassionate health companion</p>
                        </div>
                    </div>
                    {contextTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 ml-[52px]">
                            <span className="text-xs font-medium text-text-muted">AI Context:</span>
                            {contextTags.map((tag, i) => (
                                <span key={i} className="px-2 py-1 text-xs bg-success/10 text-success rounded-full border border-success/20">
                                    ✓ {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Chat area ─────────────────────────────────────────── */}
            <Card variant="elevated" className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">

                    {/* Empty state */}
                    {messages.length === 0 && !loading ? (
                        <div className="h-full flex flex-col items-center justify-center text-center px-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6">
                                <Sparkles className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2">Hello! I&apos;m Ovira AI</h2>
                            <p className="text-text-secondary mb-6 max-w-sm">
                                I&apos;m here to help answer your women&apos;s health questions with empathy and care.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                                {STARTER_QUESTIONS.map(q => (
                                    <button key={q} onClick={() => sendMessage(q)}
                                        className="p-3 text-left text-sm rounded-xl bg-surface-elevated hover:bg-primary/10 hover:text-primary transition-colors">
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Messages */}
                            {messages.map(msg => (
                                <React.Fragment key={msg.id}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {msg.role === 'assistant' && (
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                                                <Bot size={16} className="text-white" />
                                            </div>
                                        )}
                                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm whitespace-pre-wrap ${
                                            msg.role === 'user'
                                                ? 'bg-primary text-white rounded-tr-sm'
                                                : 'bg-surface-elevated text-text-primary rounded-tl-sm'
                                        }`}>
                                            {msg.content}
                                        </div>
                                        {msg.role === 'user' && (
                                            <div className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center flex-shrink-0">
                                                <User size={16} className="text-text-secondary" />
                                            </div>
                                        )}
                                    </motion.div>
                                    {msg.role === 'assistant' && msg.slmUsed && (
                                        <div className="flex justify-start ml-11 -mt-2 mb-1">
                                            <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs rounded-full px-3 py-1">
                                                🧬 Powered by MenstLLaMA — fine-tuned on 23,820 Indian menstrual health Q&As
                                            </span>
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}

                            {/* AI Thinking indicator */}
                            <ThinkingIndicator visible={loading} />

                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* ── Input ─────────────────────────────────────────── */}
                <div className="p-4 border-t border-border">
                    <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Ask me anything about women's health…"
                            disabled={loading}
                            className="flex-1 px-4 py-3 rounded-xl border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-60 transition-opacity"
                        />
                        <Button type="submit" disabled={!input.trim() || loading} className="px-4">
                            <Send size={20} />
                        </Button>
                    </form>
                </div>
            </Card>

            {/* Disclaimer */}
            <div className="mt-3 flex items-start gap-2 text-xs text-text-muted px-2">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <p>Ovira AI provides educational information only, not medical advice. Always consult a healthcare professional for medical concerns.</p>
            </div>
        </div>
    );
}
