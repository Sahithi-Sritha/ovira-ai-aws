'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/Button';
import {
    ArrowLeft, Clock, Share2, MessageCircle,
    Sparkles, ChevronRight, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

const PHASE_COLORS: Record<string, string> = {
    Menstrual:  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    Follicular: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    Ovulation:  'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    Luteal:     'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
};

export default function ArticleDetailPage() {
    const { id }      = useParams();
    const router      = useRouter();
    const { user }    = useAuth();
    const [article, setArticle]               = useState<any>(null);
    const [loading, setLoading]               = useState(true);
    const [relatedArticles, setRelatedArticles] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                if (id === 'daily' && user) {
                    const res  = await fetch(`/api/articles?type=daily&userId=${user.username}`);
                    const data = await res.json();
                    if (data.success) setArticle(data.article);
                } else {
                    const listRes  = await fetch('/api/articles?type=list');
                    const listData = await listRes.json();
                    if (listData.success) {
                        const found = listData.articles.find((a: any) => a.id === id);
                        setArticle(found
                            ? {
                                ...found,
                                body: `Proper women's health education is essential for managing your well-being. This article explores the details of ${found.title} and how it relates to your specific hormonal profile. Understanding these patterns allows for better lifestyle choices, from nutrition to exercise.`,
                                tips: ['Consistency is key', 'Monitor your symptoms daily', 'Consult with experts'],
                            }
                            : {
                                title: 'Health Insight',
                                tagline: 'Expert advice for your wellness',
                                body: 'Loading detailed content for this topic. Please stay tuned as we expand our health library with more curated content.',
                                tips: ['Stay hydrated', 'Get enough sleep', 'Track your cycle'],
                            }
                        );
                        setRelatedArticles(listData.articles.filter((a: any) => a.id !== id).slice(0, 3));
                    }
                }
            } catch (e) {
                console.error('Error fetching article:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, user]);

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto space-y-8 pt-4" aria-label="Loading article" role="status">
                {/* Nav skeleton */}
                <div className="flex items-center justify-between">
                    <div className="h-5 w-28 rounded-lg bg-muted animate-pulse" />
                    <div className="h-8 w-8 rounded-xl bg-muted animate-pulse" />
                </div>
                {/* Header skeleton */}
                <div className="space-y-4 pb-8 border-b border-border">
                    <div className="flex gap-2">
                        <div className="h-6 w-20 rounded-full bg-muted animate-pulse" />
                        <div className="h-6 w-24 rounded-full bg-muted animate-pulse" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-9 w-3/4 rounded-lg bg-muted animate-pulse" />
                        <div className="h-9 w-1/2 rounded-lg bg-muted animate-pulse" />
                    </div>
                    <div className="h-5 w-full rounded-lg bg-muted animate-pulse" />
                    <div className="h-5 w-4/5 rounded-lg bg-muted animate-pulse" />
                </div>
                {/* Body skeleton */}
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={`h-4 rounded-lg bg-muted animate-pulse ${i === 4 ? 'w-2/3' : 'w-full'}`} />
                    ))}
                </div>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="text-center py-24 space-y-4">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <span className="text-2xl" aria-hidden="true">📄</span>
                </div>
                <p className="font-semibold text-foreground">Article not found</p>
                <p className="text-sm text-muted-foreground">This article may have been moved or doesn't exist.</p>
                <Link href="/articles">
                    <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />}>Back to Library</Button>
                </Link>
            </div>
        );
    }

    const handleAriaChat = () => {
        const msg = `I just read about "${article.title}". Can you tell me more about how it applies to my specific cycle and health conditions?`;
        router.push(`/chat?message=${encodeURIComponent(msg)}`);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-10 animate-fade-in">

            {/* ── Nav bar ──────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <Link
                    href="/articles"
                    className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Library
                </Link>
                <button
                    aria-label="Share article"
                    className="p-2 rounded-xl text-text-muted hover:text-primary hover:bg-primary/8 transition-all"
                >
                    <Share2 size={18} />
                </button>
            </div>

            {/* ── Article header ───────────────────────────────────── */}
            <header className="space-y-4 pb-8 border-b border-border">
                <div className="flex flex-wrap items-center gap-2">
                    {article.category && (
                        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full capitalize">
                            {article.category.replace('_', ' ')}
                        </span>
                    )}
                    {article.phase && (
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${PHASE_COLORS[article.phase] ?? 'bg-surface-elevated text-text-muted'}`}>
                            {article.phase} Phase
                        </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-text-muted ml-auto">
                        <Clock size={12} /> 5 min read
                    </span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-text-primary leading-tight">
                    {article.title}
                </h1>

                <p className="text-lg text-text-secondary leading-relaxed">
                    {article.tagline}
                </p>
            </header>

            {/* ── Body ─────────────────────────────────────────────── */}
            <div className="prose prose-slate max-w-none">
                <p className="text-base text-text-primary leading-[1.85] whitespace-pre-wrap">
                    {article.body}
                </p>
            </div>

            {/* ── Tips ─────────────────────────────────────────────── */}
            {article.tips?.length > 0 && (
                <section className="rounded-2xl border border-border bg-surface-elevated/60 p-6 space-y-4">
                    <h2 className="font-bold text-text-primary flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                        Actionable Tips
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {article.tips.map((tip: string, i: number) => (
                            <div key={i} className="rounded-xl bg-background border border-border/60 p-4 flex flex-col gap-2">
                                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                                    {i + 1}
                                </span>
                                <p className="text-sm font-medium text-text-primary">{tip}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Chat with Aria CTA ───────────────────────────────── */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-accent p-8 text-white shadow-xl shadow-primary/20">
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6 justify-between">
                    <div className="space-y-1">
                        <h3 className="text-xl font-bold">Have questions about this?</h3>
                        <p className="text-sm text-white/75 max-w-sm">
                            Aria can explain how this applies to you based on your logged symptoms and health profile.
                        </p>
                    </div>
                    <Button
                        onClick={handleAriaChat}
                        size="lg"
                        className="bg-white text-primary hover:bg-white/90 shadow-lg shrink-0"
                        leftIcon={<MessageCircle size={18} />}
                    >
                        Ask Aria
                    </Button>
                </div>
                {/* Decorative blobs */}
                <Sparkles className="absolute top-4 right-6 text-white/15 w-7 h-7 rotate-12 pointer-events-none" />
                <div className="pointer-events-none absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
            </div>

            {/* ── Related articles ─────────────────────────────────── */}
            {relatedArticles.length > 0 && (
                <section className="space-y-5 pt-6 border-t border-border">
                    <h2 className="font-bold text-text-primary">Related Articles</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        {relatedArticles.map(rel => (
                            <Link key={rel.id} href={`/articles/${rel.id}`}>
                                <article className="group h-full flex flex-col rounded-2xl border border-border bg-surface p-5 hover:border-primary/40 hover:shadow-md transition-all duration-200">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">
                                        {rel.category?.replace('_', ' ')}
                                    </span>
                                    <h4 className="font-semibold text-sm text-text-primary group-hover:text-primary transition-colors flex-1">
                                        {rel.title}
                                    </h4>
                                    <p className="text-xs text-text-secondary mt-2 line-clamp-2">
                                        {rel.tagline}
                                    </p>
                                    <div className="mt-4 flex items-center justify-between">
                                        <span className="text-[11px] text-text-muted flex items-center gap-1">
                                            <Clock size={10} /> 5 min
                                        </span>
                                        <ChevronRight size={13} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
