'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Check if user dismissed banner before
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
            const dismissedDate = new Date(dismissed);
            const now = new Date();
            const daysSince = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
            
            // Show again after 7 days
            if (daysSince < 7) {
                return;
            }
        }

        // Listen for the beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            
            // Show banner after 30 seconds on dashboard
            setTimeout(() => {
                setShowInstallBanner(true);
            }, 30000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Detect if app was installed
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setShowInstallBanner(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            return;
        }

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user's response
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        // Clear the deferredPrompt
        setDeferredPrompt(null);
        setShowInstallBanner(false);
    };

    const handleDismiss = () => {
        setShowInstallBanner(false);
        localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
    };

    // Don't show anything if already installed or no install prompt available
    if (isInstalled || !deferredPrompt) {
        return null;
    }

    return (
        <>
            {/* Install Banner (shows after 30s) */}
            {showInstallBanner && (
                <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
                    <div className="bg-gradient-to-r from-primary to-accent p-4 rounded-2xl shadow-2xl border border-white/20">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                                <Download className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white text-sm mb-1">
                                    Install Ovira App
                                </h3>
                                <p className="text-white/90 text-xs mb-3">
                                    Get quick access and track your health offline
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleInstallClick}
                                        className="px-4 py-2 bg-white text-primary font-bold text-xs rounded-xl hover:bg-white/90 transition-colors"
                                    >
                                        Install Now
                                    </button>
                                    <button
                                        onClick={handleDismiss}
                                        className="px-3 py-2 text-white/90 hover:text-white text-xs font-medium"
                                    >
                                        Not now
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={handleDismiss}
                                className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Install Button (always visible in dashboard header) */}
            <Button
                variant="secondary"
                size="sm"
                leftIcon={<Download size={16} />}
                onClick={handleInstallClick}
                className="hidden md:flex"
            >
                Install App
            </Button>
        </>
    );
}
