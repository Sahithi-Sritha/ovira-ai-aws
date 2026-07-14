'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { UserProfile } from '@/types';
import { Bookmark, BookmarkCheck, ExternalLink, ShoppingCart, Sparkles, CheckCircle2 } from 'lucide-react';
// @ts-ignore
import { motion, AnimatePresence } from 'motion/react';

// ─── Disclaimer copy (required) ───────────────────────────────────────────────
const DISCLAIMER =
    'Women with similar symptoms often find these helpful. These are not medical recommendations — always consult your doctor before making health decisions.';

// ─── Product catalogue ────────────────────────────────────────────────────────
// Amazon / Flipkart links are generic category search URLs — no affiliate IDs.
// Never includes medicines, supplements that treat conditions, or prescriptions.

interface Product {
    id: string;
    title: string;
    description: string;
    image: string;          // Unsplash URL
    category: string;
    tags: string[];         // matched against profile signals
    whyRecommended: string; // shown on card
    amazon: string;         // search URL
    flipkart: string;       // search URL
}


const CATALOGUE: Product[] = [
    // ── Comfort & Pain relief ──────────────────────────────────────────────────
    {
        id: 'heating-pad',
        title: 'Electric Heating Pad',
        description: 'Moist or dry heat therapy for lower-abdominal and back cramp relief. Adjustable temperature with auto-shutoff.',
        image: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=600&q=80',
        category: 'Comfort',
        tags: ['cramps', 'pain', 'endometriosis', 'pcos', 'back pain', 'dysmenorrhea'],
        whyRecommended: 'Heat therapy is widely used to ease menstrual cramps and lower-back discomfort.',
        amazon: 'https://www.amazon.in/s?k=electric+heating+pad+for+period+cramps',
        flipkart: 'https://www.flipkart.com/search?q=electric+heating+pad+period+pain',
    },
    {
        id: 'tens-device',
        title: 'TENS Pain Relief Device',
        description: 'Portable transcutaneous electrical nerve stimulation unit for drug-free pain management during periods.',
        image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80',
        category: 'Comfort',
        tags: ['cramps', 'pain', 'endometriosis', 'severe pain'],
        whyRecommended: 'TENS devices can help reduce perceived pain without medications.',
        amazon: 'https://www.amazon.in/s?k=tens+device+period+pain+relief',
        flipkart: 'https://www.flipkart.com/search?q=tens+machine+menstrual+pain',
    },
    {
        id: 'hot-water-bottle',
        title: 'Knitted Hot Water Bottle',
        description: 'Soft-cover rubber bottle — soothing comfort for cramps, back pain, and relaxation during your period.',
        image: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600&q=80',
        category: 'Comfort',
        tags: ['cramps', 'pain', 'heavy flow', 'menstrual'],
        whyRecommended: 'A low-cost, chemical-free comfort tool recommended by gynaecologists for cramp relief.',
        amazon: 'https://www.amazon.in/s?k=hot+water+bottle+with+cover',
        flipkart: 'https://www.flipkart.com/search?q=hot+water+bottle+period+comfort',
    },

    // ── Menstrual products ────────────────────────────────────────────────────
    {
        id: 'menstrual-cup',
        title: 'Medical-grade Menstrual Cup',
        description: 'Reusable silicone cup — holds 3× more than a pad, eco-friendly, and lasts up to 10 years.',
        image: 'https://images.unsplash.com/photo-1617450365226-9bf28c04e130?w=600&q=80',
        category: 'Period Care',
        tags: ['heavy flow', 'pcos', 'endometriosis', 'eco', 'all'],
        whyRecommended: 'A great option for heavier flow days — longer wear time and no skin irritation.',
        amazon: 'https://www.amazon.in/s?k=menstrual+cup+medical+grade+silicone',
        flipkart: 'https://www.flipkart.com/search?q=menstrual+cup+reusable',
    },
    {
        id: 'period-underwear',
        title: 'Leak-proof Period Underwear',
        description: 'Multi-layer absorbent fabric that replaces or backs up pads. Machine washable, up to 5 years of use.',
        image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=600&q=80',
        category: 'Period Care',
        tags: ['heavy flow', 'anemia', 'all'],
        whyRecommended: 'Provides extra security on heavy flow days without the bulk of overnight pads.',
        amazon: 'https://www.amazon.in/s?k=period+underwear+women+leak+proof',
        flipkart: 'https://www.flipkart.com/search?q=period+underwear+absorbent',
    },
    {
        id: 'disc-period',
        title: 'Menstrual Disc',
        description: 'Sits at the cervical fornix — mess-free during intimacy, suitable for heavier flow days.',
        image: 'https://images.unsplash.com/photo-1612776572997-76cc42e058c3?w=600&q=80',
        category: 'Period Care',
        tags: ['heavy flow', 'endometriosis', 'pcos'],
        whyRecommended: 'Preferred by many with heavy flow for its higher capacity and comfortable fit.',
        amazon: 'https://www.amazon.in/s?k=menstrual+disc+reusable',
        flipkart: 'https://www.flipkart.com/search?q=menstrual+disc',
    },

    // ── Nutrition & Cooking ───────────────────────────────────────────────────
    {
        id: 'iron-recipe-book',
        title: 'Indian Iron-Rich Recipe Book',
        description: 'Cookbook focused on ragi, sesame, jaggery, dark leafy greens, and legumes — common Indian iron sources.',
        image: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=600&q=80',
        category: 'Nutrition',
        tags: ['anemia', 'heavy flow', 'vegetarian', 'rice dominant diet', 'iron'],
        whyRecommended: 'Dietary iron is the first-line support for heavy periods and anemia-prone women.',
        amazon: 'https://www.amazon.in/s?k=iron+rich+Indian+recipe+book+women+health',
        flipkart: 'https://www.flipkart.com/search?q=iron+rich+recipe+book+Indian',
    },
    {
        id: 'pcos-cookbook',
        title: 'Low-GI PCOS Cookbook',
        description: 'Recipes designed for insulin sensitivity and hormonal balance — millets, legumes, and anti-inflammatory foods.',
        image: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=600&q=80',
        category: 'Nutrition',
        tags: ['pcos', 'thyroid condition', 'insulin resistance'],
        whyRecommended: 'Low-GI eating is a cornerstone of PCOS lifestyle management.',
        amazon: 'https://www.amazon.in/s?k=pcos+diet+cookbook+low+gi',
        flipkart: 'https://www.flipkart.com/search?q=pcos+cookbook+Indian',
    },
    {
        id: 'ragi-kit',
        title: 'Ragi & Millet Starter Kit',
        description: 'Finger millet, foxtail millet, and barnyard millet — high-iron, low-GI grains for everyday South Indian cooking.',
        image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&q=80',
        category: 'Nutrition',
        tags: ['anemia', 'pcos', 'rice dominant diet', 'vegetarian', 'iron', 'south indian'],
        whyRecommended: 'Ragi contains 3× more iron than rice and is a key recommendation for period health.',
        amazon: 'https://www.amazon.in/s?k=ragi+finger+millet+pack+organic',
        flipkart: 'https://www.flipkart.com/search?q=ragi+millet+combo+pack',
    },
    {
        id: 'seed-cycling-kit',
        title: 'Seed Cycling Kit (Flax, Pumpkin, Sesame, Sunflower)',
        description: 'Pre-portioned seeds for follicular and luteal phase cycling. Supports hormonal rhythm naturally.',
        image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80',
        category: 'Nutrition',
        tags: ['pcos', 'irregular cycle', 'hormonal balance'],
        whyRecommended: 'Seed cycling is a popular nutritional practice among women managing hormonal irregularities.',
        amazon: 'https://www.amazon.in/s?k=seed+cycling+kit+women+hormones',
        flipkart: 'https://www.flipkart.com/search?q=seed+cycling+women+health',
    },

    // ── Fitness & Yoga ────────────────────────────────────────────────────────
    {
        id: 'yoga-mat',
        title: 'Thick Anti-slip Yoga Mat (6 mm)',
        description: 'Extra cushioning for yin yoga and restorative poses that help with pelvic pain and stress reduction.',
        image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80',
        category: 'Fitness',
        tags: ['cramps', 'pcos', 'endometriosis', 'stress', 'anxiety', 'mood swings', 'all'],
        whyRecommended: 'Gentle yoga during the luteal and menstrual phase can significantly reduce cramp intensity.',
        amazon: 'https://www.amazon.in/s?k=thick+yoga+mat+6mm+anti+slip+women',
        flipkart: 'https://www.flipkart.com/search?q=yoga+mat+6mm+thick+exercise',
    },
    {
        id: 'resistance-bands',
        title: 'Resistance Band Set (3 levels)',
        description: 'Fabric bands for low-impact home workouts — glute bridges, hip circles, and pelvic floor exercises.',
        image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a73?w=600&q=80',
        category: 'Fitness',
        tags: ['pcos', 'inactive lifestyle', 'weight', 'low activity level'],
        whyRecommended: 'Resistance training 2–3×/week is one of the most evidence-backed lifestyle interventions for PCOS.',
        amazon: 'https://www.amazon.in/s?k=resistance+bands+set+women+workout',
        flipkart: 'https://www.flipkart.com/search?q=resistance+band+set+fabric',
    },
    {
        id: 'foam-roller',
        title: 'Foam Roller for Muscle Release',
        description: 'Helps relieve lower-back tension and hip flexor tightness common during and before periods.',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
        category: 'Fitness',
        tags: ['back pain', 'cramps', 'endometriosis', 'pain'],
        whyRecommended: 'Myofascial release of the lower back and hips can reduce referred period pain.',
        amazon: 'https://www.amazon.in/s?k=foam+roller+exercise+back+pain',
        flipkart: 'https://www.flipkart.com/search?q=foam+roller+muscle+relief',
    },

    // ── Sleep & Wellness ──────────────────────────────────────────────────────
    {
        id: 'sleep-mask',
        title: 'Weighted Sleep Eye Mask',
        description: 'Gentle pressure around the eyes — promotes melatonin release and deeper sleep during the luteal phase.',
        image: 'https://images.unsplash.com/photo-1631157769375-c8f7fd83c21f?w=600&q=80',
        category: 'Sleep',
        tags: ['insomnia', 'sleep issues', 'anxiety', 'luteal', 'fatigue'],
        whyRecommended: 'Poor sleep is common before periods — darkness and light pressure can improve sleep quality.',
        amazon: 'https://www.amazon.in/s?k=weighted+sleep+eye+mask+women',
        flipkart: 'https://www.flipkart.com/search?q=sleep+eye+mask+weighted',
    },
    {
        id: 'white-noise',
        title: 'White Noise Sleep Machine',
        description: 'Masks environmental sounds. Particularly useful when pain or anxiety disrupts sleep.',
        image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80',
        category: 'Sleep',
        tags: ['insomnia', 'anxiety', 'sleep issues', 'mood swings'],
        whyRecommended: 'Consistent sleep environment sounds help reset circadian rhythm during hormonal fluctuations.',
        amazon: 'https://www.amazon.in/s?k=white+noise+machine+sleep',
        flipkart: 'https://www.flipkart.com/search?q=white+noise+machine+sleep+aid',
    },

    // ── Mental wellness ───────────────────────────────────────────────────────
    {
        id: 'journal',
        title: 'Cycle Tracking & Wellness Journal',
        description: 'Structured pages for mood, symptoms, energy, and cycle notes. Evidence-based prompts for self-awareness.',
        image: 'https://images.unsplash.com/photo-1506784926709-22f1ec395907?w=600&q=80',
        category: 'Mental Wellness',
        tags: ['anxiety', 'mood swings', 'stress', 'pcos', 'all'],
        whyRecommended: 'Journaling reduces anxiety and helps identify patterns in mood across the cycle.',
        amazon: 'https://www.amazon.in/s?k=menstrual+cycle+wellness+journal',
        flipkart: 'https://www.flipkart.com/search?q=period+wellness+journal+women',
    },
    {
        id: 'aromatherapy',
        title: 'Lavender & Clary Sage Essential Oil Set',
        description: 'Cold-pressed lavender and clary sage — popular aromatherapy oils for relaxation and stress support.',
        image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80',
        category: 'Mental Wellness',
        tags: ['anxiety', 'stress', 'mood swings', 'insomnia'],
        whyRecommended: 'Aromatherapy is used as a complementary relaxation tool — not a treatment.',
        amazon: 'https://www.amazon.in/s?k=lavender+clary+sage+essential+oil+women',
        flipkart: 'https://www.flipkart.com/search?q=lavender+essential+oil+relaxation',
    },

    // ── Hydration & Nutrition tools ───────────────────────────────────────────
    {
        id: 'water-bottle',
        title: 'Time-marked Hydration Bottle (2 L)',
        description: 'Encourages consistent water intake throughout the day — critical during heavy-flow days.',
        image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=80',
        category: 'Nutrition',
        tags: ['heavy flow', 'anemia', 'fatigue', 'headache', 'bloating', 'all'],
        whyRecommended: 'Adequate hydration helps reduce bloating and supports blood volume during heavy periods.',
        amazon: 'https://www.amazon.in/s?k=2+litre+time+marked+water+bottle',
        flipkart: 'https://www.flipkart.com/search?q=2+litre+water+bottle+time+marked',
    },
    {
        id: 'cast-iron-pan',
        title: 'Cast Iron Tawa / Skillet',
        description: 'Cooking in cast iron naturally increases the iron content of food — a centuries-old dietary hack.',
        image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80',
        category: 'Nutrition',
        tags: ['anemia', 'iron', 'vegetarian', 'heavy flow', 'rice dominant diet'],
        whyRecommended: 'Cooking acidic foods (tomatoes, tamarind) in cast iron adds measurable dietary iron.',
        amazon: 'https://www.amazon.in/s?k=cast+iron+tawa+skillet+indian+cooking',
        flipkart: 'https://www.flipkart.com/search?q=cast+iron+tawa+cooking',
    },
];


// ─── Personalisation engine (pure, no API) ────────────────────────────────────

interface ScoredProduct extends Product { score: number; matchedSignals: string[] }

function getSignals(profile: UserProfile | null): string[] {
    if (!profile) return [];
    const s: string[] = [];
    // Conditions
    profile.conditions?.forEach(c => s.push(c.toLowerCase()));
    // Symptoms
    profile.regularSymptoms?.forEach(sym => s.push(sym.toLowerCase()));
    // Pain
    const pain = profile.recentPainLevel?.toLowerCase() ?? '';
    if (pain === 'severe' || pain === 'very severe') { s.push('pain'); s.push('severe pain'); }
    if (pain !== 'none') s.push('cramps');
    // Flow
    if (profile.regularSymptoms?.some(s => s.toLowerCase().includes('heavy'))) s.push('heavy flow');
    // Diet
    if (profile.dietType) s.push(profile.dietType.toLowerCase());
    if (profile.stapleGrain) s.push(profile.stapleGrain.toLowerCase());
    if (profile.ironRichFoodFrequency?.toLowerCase().includes('rarely') ||
        profile.ironRichFoodFrequency?.toLowerCase().includes('never')) s.push('iron');
    // Sleep
    if (profile.sleepHabit?.toLowerCase().includes('late') ||
        profile.sleepHabit?.toLowerCase().includes('irregular')) s.push('insomnia');
    // Mood
    if (profile.recentMoodPattern?.toLowerCase().includes('anxious') ||
        profile.recentMoodPattern?.toLowerCase().includes('irritable')) {
        s.push('anxiety'); s.push('mood swings');
    }
    // Activity
    if (profile.activityLevel?.toLowerCase() === 'sedentary' ||
        profile.activityLevel?.toLowerCase() === 'low') s.push('low activity level');
    // Always include 'all' to give baseline items to everyone
    s.push('all');
    return [...new Set(s)];
}

function scoreProducts(profile: UserProfile | null): ScoredProduct[] {
    const signals = getSignals(profile);
    return CATALOGUE.map(p => {
        const matched = p.tags.filter(t => signals.includes(t));
        return { ...p, score: matched.length, matchedSignals: matched };
    }).sort((a, b) => b.score - a.score);
}

const CATEGORY_FILTERS = [
    'All', 'Comfort', 'Period Care', 'Nutrition', 'Fitness', 'Sleep', 'Mental Wellness',
];


// ─── Bookmark hook (localStorage, no API) ────────────────────────────────────

function useBookmarks() {
    const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
    useEffect(() => {
        try {
            const stored = localStorage.getItem('ovira_bookmarks');
            if (stored) setBookmarks(new Set(JSON.parse(stored)));
        } catch {}
    }, []);
    const toggle = (id: string) => {
        setBookmarks(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            try { localStorage.setItem('ovira_bookmarks', JSON.stringify([...next])); } catch {}
            return next;
        });
    };
    return { bookmarks, toggle };
}

// ─── Product card ─────────────────────────────────────────────────────────────

function ProductCard({ product, bookmarked, onBookmark }: {
    product: ScoredProduct;
    bookmarked: boolean;
    onBookmark: () => void;
}) {
    const isRecommended = product.score > 0;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden
                hover:border-primary/40 hover:shadow-xl hover:shadow-primary/8 transition-all duration-300"
        >
            {/* Recommended ribbon */}
            {isRecommended && (
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full
                    bg-primary text-white text-[10px] font-bold shadow-md shadow-primary/30">
                    <Sparkles size={9} /> For You
                </div>
            )}

            {/* Bookmark button */}
            <button
                onClick={onBookmark}
                aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm
                    border border-border/60 flex items-center justify-center shadow-sm
                    hover:scale-110 hover:border-primary/40 transition-all duration-200"
            >
                {bookmarked
                    ? <BookmarkCheck size={15} className="text-primary fill-primary" />
                    : <Bookmark size={15} className="text-muted-foreground" />
                }
            </button>

            {/* Hero image */}
            <div className="relative h-44 overflow-hidden bg-muted shrink-0">
                <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <span className="absolute bottom-2 left-3 text-[10px] font-bold uppercase tracking-wider
                    text-white/90 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full">
                    {product.category}
                </span>
            </div>

            {/* Body */}
            <div className="flex flex-col flex-1 p-4 gap-3">
                <h3 className="font-bold text-sm leading-snug text-foreground group-hover:text-primary transition-colors">
                    {product.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1">
                    {product.description}
                </p>

                {/* Why recommended */}
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/10">
                    <CheckCircle2 size={13} className="text-primary mt-0.5 shrink-0" />
                    <p className="text-[11px] text-primary/90 leading-snug">
                        {product.whyRecommended}
                    </p>
                </div>

                {/* Matched signals */}
                {product.matchedSignals.filter(s => s !== 'all').length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {product.matchedSignals.filter(s => s !== 'all').slice(0, 3).map(sig => (
                            <span key={sig} className="px-2 py-0.5 rounded-full bg-accent/10 text-[hsl(var(--accent))]
                                text-[10px] font-semibold capitalize">
                                ✓ {sig}
                            </span>
                        ))}
                    </div>
                )}

                {/* CTA buttons */}
                <div className="flex gap-2 pt-1">
                    <a
                        href={product.amazon}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl
                            bg-amber-400 hover:bg-amber-500 text-amber-900 text-xs font-bold
                            transition-colors shadow-sm shadow-amber-400/30"
                    >
                        <ShoppingCart size={12} /> Amazon
                        <ExternalLink size={10} className="opacity-60" />
                    </a>
                    <a
                        href={product.flipkart}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl
                            bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold
                            transition-colors shadow-sm shadow-blue-500/30"
                    >
                        <ShoppingCart size={12} /> Flipkart
                        <ExternalLink size={10} className="opacity-60" />
                    </a>
                </div>
            </div>
        </motion.div>
    );
}


// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecommendationsPage() {
    const { userProfile } = useAuth();
    const { bookmarks, toggle } = useBookmarks();
    const [activeFilter, setActiveFilter] = useState('All');
    const [showBookmarked, setShowBookmarked] = useState(false);

    const scored = useMemo(() => scoreProducts(userProfile), [userProfile]);

    const displayed = useMemo(() => {
        let list = scored;
        if (showBookmarked) list = list.filter(p => bookmarks.has(p.id));
        if (activeFilter !== 'All') list = list.filter(p => p.category === activeFilter);
        return list;
    }, [scored, activeFilter, showBookmarked, bookmarks]);

    // Build profile signal chips for the header strip
    const signals = useMemo(() => {
        const s = getSignals(userProfile).filter(x => x !== 'all').slice(0, 5);
        return s;
    }, [userProfile]);

    const topCount    = scored.filter(p => p.score > 0).length;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">

            {/* ── Header ───────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
                        Personalised For You
                    </p>
                    <h1 className="text-3xl font-bold leading-tight">
                        Wellness{' '}
                        <span className="bg-gradient-to-r from-primary to-[hsl(var(--accent))] bg-clip-text text-transparent">
                            Recommendations
                        </span>
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm max-w-xl">
                        {DISCLAIMER}
                    </p>
                </div>

                {/* Bookmark toggle */}
                <button
                    onClick={() => setShowBookmarked(v => !v)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all shrink-0 ${
                        showBookmarked
                            ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                            : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-primary'
                    }`}
                >
                    <BookmarkCheck size={15} />
                    Saved ({bookmarks.size})
                </button>
            </div>

            {/* ── Profile signals strip ─────────────────────────────── */}
            {signals.length > 0 && !showBookmarked && (
                <div className="flex flex-wrap items-center gap-2 p-4 rounded-2xl
                    bg-gradient-to-r from-primary/5 to-[hsl(var(--accent))]/5
                    border border-primary/10">
                    <Sparkles size={14} className="text-primary shrink-0" />
                    <span className="text-xs font-semibold text-muted-foreground">
                        Curated based on your profile
                    </span>
                    {signals.map(sig => (
                        <span key={sig} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                            bg-white border border-primary/20 text-xs font-semibold text-primary shadow-sm capitalize">
                            <CheckCircle2 size={11} /> {sig}
                        </span>
                    ))}
                    <span className="ml-auto text-xs text-muted-foreground hidden sm:block">
                        {topCount} products matched your profile
                    </span>
                </div>
            )}

            {/* ── Category filter pills ─────────────────────────────── */}
            {!showBookmarked && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                    {CATEGORY_FILTERS.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveFilter(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                                activeFilter === cat
                                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                                    : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-primary'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Grid ─────────────────────────────────────────────── */}
            {displayed.length > 0 ? (
                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    <AnimatePresence mode="popLayout">
                        {displayed.map(p => (
                            <ProductCard
                                key={p.id}
                                product={p}
                                bookmarked={bookmarks.has(p.id)}
                                onBookmark={() => toggle(p.id)}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            ) : (
                <div className="py-24 text-center space-y-3">
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
                        <BookmarkCheck className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="font-semibold">
                        {showBookmarked ? 'No saved items yet.' : 'No products in this category.'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {showBookmarked
                            ? 'Bookmark items to save them here.'
                            : 'Try a different filter.'}
                    </p>
                    <button
                        onClick={() => { setActiveFilter('All'); setShowBookmarked(false); }}
                        className="text-sm text-primary underline underline-offset-2"
                    >
                        Show all
                    </button>
                </div>
            )}

            {/* ── Footer disclaimer ─────────────────────────────────── */}
            <p className="text-xs text-muted-foreground text-center px-4 pt-4 border-t border-border">
                ⚕️ These are wellness tools, not medical devices or treatments. Ovira does not endorse any specific brand.
                Links open external retailers — Ovira has no affiliation with Amazon or Flipkart.
                Never use these in place of professional medical advice.
            </p>
        </div>
    );
}
