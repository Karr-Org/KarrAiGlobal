import Link from 'next/link';
import {
    Sparkles,
    Shield,
    Zap,
    Globe,
    ArrowRight,
    CheckCircle,
    MessageSquare,
    FileText,
    Calendar
} from 'lucide-react';

export default function HomePage() {
    return (
        <div className="min-h-screen">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">Karr AI Global</span>
                        </div>
                        <div className="hidden md:flex items-center gap-8">
                            <Link href="#features" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                                Features
                            </Link>
                            <Link href="#products" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                                Products
                            </Link>
                            <Link href="#pricing" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                                Pricing
                            </Link>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* <Link href="/auth/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                                Sign In
                            </Link> */}
                            <Link href="#products" className="btn-primary">
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-6">
                        <Sparkles className="w-4 h-4" />
                        <span>Universal Professional Intelligence</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6">
                        Your AI Partner for
                        <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                            {' '}Every Domain
                        </span>
                    </h1>

                    <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-10">
                        Tailored AI solutions for professionals, businesses, and individuals globally.
                        Powered by specialized knowledge bases for any industry.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="#products" className="btn-primary text-lg px-8 py-3">
                            Explore Solutions
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Link>
                        <Link href="#demo" className="btn-outline text-lg px-8 py-3">
                            Watch Demo
                        </Link>
                    </div>

                    <div className="flex items-center justify-center gap-8 mt-12 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Global Availability</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Domain Agnostic</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Verified Accuracy</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                            Limitless Possibilities
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Powerful features designed for any use case, from legal to creative.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<MessageSquare />}
                            title="Intelligent Chat"
                            description="Ask complex questions in natural language and get accurate, context-aware answers instantly."
                        />
                        <FeatureCard
                            icon={<FileText />}
                            title="Deep Analysis"
                            description="Upload contracts, reports, or creative drafts for instant AI-powered analysis and insights."
                        />
                        <FeatureCard
                            icon={<Calendar />}
                            title="Smart Actions"
                            description="Automate workflows, schedule tasks, and integrate with your favorite tools seamlessly."
                        />
                        <FeatureCard
                            icon={<Shield />}
                            title="Verified Knowledge"
                            description="Every answer is backed by your specific reliable sources and private data."
                        />
                        <FeatureCard
                            icon={<Zap />}
                            title="Product Factory"
                            description="Create custom AI assistants for specific domains in minutes, not months."
                        />
                        <FeatureCard
                            icon={<Globe />}
                            title="Global Reach"
                            description="Multi-language support and cross-border intelligence at your fingertips."
                        />
                    </div>
                </div>
            </section>

            {/* Products Section */}
            <section id="products" className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                            Specialized AI Products
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Domain-specific AI assistants for every need
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <ProductCard
                            title="GST AI"
                            description="Example: Complete GST compliance assistant."
                            href="/gst-ai"
                            color="primary"
                            available
                        />
                        <ProductCard
                            title="Income Tax AI"
                            description="Personal and corporate income tax planning and compliance."
                            href="/income-tax-ai"
                            color="secondary"
                            comingSoon
                        />
                        <ProductCard
                            title="Companies Act AI"
                            description="Corporate law, compliance, and MCA filings made simple."
                            href="/companies-ai"
                            color="accent"
                            comingSoon
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-br from-primary-700 to-primary-900">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                        Ready to Transform Your Practice?
                    </h2>
                    <p className="text-lg text-primary-100 mb-10 max-w-2xl mx-auto">
                        Join thousands of professionals who save hours every day with Karr AI.
                    </p>
                    <Link href="#products" className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
                        Browse Products
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-white">Karr AI Global</span>
                        </div>
                        <p className="text-gray-400 text-sm">
                            © 2026 Karr AI Global. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="card p-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </div>
    );
}

function ProductCard({
    title,
    description,
    href,
    color,
    available,
    comingSoon
}: {
    title: string;
    description: string;
    href: string;
    color: 'primary' | 'secondary' | 'accent';
    available?: boolean;
    comingSoon?: boolean;
}) {
    const colorClasses = {
        primary: 'from-primary-500 to-primary-700',
        secondary: 'from-secondary-500 to-secondary-700',
        accent: 'from-accent-500 to-accent-700',
    };

    return (
        <div className="card overflow-hidden group">
            <div className={`h-2 bg-gradient-to-r ${colorClasses[color]}`} />
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
                    {comingSoon && (
                        <span className="badge bg-gray-100 text-gray-600">Coming Soon</span>
                    )}
                    {available && (
                        <span className="badge-success">Available</span>
                    )}
                </div>
                <p className="text-gray-600 mb-6">{description}</p>
                <Link
                    href={available ? href : '#'}
                    className={`btn-outline w-full ${comingSoon ? 'opacity-50 cursor-not-allowed' : 'group-hover:bg-gray-50'}`}
                >
                    {available ? 'Try Now' : 'Notify Me'}
                </Link>
            </div>
        </div>
    );
}
