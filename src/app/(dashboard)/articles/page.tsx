'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/Button';
import {
    Search, Clock, Sparkles, ChevronRight, ChevronLeft,
    CheckCircle2, BarChart2, BookOpen, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { UserProfile } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ArticleStub {
    id: string;
    title: string;
    tagline: string;
    category: string;
    phase_relevance: string;
}

interface RichArticle extends ArticleStub {
    image: string;
    readTime: number;       // minutes
    difficulty: 'Easy' | 'Intermediate' | 'Advanced';
    section: TabId;
    score: number;
    reasons: string[];
}

type TabId = 'today' | 'recipes' | 'nutrition' | 'exercise' | 'lifestyle' | 'mental';


// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; emoji: string }[] = [
    { id: 'today',     label: "Today's Pick",    emoji: '✨' },
    { id: 'recipes',   label: 'Recipes',         emoji: '🍲' },
    { id: 'nutrition', label: 'Nutrition',        emoji: '🥗' },
    { id: 'exercise',  label: 'Exercise',         emoji: '💪' },
    { id: 'lifestyle', label: 'Lifestyle',        emoji: '🌿' },
    { id: 'mental',    label: 'Mental Wellness',  emoji: '🧠' },
];

const PHASE_PILL: Record<string, string> = {
    Menstrual:  'bg-rose-100 text-rose-600',
    Follicular: 'bg-amber-100 text-amber-600',
    Ovulation:  'bg-teal-100 text-teal-600',
    Luteal:     'bg-violet-100 text-violet-600',
    All:        'bg-muted text-muted-foreground',
};

// Curated Unsplash images keyed by article id (fallback by category)
const IMAGES: Record<string, string> = {
    'pcos-basics':           'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600&q=80',
    'endo-awareness':        'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&q=80',
    'pms-mgt':               'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&q=80',
    'cycle-nutr':            'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80',
    'sleep-hygiene':         'https://images.unsplash.com/photo-1631157769375-c8f7fd83c21f?w=600&q=80',
    'exercise-follicular':   'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=600&q=80',
    'iron-sources':          'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80',
    'meditation-luteal':     'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80',
    'hydration-vitals':      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=80',
    'ragi-benefits':         'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=600&q=80',
    'pcos-diet':             'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=600&q=80',
    'pcos-exercise':         'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
    'pcos-supplements':      'https://images.unsplash.com/photo-1550572017-4fcdbb59cc32?w=600&q=80',
    'pcos-acne':             'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80',
    'pcos-cycles':           'https://images.unsplash.com/photo-1506784926709-22f1ec395907?w=600&q=80',
};

const CATEGORY_IMAGES: Record<string, string> = {
    nutrition:     'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80',
    exercise:      'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=600&q=80',
    mental_health: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80',
    conditions:    'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600&q=80',
    sleep:         'https://images.unsplash.com/photo-1631157769375-c8f7fd83c21f?w=600&q=80',
    symptoms:      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=80',
};


// Maps article id → section tab
const SECTION_MAP: Record<string, TabId> = {
    'iron-sources':        'recipes',
    'ragi-benefits':       'recipes',
    'cycle-nutr':          'nutrition',
    'pcos-diet':           'nutrition',
    'pcos-supplements':    'nutrition',
    'hydration-vitals':    'nutrition',
    'exercise-follicular': 'exercise',
    'pcos-exercise':       'exercise',
    'sleep-hygiene':       'lifestyle',
    'pcos-basics':         'lifestyle',
    'endo-awareness':      'lifestyle',
    'pcos-cycles':         'lifestyle',
    'pcos-acne':           'lifestyle',
    'pms-mgt':             'mental',
    'meditation-luteal':   'mental',
};

const DIFFICULTY_MAP: Record<string, 'Easy' | 'Intermediate' | 'Advanced'> = {
    'iron-sources':        'Easy',
    'ragi-benefits':       'Easy',
    'cycle-nutr':          'Intermediate',
    'pcos-diet':           'Intermediate',
    'hydration-vitals':    'Easy',
    'exercise-follicular': 'Advanced',
    'pcos-exercise':       'Intermediate',
    'sleep-hygiene':       'Easy',
    'pms-mgt':             'Easy',
    'meditation-luteal':   'Easy',
    'pcos-supplements':    'Intermediate',
    'pcos-acne':           'Intermediate',
    'pcos-cycles':         'Intermediate',
    'pcos-basics':         'Easy',
    'endo-awareness':      'Easy',
};

const READ_TIME_MAP: Record<string, number> = {
    'iron-sources': 4, 'ragi-benefits': 3, 'cycle-nutr': 6,
    'pcos-diet': 7, 'hydration-vitals': 3, 'exercise-follicular': 5,
    'pcos-exercise': 6, 'sleep-hygiene': 5, 'pms-mgt': 4,
    'meditation-luteal': 4, 'pcos-supplements': 8, 'pcos-acne': 5,
    'pcos-cycles': 6, 'pcos-basics': 7, 'endo-awareness': 6,
};

const DIFF_COLOR: Record<string, string> = {
    Easy:         'bg-emerald-50 text-emerald-700',
    Intermediate: 'bg-amber-50 text-amber-700',
    Advanced:     'bg-rose-50 text-rose-600',
};


// ─── Personalisation (reused, unchanged) ──────────────────────────────────────

function scoreArticle(article: ArticleStub, profile: UserProfile): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;
    const conditions = profile.conditions?.map(c => c.toLowerCase()) ?? [];
    const symptoms   = profile.regularSymptoms?.map(s => s.toLowerCase()) ?? [];
    const grain      = profile.stapleGrain?.toLowerCase() ?? '';
    const diet       = profile.dietType?.toLowerCase() ?? '';
    const pain       = profile.recentPainLevel?.toLowerCase() ?? '';
    const flow       = symptoms.includes('heavy flow') || pain === 'severe' || pain === 'very severe';
    const id = article.id; const cat = article.category;

    if (conditions.includes('pcos')) {
        if (['pcos-basics','pcos-diet','pcos-exercise','pcos-supplements','pcos-acne','pcos-cycles','cycle-nutr'].includes(id))
            { score += 3; reasons.push('PCOS'); }
    }
    if (conditions.includes('endometriosis') || conditions.includes('endo')) {
        if (['endo-awareness','pms-mgt','iron-sources'].includes(id))
            { score += 3; reasons.push('Endometriosis'); }
    }
    if (conditions.includes('anemia')) {
        if (['iron-sources','ragi-benefits','cycle-nutr'].includes(id))
            { score += 3; reasons.push('Anemia'); }
    }
    if (conditions.includes('thyroid condition') && (cat === 'nutrition' || cat === 'exercise'))
        { score += 2; reasons.push('Thyroid condition'); }
    if ((grain.includes('rice') || grain.includes('white rice')) &&
        ['ragi-benefits','cycle-nutr','pcos-diet'].includes(id))
        { score += 2; reasons.push('Rice dominant diet'); }
    if ((diet === 'vegetarian' || diet === 'vegan') && ['iron-sources','ragi-benefits'].includes(id))
        { score += 2; reasons.push('Vegetarian diet'); }
    if (flow && ['iron-sources','ragi-benefits','cycle-nutr'].includes(id))
        { score += 2; reasons.push('Heavy flow'); }
    if (symptoms.some(s => s.includes('mood') || s.includes('anxiety')) &&
        ['pms-mgt','meditation-luteal','sleep-hygiene'].includes(id))
        { score += 2; reasons.push('Mood changes'); }
    if (symptoms.some(s => s.includes('cramp') || s.includes('pain')) &&
        ['pms-mgt','meditation-luteal'].includes(id))
        { score += 1; reasons.push('Cramps'); }
    if (symptoms.some(s => s.includes('insomnia') || s.includes('sleep')) && id === 'sleep-hygiene')
        { score += 2; reasons.push('Sleep issues'); }
    if (symptoms.some(s => s.includes('fatigue')) &&
        ['iron-sources','ragi-benefits','hydration-vitals'].includes(id))
        { score += 1; reasons.push('Fatigue'); }
    if ((pain === 'severe' || pain === 'very severe') &&
        ['pms-mgt','meditation-luteal','endo-awareness'].includes(id))
        { score += 1; reasons.push('Severe pain'); }

    return { score, reasons: [...new Set(reasons)] };
}

function enrich(stub: ArticleStub, profile: UserProfile | null): RichArticle {
    const { score, reasons } = profile ? scoreArticle(stub, profile) : { score: 0, reasons: [] };
    return {
        ...stub,
        image:      IMAGES[stub.id] ?? CATEGORY_IMAGES[stub.category] ?? CATEGORY_IMAGES.nutrition,
        readTime:   READ_TIME_MAP[stub.id] ?? 5,
        difficulty: DIFFICULTY_MAP[stub.id] ?? 'Intermediate',
        section:    SECTION_MAP[stub.id] ?? 'lifestyle',
        score,
        reasons,
    };
}


// ─── Main page ────────────────────────────────────────────────────────────────

export default function ArticlesPage() {
    const { user, userProfile } = useAuth();
    const [stubs, setStubs]           = useState<ArticleStub[]>([]);
    const [dailyArticle, setDailyArticle] = useState<any>(null);
    const [loading, setLoading]       = useState(true);
    const [activeTab, setActiveTab]   = useState<TabId>('today');
    const [search, setSearch]         = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [listRes, dailyRes] = await Promise.all([
                    fetch('/api/articles?type=list'),
                    user ? fetch(`/api/articles?type=daily&userId=${user.username}`) : Promise.resolve(null),
                ]);
                const listData = await listRes.json();
                if (listData.success) setStubs(listData.articles);
                if (dailyRes) {
                    const d = await dailyRes.json();
                    if (d.success) setDailyArticle(d.article);
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        load();
    }, [user]);

    const articles = stubs.map(s => enrich(s, userProfile));
    const sorted   = [...articles].sort((a, b) => b.score - a.score);

    // "Because you have" profile chips — unique reasons across all scored articles
    const profileChips = (() => {
        const seen = new Set<string>();
        sorted.forEach(a => a.reasons.forEach(r => seen.add(r)));
        return [...seen].slice(0, 5);
    })();

    // Tab content
    const todayArticles = sorted.slice(0, 6); // top scored → today's picks
    const tabArticles   = activeTab === 'today'
        ? todayArticles
        : sorted.filter(a => a.section === activeTab);

    const displayed = search
        ? sorted.filter(a =>
            a.title.toLowerCase().includes(search.toLowerCase()) ||
            a.tagline.toLowerCase().includes(search.toLowerCase()))
        : tabArticles;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">

            {/* ── Page header ──────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Health Library</p>
                    <h1 className="text-3xl font-bold leading-tight">
                        Your Cycle,{' '}
                        <span className="bg-gradient-to-r from-primary to-[hsl(var(--accent))] bg-clip-text text-transparent">
                            Explained
                        </span>
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Personalised reads for every phase of your cycle.
                    </p>
                </div>
                <div className="relative w-full md:w-64 shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" aria-hidden="true" />
                    <input
                        id="article-search"
                        type="search"
                        aria-label="Search articles"
                        placeholder="Search articles…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all placeholder:text-muted-foreground dark:bg-muted/20"
                    />
                </div>
            </div>


            {/* ── "Because you have" profile strip ─────────────────── */}
            {!loading && profileChips.length > 0 && !search && (
                <div className="flex flex-wrap items-center gap-2 p-4 rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10">
                    <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Personalised because you have</span>
                    {profileChips.map(chip => (
                        <span key={chip} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-background border border-primary/20 text-xs font-semibold text-primary shadow-sm">
                            <CheckCircle2 size={11} aria-hidden="true" /> {chip}
                        </span>
                    ))}
                </div>
            )}

            {/* ── Daily AI feature card ─────────────────────────────── */}
            {dailyArticle && !search && (
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold">Today&apos;s AI Recommendation</span>
                        <span className="flex-1 h-px bg-border" />
                    </div>
                    <Link href={`/articles/${dailyArticle.id || 'daily'}`}>
                        <div className="group relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 via-background to-accent/8 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 focus-within:ring-2 focus-within:ring-ring/50">
                            <div className="grid md:grid-cols-5 gap-0">
                                {/* Text side */}
                                <div className="md:col-span-3 p-7 flex flex-col justify-between gap-5">
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap gap-2">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${PHASE_PILL[dailyArticle.phase] ?? PHASE_PILL.All}`}>
                                                {dailyArticle.phase} Phase
                                            </span>
                                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary capitalize">
                                                {(dailyArticle.category ?? 'health').replace('_', ' ')}
                                            </span>
                                        </div>
                                        <h2 className="text-xl md:text-2xl font-bold leading-snug group-hover:text-primary transition-colors">
                                            {dailyArticle.title}
                                        </h2>
                                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                            {dailyArticle.tagline}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Clock size={12} /> 5 min read
                                        </span>
                                        <Button size="sm" rightIcon={<ArrowRight size={14} />}>Read Now</Button>
                                    </div>
                                </div>
                                {/* Image side */}
                                <div className="md:col-span-2 relative min-h-[180px] md:min-h-0 overflow-hidden rounded-b-2xl md:rounded-l-none md:rounded-r-2xl">
                                    <img
                                        src={CATEGORY_IMAGES[dailyArticle.category] ?? CATEGORY_IMAGES.nutrition}
                                        alt={dailyArticle.title}
                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent md:bg-gradient-to-r" />
                                </div>
                            </div>
                        </div>
                    </Link>
                </section>
            )}


            {/* ── Tabs ─────────────────────────────────────────────── */}
            {!search && (
                <div
                    role="tablist"
                    aria-label="Article categories"
                    className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0"
                >
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                activeTab === tab.id
                                    ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                                    : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-primary'
                            }`}
                        >
                            <span aria-hidden="true">{tab.emoji}</span> {tab.label}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Today tab — horizontal carousel ──────────────────── */}
            {!search && activeTab === 'today' && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[hsl(var(--accent))]" />
                        <span className="text-sm font-bold">Recommended for You</span>
                        <span className="flex-1 h-px bg-border" />
                    </div>
                    {loading
                        ? <CarouselSkeleton />
                        : <ArticleCarousel articles={displayed} />
                    }
                </section>
            )}

            {/* ── Other tabs — 3-col grid ───────────────────────────── */}
            {(!search && activeTab !== 'today') && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">{TABS.find(t => t.id === activeTab)?.emoji}</span>
                        <span className="text-sm font-bold">{TABS.find(t => t.id === activeTab)?.label}</span>
                        {!loading && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{displayed.length}</span>}
                        <span className="flex-1 h-px bg-border" />
                    </div>
                    {loading
                        ? <GridSkeleton />
                        : displayed.length > 0
                            ? <ArticleGrid articles={displayed} />
                            : <EmptyState onClear={() => setActiveTab('today')} />
                    }
                </section>
            )}

            {/* ── Search results ────────────────────────────────────── */}
            {search && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-bold">Results for &ldquo;{search}&rdquo;</span>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{displayed.length}</span>
                        <span className="flex-1 h-px bg-border" />
                    </div>
                    {displayed.length > 0
                        ? <ArticleGrid articles={displayed} />
                        : <EmptyState onClear={() => setSearch('')} />
                    }
                </section>
            )}

        </div>
    );
}


// ─── Article Card ─────────────────────────────────────────────────────────────

function ArticleCard({ article, size = 'md' }: { article: RichArticle; size?: 'sm' | 'md' }) {
    return (
        <Link
            href={`/articles/${article.id}`}
            className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
            <div className={`group h-full flex flex-col rounded-2xl border border-border bg-card overflow-hidden
                hover:border-primary/40 hover:shadow-lg hover:shadow-primary/8 transition-all duration-200`}>

                {/* Hero image */}
                <div className={`relative overflow-hidden shrink-0 ${size === 'sm' ? 'h-36' : 'h-44'}`}>
                    <img
                        src={article.image}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Phase badge overlaid on image */}
                    <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${PHASE_PILL[article.phase_relevance] ?? PHASE_PILL.All}`}>
                        {article.phase_relevance}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>

                {/* Body */}
                <div className="flex-1 flex flex-col p-4 gap-2.5">
                    {/* Category + difficulty */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground capitalize">
                            {article.category.replace('_', ' ')}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${DIFF_COLOR[article.difficulty]}`}>
                            {article.difficulty}
                        </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                    </h3>

                    {/* Tagline */}
                    <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{article.tagline}</p>

                    {/* Reason chip */}
                    {article.reasons.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {article.reasons.slice(0, 2).map(r => (
                                <span key={r} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/15 text-accent text-xs font-semibold">
                                    <CheckCircle2 size={9} aria-hidden="true" />
                                    <span className="truncate max-w-[100px]">{r}</span>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2.5 mt-auto border-t border-border/60">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock size={11} aria-hidden="true" /> {article.readTime} min</span>
                            <span className="flex items-center gap-1"><BarChart2 size={11} aria-hidden="true" /> {article.difficulty}</span>
                        </div>
                        <span aria-hidden="true" className="flex items-center gap-0.5 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0">
                            Read <ChevronRight size={12} />
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}


// ─── Carousel ─────────────────────────────────────────────────────────────────

function ArticleCarousel({ articles }: { articles: RichArticle[] }) {
    const trackRef = useRef<HTMLDivElement>(null);

    const scroll = (dir: 'left' | 'right') => {
        if (!trackRef.current) return;
        const card = trackRef.current.querySelector('[data-card]') as HTMLElement | null;
        const w = card ? card.offsetWidth + 16 : 300;
        trackRef.current.scrollBy({ left: dir === 'right' ? w * 2 : -(w * 2), behavior: 'smooth' });
    };

    if (articles.length === 0) return (
        <div role="status" className="py-12 text-center text-muted-foreground text-sm">
            No articles for this tab.
        </div>
    );

    return (
        <div className="relative group/carousel">
            <div
                ref={trackRef}
                role="list"
                aria-label="Article carousel"
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
            >
                {articles.map(a => (
                    <div key={a.id} data-card role="listitem" className="snap-start shrink-0 w-64 sm:w-72">
                        <ArticleCard article={a} size="sm" />
                    </div>
                ))}
            </div>

            <button
                onClick={() => scroll('left')}
                aria-label="Scroll carousel left"
                className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full
                    bg-card border border-border shadow-md items-center justify-center
                    text-muted-foreground hover:text-primary hover:border-primary/40
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                    transition-all opacity-0 group-hover/carousel:opacity-100"
            >
                <ChevronLeft size={18} />
            </button>
            <button
                onClick={() => scroll('right')}
                aria-label="Scroll carousel right"
                className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full
                    bg-card border border-border shadow-md items-center justify-center
                    text-muted-foreground hover:text-primary hover:border-primary/40
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                    transition-all opacity-0 group-hover/carousel:opacity-100"
            >
                <ChevronRight size={18} />
            </button>
        </div>
    );
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

function ArticleGrid({ articles }: { articles: RichArticle[] }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map(a => <ArticleCard key={a.id} article={a} />)}
        </div>
    );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function CardSkeleton({ h = 'h-44' }: { h?: string }) {
    return (
        <div className="rounded-2xl border border-border bg-card overflow-hidden" aria-hidden="true">
            <div className={`${h} bg-muted animate-pulse`} />
            <div className="p-4 space-y-2.5">
                <div className="flex justify-between">
                    <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-14 rounded bg-muted animate-pulse" />
                </div>
                <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                <div className="h-3 w-full rounded bg-muted animate-pulse" />
                <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
            </div>
        </div>
    );
}

function CarouselSkeleton() {
    return (
        <div className="flex gap-4 overflow-hidden" aria-label="Loading articles" role="status">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="shrink-0 w-64 sm:w-72">
                    <CardSkeleton h="h-36" />
                </div>
            ))}
        </div>
    );
}

function GridSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" aria-label="Loading articles" role="status">
            {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onClear }: { onClear: () => void }) {
    return (
        <div className="py-20 text-center space-y-4" role="status">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto" aria-hidden="true">
                <BookOpen className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
                <p className="font-semibold text-foreground">No articles found</p>
                <p className="text-sm text-muted-foreground mt-1">Try a different tab or clear your search.</p>
            </div>
            <Button variant="outline" size="sm" onClick={onClear}>Clear filters</Button>
        </div>
    );
}
