import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Globe, Shield, Zap, BarChart3, Settings, Users } from 'lucide-react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welcome to Domina Checker">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                {/* Header */}
                <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/80">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600">
                                    <Globe className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-xl font-bold text-slate-900 dark:text-white">Domina Checker</span>
                            </div>
                            <nav className="flex items-center space-x-4">
                                {auth.user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="inline-flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
                                    >
                                        <BarChart3 className="mr-2 h-4 w-4" />
                                        Dashboard
                                    </Link>
                                ) : (
                                    <div className="flex items-center space-x-3">
                                        <Link
                                            href={route('login')}
                                            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                        >
                                            Sign in
                                        </Link>
                                        <Link
                                            href={route('register')}
                                            className="inline-flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
                                        >
                                            Get Started
                                        </Link>
                                    </div>
                                )}
                            </nav>
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <div className="relative overflow-hidden">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
                        <div className="text-center">
                            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl dark:text-white">
                                Professional
                                <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    Domain Checking
                                </span>
                                Platform
                            </h1>
                            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
                                Advanced domain availability checking with DNS optimization, batch processing, and comprehensive analytics. 
                                Built for developers, SEO specialists, and domain investors.
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-6">
                                {auth.user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="group relative rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105"
                                    >
                                        <span className="relative z-10">Go to Dashboard</span>
                                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route('register')}
                                            className="group relative rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105"
                                        >
                                            <span className="relative z-10">Start Free Trial</span>
                                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                        </Link>
                                        <Link
                                            href={route('login')}
                                            className="text-lg font-semibold leading-6 text-slate-900 hover:text-slate-700 dark:text-white dark:hover:text-slate-300"
                                        >
                                            Sign in <span aria-hidden="true">→</span>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Floating Elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-r from-blue-400/20 to-indigo-400/20 blur-3xl" />
                        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-r from-purple-400/20 to-pink-400/20 blur-3xl" />
                    </div>
                </div>

                {/* Features Section */}
                <div className="relative bg-white/60 backdrop-blur-xl dark:bg-slate-800/60">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                                Everything you need for domain management
                            </h2>
                            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
                                Powerful tools designed to streamline your domain checking workflow
                            </p>
                        </div>

                        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {/* Feature 1 */}
                            <div className="group relative rounded-2xl bg-white/80 p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:bg-slate-700/80">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg">
                                    <Zap className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="mt-6 text-xl font-semibold text-slate-900 dark:text-white">
                                    Lightning Fast Checking
                                </h3>
                                <p className="mt-4 text-slate-600 dark:text-slate-400">
                                    Optimized batch processing with configurable timeouts and parallel execution for maximum efficiency.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="group relative rounded-2xl bg-white/80 p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:bg-slate-700/80">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
                                    <Shield className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="mt-6 text-xl font-semibold text-slate-900 dark:text-white">
                                    DNS Optimization
                                </h3>
                                <p className="mt-4 text-slate-600 dark:text-slate-400">
                                    Custom DNS server configuration with auto-detection and performance tuning for reliable results.
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="group relative rounded-2xl bg-white/80 p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:bg-slate-700/80">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
                                    <BarChart3 className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="mt-6 text-xl font-semibold text-slate-900 dark:text-white">
                                    Advanced Analytics
                                </h3>
                                <p className="mt-4 text-slate-600 dark:text-slate-400">
                                    Comprehensive reporting with success rates, response times, and historical data visualization.
                                </p>
                            </div>

                            {/* Feature 4 */}
                            <div className="group relative rounded-2xl bg-white/80 p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:bg-slate-700/80">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-red-500 shadow-lg">
                                    <Settings className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="mt-6 text-xl font-semibold text-slate-900 dark:text-white">
                                    Performance Settings
                                </h3>
                                <p className="mt-4 text-slate-600 dark:text-slate-400">
                                    Customizable batch sizes, timeouts, and processing parameters to match your specific needs.
                                </p>
                            </div>

                            {/* Feature 5 */}
                            <div className="group relative rounded-2xl bg-white/80 p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:bg-slate-700/80">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 shadow-lg">
                                    <Users className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="mt-6 text-xl font-semibold text-slate-900 dark:text-white">
                                    User Management
                                </h3>
                                <p className="mt-4 text-slate-600 dark:text-slate-400">
                                    Secure authentication with role-based access control and personalized settings per user.
                                </p>
                            </div>

                            {/* Feature 6 */}
                            <div className="group relative rounded-2xl bg-white/80 p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:bg-slate-700/80">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 shadow-lg">
                                    <Globe className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="mt-6 text-xl font-semibold text-slate-900 dark:text-white">
                                    Global Reach
                                </h3>
                                <p className="mt-4 text-slate-600 dark:text-slate-400">
                                    Check domains from anywhere with our cloud-based platform and global DNS infrastructure.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                Ready to revolutionize your domain checking?
                            </h2>
                            <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">
                                Join thousands of professionals who trust Domina Checker for their domain management needs.
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-6">
                                {auth.user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="rounded-full bg-white px-8 py-4 text-lg font-semibold text-blue-600 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105"
                                    >
                                        Access Dashboard
                                    </Link>
                                ) : (
                                    <Link
                                        href={route('register')}
                                        className="rounded-full bg-white px-8 py-4 text-lg font-semibold text-blue-600 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105"
                                    >
                                        Get Started Free
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="bg-slate-900 dark:bg-slate-950">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                            <div className="col-span-1 md:col-span-2">
                                <div className="flex items-center space-x-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600">
                                        <Globe className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="text-xl font-bold text-white">Domina Checker</span>
                                </div>
                                <p className="mt-4 max-w-md text-slate-400">
                                    Professional domain checking platform with advanced DNS optimization, batch processing, and comprehensive analytics.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Product</h3>
                                <ul className="mt-4 space-y-2">
                                    <li><Link href="#" className="text-slate-300 hover:text-white transition-colors">Features</Link></li>
                                    <li><Link href="#" className="text-slate-300 hover:text-white transition-colors">Pricing</Link></li>
                                    <li><Link href="#" className="text-slate-300 hover:text-white transition-colors">API</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Support</h3>
                                <ul className="mt-4 space-y-2">
                                    <li><Link href="#" className="text-slate-300 hover:text-white transition-colors">Documentation</Link></li>
                                    <li><Link href="#" className="text-slate-300 hover:text-white transition-colors">Help Center</Link></li>
                                    <li><Link href="#" className="text-slate-300 hover:text-white transition-colors">Contact</Link></li>
                                </ul>
                            </div>
                        </div>
                        <div className="mt-12 border-t border-slate-800 pt-8">
                            <p className="text-center text-sm text-slate-400">
                                © 2024 Domina Checker. All rights reserved.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
