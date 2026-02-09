
import React from 'react';

export default function Contact() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
            <h1 className="text-3xl md:text-4xl font-bold text-sand-800 mb-8">Contact Us</h1>
            <div className="prose prose-sand max-w-none text-sand-600 mb-12">
                <p className="lead text-lg mb-6">
                    We'd love to hear from you. Please fill out the form below or reach out directly at support@makemyai.app.
                </p>

                <div className="bg-white p-8 rounded-lg shadow-md border border-sand-200">
                    <form className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-sand-700">Name</label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                autoComplete="name"
                                className="mt-1 block w-full rounded-md border-sand-300 shadow-sm focus:border-sand-500 focus:ring-sand-500 sm:text-sm px-4 py-2 border"
                                placeholder="Your Name"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-sand-700">Email</label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                autoComplete="email"
                                className="mt-1 block w-full rounded-md border-sand-300 shadow-sm focus:border-sand-500 focus:ring-sand-500 sm:text-sm px-4 py-2 border"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-sand-700">Message</label>
                            <textarea
                                id="message"
                                name="message"
                                rows={4}
                                className="mt-1 block w-full rounded-md border-sand-300 shadow-sm focus:border-sand-500 focus:ring-sand-500 sm:text-sm px-4 py-2 border"
                                placeholder="How can we help you?"
                            />
                        </div>
                        <div>
                            <button
                                type="submit"
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sand-600 hover:bg-sand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sand-500"
                            >
                                Send Message
                            </button>
                        </div>
                    </form>
                </div>

                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-sand-800 mb-4">Other Ways to Reach Us</h2>
                    <p>
                        <strong>Email:</strong> <a href="mailto:support@makemyai.app" className="text-sand-600 hover:text-sand-800 underline">support@makemyai.app</a>
                    </p>
                    <p>
                        <strong>Address:</strong><br />
                        Tohund Guide Business Consultants Private Limited<br />
                        [Your Address Here]<br />
                        [City, State, Zip Code]<br />
                        India
                    </p>
                </div>
            </div>
        </div>
    );
}
