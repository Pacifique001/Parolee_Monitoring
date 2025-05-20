import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
    const currentYear = new Date().getFullYear();

    return (
        <div className="flex min-h-screen flex-col bg-white text-gray-800 antialiased">
            {/* Header */}
            <header className="bg-white px-4 py-4 shadow-sm">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center">
                        <svg
                            className="mr-2 h-8 w-auto text-indigo-800"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998a12.078 12.078 0 01.665-6.479L12 14z" />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998a12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                            />
                        </svg>
                        <span className="text-xl font-semibold text-gray-800">
                            Parolee Monitoring
                        </span>
                    </div>
                    <nav className="flex items-center space-x-6">
                        <Link
                            to="#home"
                            className="text-sm font-medium text-gray-800 transition-colors hover:text-gray-600"
                        >
                            Home
                        </Link>
                        <Link
                            to="#about"
                            className="text-sm font-medium text-gray-800 transition-colors hover:text-gray-600"
                        >
                            About Us
                        </Link>
                        <Link
                            to="#contact"
                            className="text-sm font-medium text-gray-800 transition-colors hover:text-gray-600"
                        >
                            Contact Us
                        </Link>
                        <Link
                            to="/login"
                            className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                            Login
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section
                id="home"
                className="bg-indigo-800 px-4 pb-16 pt-16 text-white"
            >
                <div className="container mx-auto text-center">
                    <h1 className="mb-6 text-4xl font-bold leading-tight sm:text-5xl">
                        Next-Generation Parole Monitoring System
                    </h1>
                    <p className="mx-auto mb-10 max-w-2xl text-lg text-indigo-200">
                        Empowering law enforcement with AI-driven insights
                        and real-time monitoring
                    </p>
                    <Link
                        to="/login"
                        className="inline-block rounded-lg bg-white px-6 py-3 text-lg font-semibold text-indigo-800 shadow-md transition-colors hover:bg-gray-100"
                    >
                        Get started &gt;
                    </Link>
                </div>
            </section>

                {/* Features Section */}
                <section className="bg-white py-12">
                    <div className="container mx-auto px-4">
                        <div className="grid gap-6 md:grid-cols-3">
                            <div className="rounded-lg border border-gray-200 p-6 shadow-sm">
                                <div className="mb-4 flex justify-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="h-10 w-10 text-indigo-700"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="mb-2 text-center text-xl font-semibold text-gray-800">
                                    User Management
                                </h3>
                                <p className="text-center text-sm text-gray-600">
                                    Comprehensive system for managing parolees,
                                    officers, and staff members.
                                </p>
                            </div>
                            <div className="rounded-lg border border-gray-200 p-6 shadow-sm">
                                <div className="mb-4 flex justify-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="h-10 w-10 text-indigo-700"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-7.5h12m-12 0a9 9 0 0112 0z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="mb-2 text-center text-xl font-semibold text-gray-800">
                                    AI Insights
                                </h3>
                                <p className="text-center text-sm text-gray-600">
                                    Advanced analytics and predictions powered
                                    by artificial intelligence.
                                </p>
                            </div>
                            <div className="rounded-lg border border-gray-200 p-6 shadow-sm">
                                <div className="mb-4 flex justify-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="h-10 w-10 text-indigo-700"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="mb-2 text-center text-xl font-semibold text-gray-800">
                                    Real-time Monitoring
                                </h3>
                                <p className="text-center text-sm text-gray-600">
                                    Live tracking and instant alerts for
                                    enhanced supervision.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* About Us Section */}
                <section id="about" className="bg-gray-100 py-12">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="mb-4 text-3xl font-bold text-gray-800">
                            About Us
                        </h2>
                        <p className="mx-auto mb-8 max-w-3xl text-gray-600">
                            Dedicated to revolutionizing parole management
                            through technology
                        </p>
                        <div className="mx-auto max-w-3xl space-y-4 text-left text-gray-600">
                            <p>
                                ParoleGuard is at the forefront of modernizing
                                law enforcement and rehabilitation systems. Our
                                platform combines cutting-edge technology with
                                practical solutions to create a more effective
                                and efficient parole management process.
                            </p>
                            <p>
                                We work closely with law enforcement agencies,
                                rehabilitation centers, and correctional
                                facilities to provide comprehensive solutions
                                that benefit all stakeholders in the
                                rehabilitation process.
                            </p>
                            <p>
                                Our mission is to enhance public safety while
                                supporting successful rehabilitation and
                                reintegration of parolees into society.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Contact Us Section */}
                <section id="contact" className="bg-white py-12">
                    <div className="container mx-auto px-4">
                        <div className="mb-8 text-center">
                            <h2 className="mb-4 text-3xl font-bold text-gray-800">
                                Contact Us
                            </h2>
                            <p className="mx-auto max-w-xl text-gray-600">
                                Get in touch with our team for more information
                            </p>
                        </div>
                        <div className="mx-auto grid max-w-4xl items-start gap-8 rounded-lg bg-gray-100 p-6 shadow-lg md:grid-cols-2">
                            <div>
                                <h3 className="mb-6 text-xl font-semibold text-gray-800">
                                    Contact information
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className="mr-3 h-5 w-5 text-indigo-700"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                                            />
                                        </svg>
                                        <span className="text-gray-600">
                                            +250789216438
                                        </span>
                                    </div>
                                    <div className="flex items-center">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className="mr-3 h-5 w-5 text-indigo-700"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                                            />
                                        </svg>
                                        <span className="text-gray-600">
                                            tuyizerepacifique053@gmail.com
                                        </span>
                                    </div>
                                    <div className="flex items-center">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className="mr-3 h-5 w-5 text-indigo-700"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                                            />
                                        </svg>
                                        <span className="text-gray-600">
                                            Kigali, Rwanda
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <form
                                className="space-y-4"
                                onSubmit={(e) => e.preventDefault()}
                            >
                                <div>
                                    <label
                                        htmlFor="name"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        id="name"
                                        autoComplete="name"
                                        required
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        id="email"
                                        autoComplete="email"
                                        required
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="message"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Message
                                    </label>
                                    <textarea
                                        name="message"
                                        id="message"
                                        rows={4}
                                        required
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    ></textarea>
                                </div>
                                <div>
                                    <button
                                        type="submit"
                                        className="flex w-full justify-center rounded-md border border-transparent bg-indigo-700 px-4 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                    >
                                        Send Message
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>


            {/* Footer */}
            <footer className="mt-auto bg-gray-900 py-8 text-gray-400">
                <div className="container mx-auto px-4">
                <div className="mb-8 grid gap-8 md:grid-cols-3">
                            <div>
                                <div className="mb-4 flex items-center">
                                    <svg
                                        className="mr-2 h-8 w-auto text-white"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 14l9-5-9-5-9 5 9 5z" />
                                        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998a12.078 12.078 0 01.665-6.479L12 14z" />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998a12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                                
                                
                                />
                                    </svg>
                                    <h3 className="text-xl font-semibold text-white">
                                        ParoleGuard
                                    </h3>
                                </div>
                                <p className="text-sm">
                                    Advancing parole management through
                                    innovation and technology.
                                </p>
                            </div>
                            <div>
                                <h4 className="mb-3 text-lg font-semibold text-white">
                                    Quick Links
                                </h4>
                                <ul className="space-y-2 text-sm">
                                    <li>
                                        <Link
                                            href="#home"
                                            className="transition-colors hover:text-white"
                                        >
                                            Home
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#about"
                                            className="transition-colors hover:text-white"
                                        >
                                            About Us
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#contact"
                                            className="transition-colors hover:text-white"
                                        >
                                            Contact Us
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="mb-3 text-lg font-semibold text-white">
                                    Legal
                                </h4>
                                <ul className="space-y-2 text-sm">
                                    <li>
                                        <Link
                                            href="/privacy-policy"
                                            className="transition-colors hover:text-white"
                                        >
                                            Privacy Policy
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/terms"
                                            className="transition-colors hover:text-white"
                                        >
                                            Terms and Services
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/cookies"
                                            className="transition-colors hover:text-white"
                                        >
                                            Cookies Policy
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    <div className="border-t border-gray-700 pt-6 text-center text-sm">
                        <p>
                            © {currentYear} ParoleGuard. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
} 