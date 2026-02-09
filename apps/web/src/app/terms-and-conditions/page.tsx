
import React from 'react';

export default function TermsAndConditions() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
            <h1 className="text-3xl md:text-4xl font-bold text-sand-800 mb-8">Terms and Conditions</h1>
            <div className="prose prose-sand max-w-none text-sand-600">
                <p className="lead text-lg mb-6">
                    Effective Date: {new Date().toLocaleDateString()}
                </p>

                <h2>1. Introduction</h2>
                <p>
                    These terms and conditions govern your use of the MakeMyAI.App website and any related services (collectively, the "Service").
                    By accessing or using the Service, you agree to be bound by these terms. If you disagree with any part of the terms, then you may not access the Service.
                </p>

                <h2>2. Acceptable Use</h2>
                <p>
                    You agree not to use the Service for any unlawful purpose or in any way that could damage, disable, overburden, or impair the Service.
                </p>

                <h2>3. User Content</h2>
                <p>
                    You are solely responsible for any content that you post or upload to the Service. You retain all of your ownership rights in your User Content.
                </p>

                <h2>4. Intellectual Property</h2>
                <p>
                    The Service and its original content (excluding User Content), features, and functionality are and will remain the exclusive property of MakeMyAI.App and its licensors.
                </p>

                <h2>5. Termination</h2>
                <p>
                    We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                </p>

                <h2>6. Limitation of Liability</h2>
                <p>
                    In no event shall MakeMyAI.App, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                </p>

                <h2>7. Changes to Terms</h2>
                <p>
                    We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                </p>

                <h2>8. Governing Law</h2>
                <p>
                    These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.
                </p>

                <h2>9. Contact Us</h2>
                <p>
                    If you have any questions about these Terms, please contact us at support@makemyai.app.
                </p>
            </div>
        </div>
    );
}
