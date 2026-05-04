import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welcome" />

            <div className="relative min-h-screen bg-[#0b0b0c] text-white overflow-hidden">

                {/* 🔥 Gradient background */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(232,76,30,0.15),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.12),transparent_40%)]" />

                {/* Noise */}
                <div className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[url('/noise.png')]" />

                {/* HEADER */}
                <header className="relative z-10 flex items-center justify-between px-8 py-6">
                    <h1 className="font-semibold tracking-wide text-sm">
                        Curlxer<span className="text-[#E84C1E]">.</span>
                    </h1>

                    <nav className="flex items-center gap-4">
                        {auth.user ? (
                            <Link href={route('dashboard')} className="text-sm opacity-70 hover:opacity-100">
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href={route('login')} className="text-sm opacity-70 hover:opacity-100">
                                    Login
                                </Link>
                                <Link
                                    href={route('login')}
                                    className="px-4 py-2 rounded-md bg-white text-black text-sm font-medium hover:opacity-90"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                {/* HERO */}
                <main className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-20">

                    {/* Badge */}
                    <div className="mb-6 px-3 py-1 text-xs rounded-full border border-white/10 bg-white/5 backdrop-blur">
                        Minimal • Fast • Clean
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl md:text-6xl font-semibold leading-tight max-w-3xl">
                        Build faster. <br />
                        <span className="text-[#E84C1E]">Ship smarter.</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="mt-6 text-white/60 max-w-xl">
                        A modern foundation for building scalable apps with clarity and speed.
                    </p>

                    {/* CTA */}
                    <div className="mt-8 flex items-center gap-4">
                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                className="px-6 py-3 rounded-md bg-white text-black font-medium"
                            >
                                Go to dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="px-6 py-3 rounded-md bg-[#E84C1E] text-white font-medium shadow-lg shadow-orange-500/20 hover:opacity-90"
                                >
                                    Get Started
                                </Link>

                                <button className="px-6 py-3 rounded-md border border-white/10 text-white/70 hover:text-white hover:border-white/30">
                                    Live Preview
                                </button>
                            </>
                        )}
                    </div>

                    {/* PREVIEW CARD */}
                    <div className="mt-16 w-full max-w-5xl">
                        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-6">

                            {/* fake UI */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2 space-y-4">
                                    <div className="h-32 rounded-md bg-white/10" />
                                    <div className="h-24 rounded-md bg-white/10" />
                                </div>
                                <div className="space-y-4">
                                    <div className="h-20 rounded-md bg-white/10" />
                                    <div className="h-20 rounded-md bg-white/10" />
                                </div>
                            </div>

                        </div>
                    </div>
                </main>

                {/* FOOTER */}
                <footer className="relative z-10 text-center py-6 text-sm text-white/40">
                    © 2026 Curlxer — All systems operational
                </footer>
            </div>
        </>
    );
}