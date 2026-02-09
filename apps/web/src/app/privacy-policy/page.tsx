
import React from 'react';

export default function PrivacyPolicy() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
            <h1 className="text-3xl md:text-4xl font-bold text-sand-800 mb-8">Privacy Policy</h1>
            <div className="prose prose-sand max-w-none text-sand-600">
                <p className="lead text-lg mb-6">
                    Effective Date: {new Date().toLocaleDateString()}
                </p>

                <h2>1. Introduction</h2>
                <p>
                    Welcome to MakeMyAI.App ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy.
                    If you have any questions or concerns about this privacy notice or our practices with regard to your personal information, please contact us at support@makemyai.app.
                </p>

                <h2>2. Information We Collect</h2>
                <p>
                    We collect personal information that you voluntarily provide to us when you register on the Service, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Service, or otherwise when you contact us.
                </p>
                <ul>
                    <li><strong>Personal Information Provided by You:</strong> Names, email addresses, usernames, passwords, and other similar information.</li>
                    <li><strong>Social Media Login Data:</strong> We may provide you with the option to register with us using your existing social media account details, like your Facebook, Twitter, or other social media account.</li>
                </ul>

                <h2>3. How We Use Your Information</h2>
                <p>
                    We use personal information collected via our Service for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
                </p>
                <ul>
                    <li>To facilitate account creation and logon process.</li>
                    <li>To post testimonials.</li>
                    <li>To request feedback.</li>
                    <li>To send administrative information to you.</li>
                    <li>To protect our Services.</li>
                </ul>

                <h2>4. Will Your Information Be Shared With Anyone?</h2>
                <p>
                    We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.
                </p>

                <h2>5. Cookies and Web Beacons</h2>
                <p>
                    We may use cookies and similar tracking technologies (like web beacons and pixels) to access or store information.
                </p>

                <h2>6. How Long Do We Keep Your Information?</h2>
                <p>
                    We keep your information for as long as necessary to fulfill the purposes outlined in this privacy notice unless otherwise required by law.
                </p>

                <h2>7. How Do We Keep Your Information Safe?</h2>
                <p>
                    We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process.
                </p>

                <h2>8. Updates to This Notice</h2>
                <p>
                    We may update this privacy notice from time to time. The updated version will be indicated by an updated "Revised" date and the updated version will be effective as soon as it is accessible.
                </p>

                <h2>9. Contact Us</h2>
                <p>
                    If you have questions or comments about this notice, you may contact us by email at support@makemyai.app.
                </p>
            </div>
        </div>
    );
}
