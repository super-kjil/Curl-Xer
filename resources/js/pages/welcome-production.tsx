import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=dm-serif-display:400,400i|dm-mono:300,400"
                    rel="stylesheet"
                />
            </Head>

            <div className="relative flex min-h-screen flex-col bg-[#FDFDFC] text-[#1b1b18] dark:bg-[#0a0a0a] dark:text-[#EDEDEC]">

                {/* Grain overlay */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none fixed inset-0 z-0 opacity-[0.035]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                        backgroundSize: '200px',
                    }}
                />

                {/* Header */}
                <header className="relative z-10 flex items-center justify-between border-b border-[#1b1b18]/10 px-8 py-5 dark:border-[#EDEDEC]/10 lg:px-10">
                    <span
                        className="font-mono text-[11px] font-normal uppercase tracking-[0.15em] text-[#1b1b18] dark:text-[#EDEDEC]"
                        style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                        Curlxer
                        <span
                            className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#E84C1E] align-middle"
                            style={{ position: 'relative', top: '-1px' }}
                        />
                    </span>

                    <nav className="flex items-center gap-3">
                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                className="rounded-[2px] border border-[#1b1b18]/20 px-4 py-1.5 font-mono text-[11px] tracking-[0.08em] text-[#1b1b18]/70 transition-all duration-200 hover:border-[#1b1b18]/40 hover:bg-[#1b1b18]/[0.04] hover:text-[#1b1b18] dark:border-[#EDEDEC]/20 dark:text-[#EDEDEC]/60 dark:hover:border-[#EDEDEC]/40 dark:hover:bg-[#EDEDEC]/[0.05] dark:hover:text-[#EDEDEC]"
                                style={{ fontFamily: "'DM Mono', monospace" }}
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <Link
                                href={route('login')}
                                className="rounded-[2px] border border-[#1b1b18]/20 px-4 py-1.5 font-mono text-[11px] tracking-[0.08em] text-[#1b1b18]/70 transition-all duration-200 hover:border-[#1b1b18]/40 hover:bg-[#1b1b18]/[0.04] hover:text-[#1b1b18] dark:border-[#EDEDEC]/20 dark:text-[#EDEDEC]/60 dark:hover:border-[#EDEDEC]/40 dark:hover:bg-[#EDEDEC]/[0.05] dark:hover:text-[#EDEDEC]"
                                style={{ fontFamily: "'DM Mono', monospace" }}
                            >
                                Log in
                            </Link>
                        )}
                    </nav>
                </header>

                {/* Hero — two-column split */}
                <main className="relative z-10 grid flex-1 grid-cols-1 lg:grid-cols-2">

                    {/* Left: Text */}
                    <div className="flex flex-col justify-center gap-8 border-b border-[#1b1b18]/10 px-8 py-16 dark:border-[#EDEDEC]/10 lg:border-b-0 lg:border-r lg:px-10 lg:py-20">

                        {/* Eyebrow */}
                        <span
                            className="flex items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-[#1b1b18]/40 dark:text-[#EDEDEC]/35"
                            style={{ fontFamily: "'DM Mono', monospace" }}
                        >
                            <span className="h-px w-5 bg-[#E84C1E]" />
                            Curlxer Platform
                        </span>

                        {/* Headline */}
                        <h1
                            className="text-[2.6rem] font-normal leading-[1.08] tracking-[-0.02em] text-[#1b1b18] dark:text-[#EDEDEC] lg:text-[3.4rem]"
                            style={{ fontFamily: "'DM Serif Display', serif" }}
                        >
                            Domain Management.{' '}
                            <em className="italic text-[#E84C1E]">Simplified</em>.
                        </h1>

                        {/* Body */}
                        <p className="max-w-sm text-[14px] leading-[1.75] text-[#1b1b18]/55 dark:text-[#EDEDEC]/50">
                            Advanced availability checking, lightning-fast DNS optimization, and powerful batch processing analytics. Built for managing domain.
                        </p>

                        {/* CTA row */}
                        <div className="flex items-center gap-6">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="rounded-[2px] bg-[#1b1b18] px-6 py-2.5 text-[11px] tracking-[0.1em] text-white transition-opacity duration-200 hover:opacity-70 dark:bg-[#EDEDEC] dark:text-[#1b1b18]"
                                    style={{ fontFamily: "'DM Mono', monospace" }}
                                >
                                    Go to dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="rounded-[2px] bg-[#1b1b18] px-6 py-2.5 text-[11px] tracking-[0.1em] text-white transition-opacity duration-200 hover:opacity-70 dark:bg-[#EDEDEC] dark:text-[#1b1b18]"
                                        style={{ fontFamily: "'DM Mono', monospace" }}
                                    >
                                        Get started
                                    </Link>
                                    <a
                                        href="#"
                                        className="group flex items-center gap-1.5 text-[12px] tracking-[0.06em] text-[#1b1b18]/45 transition-colors duration-200 hover:text-[#1b1b18] dark:text-[#EDEDEC]/40 dark:hover:text-[#EDEDEC]"
                                        style={{ fontFamily: "'DM Mono', monospace" }}
                                    >
                                        Learn more
                                        <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">
                                            →
                                        </span>
                                    </a>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right: Visual */}
                    <div className="relative flex items-center justify-center bg-[#F5F4F0]/60 px-8 py-16 dark:bg-[#111110] lg:px-10 lg:py-20">

                        {/* Subtle grid pattern */}
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0"
                            style={{
                                backgroundImage: `
                                    linear-gradient(to right, rgba(27,27,24,0.04) 1px, transparent 1px),
                                    linear-gradient(to bottom, rgba(27,27,24,0.04) 1px, transparent 1px)
                                `,
                                backgroundSize: '40px 40px',
                            }}
                        />

                        <div className="relative w-full max-w-[320px]">
                            {/* Corner reticles */}
                            <span className="absolute -left-1 -top-1 h-3 w-3 border-l border-t border-[#E84C1E]" />
                            <span className="absolute -bottom-1 -right-1 h-3 w-3 border-b border-r border-[#E84C1E]" />

                            {/* Version label */}
                            <span
                                className="absolute -top-5 left-0 text-[9px] uppercase tracking-[0.18em] text-[#1b1b18]/30 dark:text-[#EDEDEC]/25"
                                style={{ fontFamily: "'DM Mono', monospace" }}
                            >
                                Testing, Recording Domain Name
                            </span>
                            <span
                                className="absolute -bottom-5 right-0 text-[9px] uppercase tracking-[0.18em] text-[#1b1b18]/30 dark:text-[#EDEDEC]/25"
                                style={{ fontFamily: "'DM Mono', monospace" }}
                            >
                                2025
                            </span>

                            {/* Wordmark SVG */}
                            <svg
                                viewBox="0 0 438 104"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-full"
                            >
                                <path
                                    d="M 76.582 60.117 L 84.024 24.785 L 106.7 24.785 L 99.141 60.938 Q 98.789 62.461 98.409 64.805 Q 98.028 67.148 98.028 69.199 Q 98.028 71.719 99.346 72.979 Q 100.664 74.238 102.481 74.238 Q 104.473 74.238 106.494 72.422 Q 108.516 70.605 110.303 66.797 Q 112.09 62.988 113.321 57.07 L 120.118 24.785 L 142.793 24.785 L 128.789 91.172 L 110.625 91.172 L 111.387 81.914 L 110.918 81.914 Q 108.75 85.605 106.114 87.92 Q 103.477 90.234 100.166 91.289 Q 96.856 92.344 92.637 92.344 Q 86.485 92.344 82.618 89.766 Q 78.75 87.188 76.934 82.91 Q 75.118 78.633 75.118 73.535 Q 75.118 70.195 75.528 66.709 Q 75.938 63.223 76.582 60.117 Z M 255.176 91.172 L 228.633 91.172 L 256.348 57.305 L 244.219 24.785 L 268.946 24.785 L 273.399 43.184 L 284.297 24.785 L 311.192 24.785 L 283.946 58.535 L 297.305 91.172 L 272.227 91.172 L 267.539 71.953 L 255.176 91.172 Z M 73.711 11.836 L 65.039 29.707 Q 59.59 26.484 55.02 24.873 Q 50.45 23.262 45.528 23.262 Q 41.368 23.262 37.881 25.137 Q 34.395 27.012 31.67 30.352 Q 28.946 33.691 27.041 38.057 Q 25.137 42.422 24.17 47.49 Q 23.203 52.559 23.203 57.832 Q 23.203 65.625 26.514 69.521 Q 29.825 73.418 35.918 73.418 Q 41.133 73.418 46.114 72.129 Q 51.094 70.84 57.481 68.145 L 57.481 87.07 Q 51.211 89.883 44.795 91.113 Q 38.379 92.344 31.7 92.344 Q 20.977 92.344 13.946 88.154 Q 6.914 83.965 3.457 76.465 Q 0 68.965 0 59.004 Q 0 51.328 1.641 43.535 Q 3.282 35.742 6.739 28.682 Q 10.196 21.621 15.586 16.084 Q 20.977 10.547 28.418 7.354 Q 35.86 4.16 45.528 4.16 Q 54.082 4.16 60.879 6.182 Q 67.676 8.203 73.711 11.836 Z M 334.688 66.445 L 331.231 66.445 L 331.231 66.885 L 331.231 67.383 Q 331.231 71.836 333.633 73.945 Q 336.036 76.055 340.84 76.055 Q 345.879 76.055 350.391 74.531 Q 354.903 73.008 360.059 70.313 L 360.059 86.367 Q 354.727 89.063 349.043 90.703 Q 343.36 92.344 334.688 92.344 Q 326.309 92.344 320.45 89.18 Q 314.59 86.016 311.514 80.127 Q 308.438 74.238 308.438 66.094 Q 308.438 57.949 310.752 50.332 Q 313.067 42.715 317.784 36.68 Q 322.5 30.645 329.649 27.129 Q 336.797 23.613 346.465 23.613 Q 357.657 23.613 364.014 28.652 Q 370.371 33.691 370.371 42.07 Q 370.371 47.578 368.262 52.061 Q 366.153 56.543 361.787 59.766 Q 357.422 62.988 350.684 64.717 Q 343.946 66.445 334.688 66.445 Z M 168.164 91.172 L 145.489 91.172 L 159.493 24.785 L 177.598 24.785 L 176.543 35.859 L 177.012 35.859 Q 179.766 31.172 182.637 28.506 Q 185.508 25.84 188.994 24.727 Q 192.481 23.613 196.934 23.613 Q 198.223 23.613 199.659 23.76 Q 201.094 23.906 201.621 24.082 L 196.7 46.523 Q 195.411 45.996 193.536 45.615 Q 191.661 45.234 189.493 45.234 Q 186.856 45.234 184.541 46.084 Q 182.227 46.934 180.323 48.838 Q 178.418 50.742 176.924 53.994 Q 175.43 57.246 174.375 61.992 L 168.164 91.172 Z M 397.032 91.172 L 374.356 91.172 L 388.36 24.785 L 406.465 24.785 L 405.411 35.859 L 405.879 35.859 Q 408.633 31.172 411.504 28.506 Q 414.375 25.84 417.862 24.727 Q 421.348 23.613 425.801 23.613 Q 427.09 23.613 428.526 23.76 Q 429.961 23.906 430.489 24.082 L 425.567 46.523 Q 424.278 45.996 422.403 45.615 Q 420.528 45.234 418.36 45.234 Q 415.723 45.234 413.409 46.084 Q 411.094 46.934 409.19 48.838 Q 407.286 50.742 405.791 53.994 Q 404.297 57.246 403.243 61.992 L 397.032 91.172 Z M 220.606 91.172 L 197.93 91.172 L 217.207 0 L 239.883 0 L 220.606 91.172 Z M 333.516 52.266 L 335.215 52.266 Q 340.313 52.266 343.301 50.918 Q 346.289 49.57 347.578 47.52 Q 348.868 45.469 348.868 43.418 Q 348.868 41.543 347.696 40.254 Q 346.524 38.965 343.946 38.965 Q 341.309 38.965 339.082 41.016 Q 336.856 43.066 335.391 46.143 Q 333.926 49.219 333.516 52.266 Z"
                                    className="fill-[#1b1b18] dark:fill-[#EDEDEC]"
                                />
                            </svg>

                            {/* Decorative rule below wordmark */}
                            <div className="mt-6 flex items-center gap-3">
                                <span className="h-px flex-1 bg-[#1b1b18]/10 dark:bg-[#EDEDEC]/10" />
                                <span
                                    className="text-[9px] uppercase tracking-[0.2em] text-[#1b1b18]/25 dark:text-[#EDEDEC]/20"
                                    style={{ fontFamily: "'DM Mono', monospace" }}
                                >
                                    Domain Management
                                </span>
                                <span className="relative flex h-2 w-2 items-center justify-center">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E84C1E] opacity-30" />
                                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#E84C1E]" />
                                </span>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="relative z-10 flex items-center justify-between border-t border-[#1b1b18]/10 px-8 py-4 dark:border-[#EDEDEC]/10 lg:px-10">
                    <div
                        className="flex items-center gap-1.5 text-[11px] tracking-[0.06em] text-[#1b1b18]/35 dark:text-[#EDEDEC]/30"
                        style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                        {/* Status dot */}
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        </span>
                        All systems operational
                    </div>
                    <div
                        className="flex items-center gap-5 text-[11px] tracking-[0.06em] text-[#1b1b18]/30 dark:text-[#EDEDEC]/25"
                        style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                        <span>© 2025 Curlxer</span>
                        <span className="h-3 w-px bg-[#1b1b18]/15 dark:bg-[#EDEDEC]/15" />
                        <span>v1.0.1</span>
                    </div>
                </footer>
            </div>
        </>
    );
}