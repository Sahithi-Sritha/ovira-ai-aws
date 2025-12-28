'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Send, ArrowLeft, Sparkles, AlertCircle, User, Bot } from 'lucide-react';
import Link from 'next/link';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const STARTER_QUESTIONS = [
    "What are common PMS symptoms?",
    "How can I manage period cramps?",
    "When should I see a doctor?",
    "What is a normal cycle length?",
];

export default function ChatPage() {
    const { user, userProfile } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (content: string) => {
        if (!content.trim() || loading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: content.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: content,
                    history: messages.slice(-10), // Last 10 messages for context
                    userContext: {
                        ageRange: userProfile?.ageRange,
                        conditions: userProfile?.conditions,
                    },
                }),
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.message,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    return (
        <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
                <Link
                    href="/dashboard"
                    className="p-2 rounded-xl hover:bg-surface-elevated transition-colors"
                >
                    <ArrowLeft size={24} />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Chat with Ovira AI</h1>
                        <p className="text-sm text-text-secondary">Your compassionate health companion</p>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <Card variant="elevated" className="flex-1 flex flex-col overflow-hidden">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center px-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6">
                                <Sparkles className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2">Hello! I&apos;m Ovira AI</h2>
                            <p className="text-text-secondary mb-6 max-w-sm">
                                I&apos;m here to help answer your women&apos;s health questions with empathy and care.
                                What would you like to know?
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                                {STARTER_QUESTIONS.map((question) => (
                                    <button
                                        key={question}
                                        onClick={() => sendMessage(question)}
                                        className="p-3 text-left text-sm rounded-xl bg-surface-elevated hover:bg-primary/10 hover:text-primary transition-colors"
                                    >
                                        {question}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                                        }`}
                                >
                                    {message.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                                            <Bot size={16} className="text-white" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[80%] p-4 rounded-2xl ${message.role === 'user'
                                                ? 'bg-primary text-white rounded-tr-sm'
                                                : 'bg-surface-elevated text-text-primary rounded-tl-sm'
                                            }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    </div>
                                    {message.role === 'user' && (
                                        <div className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center flex-shrink-0">
                                            <User size={16} className="text-text-secondary" />
                                        </div>
                                    )}
                                </div>
                            ))}
                            {loading && (
                                <div className="flex gap-3 justify-start">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                                        <Bot size={16} className="text-white" />
                                    </div>
                                    <div className="bg-surface-elevated p-4 rounded-2xl rounded-tl-sm">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" />
                                            <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                            <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-border">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask me anything about women's health..."
                            className="flex-1 px-4 py-3 rounded-xl border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            disabled={loading}
                        />
                        <Button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="px-4"
                        >
                            <Send size={20} />
                        </Button>
                    </form>
                </div>
            </Card>

            {/* Disclaimer */}
            <div className="mt-3 flex items-start gap-2 text-xs text-text-muted px-2">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <p>
                    Ovira AI provides educational information only, not medical advice. Always consult a
                    healthcare professional for medical concerns.
                </p>
            </div>
        </div>
    );
}
