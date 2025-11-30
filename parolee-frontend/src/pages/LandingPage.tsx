import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function LandingPage() {
    const currentYear = new Date().getFullYear();
    const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});
    const [currentWord, setCurrentWord] = useState(0);
    
    const heroWords = ['Next-Generation', 'Advanced', 'Intelligent', 'Revolutionary'];
    
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentWord((prev) => (prev + 1) % heroWords.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [heroWords.length]);

    // Intersection Observer setup
    const observeElement = (id: string) => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                // Update visibility state for the specific ID
                setIsVisible(prev => ({ ...prev, [id]: entry.isIntersecting }));
            },
            { threshold: 0.1 } // Trigger when 10% of the element is visible
        );
        
        const element = document.getElementById(id);
        if (element) {
            observer.observe(element);
        }
        
        // Cleanup function to unobserve
        return () => {
            if (element) {
                observer.unobserve(element);
            }
            observer.disconnect();
        };
    };

    useEffect(() => {
        // IDs of elements to observe
        const sectionsToObserve = ['features', 'about', 'contact'];
        const cleanups = sectionsToObserve.map(id => observeElement(id));
        
        // Call all cleanup functions on component unmount
        return () => {
            cleanups.forEach(cleanup => cleanup());
        };
    }, []); // Empty dependency array: run once on mount, cleanup on unmount

    // Smooth scroll handler for navigation links
    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
        e.preventDefault();
        const element = document.getElementById(targetId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-white text-gray-800 antialiased overflow-x-hidden">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute top-40 right-10 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            </div>

            <style>
                {`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes slideInFromLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-50px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes slideInFromRight {
                    from {
                        opacity: 0;
                        transform: translateX(50px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.8);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(67, 56, 202, 0.4); }
                    50% { box-shadow: 0 0 40px rgba(67, 56, 202, 0.6); }
                }
                
                .animate-fadeInUp {
                    animation: fadeInUp 0.8s ease-out forwards;
                }
                
                .animate-slideInLeft {
                    animation: slideInFromLeft 0.8s ease-out forwards;
                }
                
                .animate-slideInRight {
                    animation: slideInFromRight 0.8s ease-out forwards;
                }
                
                .animate-scaleIn {
                    animation: scaleIn 0.6s ease-out forwards;
                }
                
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
                
                .animate-pulse-glow {
                    animation: pulse-glow 2s ease-in-out infinite;
                }
                
                .text-gradient {
                    background: linear-gradient(135deg, #4338ca, #7c3aed);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    text-fill-color: transparent;
                }
                
                .glass-effect {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                .hover-lift {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .hover-lift:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                }
                
                .typing-animation {
                    display: inline-block;
                    border-right: 2px solid #4338ca; /* Cursor color */
                    animation: blink 1s infinite;
                    white-space: nowrap; 
                    overflow: hidden; 
                    vertical-align: bottom; /* Aligns better with surrounding text */
                }
                
                @keyframes blink {
                    0%, 50% { border-color: transparent; }
                    51%, 100% { border-color: #4338ca; } /* Cursor color */
                }
                html {
                    scroll-behavior: smooth; /* Enables smooth scrolling for the whole page if not overridden by JS */
                }
            `}
            </style>

            {/* Header */}
            <header className="bg-white/90 backdrop-blur-sm px-4 py-4 shadow-sm sticky top-0 z-50 animate-slideInLeft">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center group">
                        <svg
                            className="mr-2 h-8 w-auto text-indigo-800 transform group-hover:rotate-12 transition-transform duration-300"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                           <path d="M12 2L3 7v10l9 5 9-5V7L12 2zm0 2.31L19.28 9 12 13.69 4.72 9 12 4.31zM4 8.24L11 12.5V19.4L4 15.17V8.24zm16 0V15.17L13 19.4V12.5L20 8.24z"/>
                        </svg>
                        <span className="text-xl font-semibold text-gray-800 group-hover:text-indigo-800 transition-colors duration-300">
                            Parolee Monitoring
                        </span>
                    </div>
                    <nav className="flex items-center space-x-6">
                        {[
                            { label: 'Home', targetId: 'home' },
                            { label: 'About Us', targetId: 'about' },
                            { label: 'Contact Us', targetId: 'contact' }
                        ].map((item, index) => (
                            <Link
                                key={item.label}
                                to={`#${item.targetId}`}
                                onClick={(e) => handleNavClick(e, item.targetId)}
                                className="text-sm font-medium text-gray-800 transition-all duration-300 hover:text-gray-600 hover:scale-105 relative group"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                {item.label}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-800 transition-all duration-300 group-hover:w-full"></span>
                            </Link>
                        ))}
                        <Link
                            to="/login"
                            className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:bg-indigo-800 hover:scale-105 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white animate-pulse-glow"
                        >
                            Login
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section
                id="home"
                className="bg-gradient-to-br from-indigo-800 via-indigo-900 to-purple-900 px-4 pb-16 pt-16 text-white relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30"></div>
                <div className="container mx-auto text-center relative z-10">
                    <div className="animate-fadeInUp">
                        <h1 className="mb-6 text-4xl font-bold leading-tight sm:text-5xl">
                            <span className="typing-animation min-h-[1.2em] sm:min-h-[1.2em]"> {/* min-h to prevent layout shift */}
                                {heroWords[currentWord]}  {/* Ensure space for cursor */}
                            </span>
                            <br />
                            <span className="text-gradient bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                                Parole Monitoring System
                            </span>
                        </h1>
                        <p className="mx-auto mb-10 max-w-2xl text-lg text-indigo-200 animate-slideInLeft" style={{ animationDelay: '0.3s' }}>
                            Empowering law enforcement with AI-driven insights
                            and real-time monitoring
                        </p>
                        <Link
                            to="/login"
                            className="inline-block rounded-lg bg-white px-8 py-4 text-lg font-semibold text-indigo-800 shadow-xl transition-all duration-300 hover:bg-gray-100 hover:scale-105 hover:shadow-2xl animate-float group"
                            style={{ animationDelay: '0.6s' }}
                        >
                            Get started 
                            <span className="inline-block ml-2 transform group-hover:translate-x-1 transition-transform duration-300">→</span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="bg-white py-12 relative z-10">
                <div className="container mx-auto px-4">
                    <div className={`grid gap-6 md:grid-cols-3 ${isVisible.features ? 'animate-fadeInUp' : 'opacity-0'}`}>
                        {[
                            {
                                icon: (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                                    />
                                ),
                                title: "User Management",
                                description: "Comprehensive system for managing parolees, officers, and staff members.",
                                delay: "0s"
                            },
                            {
                                icon: (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-7.5h12m-12 0a9 9 0 0112 0z"
                                    />
                                ),
                                title: "AI Insights",
                                description: "Advanced analytics and predictions powered by artificial intelligence.",
                                delay: "0.2s"
                            },
                            {
                                icon: (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z"
                                    />
                                ),
                                title: "Real-time Monitoring",
                                description: "Live tracking and instant alerts for enhanced supervision.",
                                delay: "0.4s"
                            }
                        ].map((feature) => (
                            <div
                                key={feature.title}
                                className="rounded-lg border border-gray-200 p-6 shadow-sm hover-lift group cursor-pointer"
                                style={{ animationDelay: feature.delay }} // Apply individual delay for staggered animation if main container is already animated
                            >
                                <div className="mb-4 flex justify-center">
                                    <div className="p-3 rounded-full bg-indigo-50 group-hover:bg-indigo-100 transition-colors duration-300">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className="h-10 w-10 text-indigo-700 group-hover:scale-110 transition-transform duration-300"
                                        >
                                            {feature.icon}
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="mb-2 text-center text-xl font-semibold text-gray-800 group-hover:text-indigo-800 transition-colors duration-300">
                                    {feature.title}
                                </h3>
                                <p className="text-center text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About Us Section */}
            <section id="about" className="bg-gradient-to-r from-gray-50 to-gray-100 py-12 relative">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22%23000%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M20%2020c0%204.4-3.6%208-8%208s-8-3.6-8-8%203.6-8%208-8%208%203.6%208%208zm0-20c0%204.4-3.6%208-8%208s-8-3.6-8-8%203.6-8%208-8%208%203.6%208%208zm20%200c0%204.4-3.6%208-8%208s-8-3.6-8-8%203.6-8%208-8%208%203.6%208%208zm0%2020c0%204.4-3.6%208-8%208s-8-3.6-8-8%203.6-8%208-8%208%203.6%208%208z%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50"></div>
                <div className={`container mx-auto px-4 text-center relative z-10 ${isVisible.about ? 'animate-fadeInUp' : 'opacity-0'}`}>
                    <h2 className="mb-4 text-3xl font-bold text-gray-800 animate-slideInLeft"> 
                        About Us
                    </h2>
                    <p className="mx-auto mb-8 max-w-3xl text-gray-600 animate-slideInRight" style={{ animationDelay: '0.2s' }}>
                        Dedicated to revolutionizing parole management through technology
                    </p>
                    <div className="mx-auto max-w-3xl space-y-6 text-left">
                        {[
                            "ParoleGuard is at the forefront of modernizing law enforcement and rehabilitation systems. Our platform combines cutting-edge technology with practical solutions to create a more effective and efficient parole management process.",
                            "We work closely with law enforcement agencies, rehabilitation centers, and correctional facilities to provide comprehensive solutions that benefit all stakeholders in the rehabilitation process.",
                            "Our mission is to enhance public safety while supporting successful rehabilitation and reintegration of parolees into society."
                        ].map((paragraph, index) => (
                            <div
                                key={index}
                                className={`glass-effect rounded-lg p-6 text-gray-700 hover-lift ${isVisible.about ? 'animate-scaleIn' : 'opacity-0'}`} // individual items can also animate
                                style={{ animationDelay: `${0.4 + index * 0.15}s` }} // Stagger animation for paragraphs
                            >
                                <p className="leading-relaxed">{paragraph}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Us Section */}
            <section id="contact" className={`bg-white py-12 relative ${isVisible.contact ? 'animate-fadeInUp' : 'opacity-0'}`}>
                <div className="container mx-auto px-4">
                    <div className="mb-8 text-center">
                        <h2 className={`mb-4 text-3xl font-bold text-gray-800 ${isVisible.contact ? 'animate-slideInLeft' : 'opacity-0'}`}>
                            Contact Us
                        </h2>
                        <p className={`mx-auto max-w-xl text-gray-600 ${isVisible.contact ? 'animate-slideInRight' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
                            Get in touch with our team for more information
                        </p>
                    </div>
                    <div className="mx-auto grid max-w-4xl items-start gap-8 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 p-8 shadow-xl md:grid-cols-2 hover-lift">
                        <div className={`${isVisible.contact ? 'animate-slideInLeft' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
                            <h3 className="mb-6 text-xl font-semibold text-gray-800">
                                Contact information
                            </h3>
                            <div className="space-y-4">
                                {[
                                    {
                                        icon: (
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                                            />
                                        ),
                                        text: "+250789216438"
                                    },
                                    {
                                        icon: (
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                                            />
                                        ),
                                        text: "tuyizerepacifique053@gmail.com"
                                    },
                                    {
                                        icon: (
                                            <>
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
                                            </>
                                        ),
                                        text: "Kigali, Rwanda"
                                    }
                                ].map((item, index) => (
                                    <div key={index} className="flex items-center group hover:scale-105 transition-transform duration-300">
                                        <div className="mr-3 p-2 rounded-full bg-indigo-50 group-hover:bg-indigo-100 transition-colors duration-300">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="h-5 w-5 text-indigo-700"
                                            >
                                                {item.icon}
                                            </svg>
                                        </div>
                                        <span className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                                            {item.text}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <form
                            className={`space-y-4 ${isVisible.contact ? 'animate-slideInRight' : 'opacity-0'}`}
                            style={{ animationDelay: '0.5s' }}
                            onSubmit={(e) => e.preventDefault()}
                        >
                            {[
                                { name: 'name', type: 'text', label: 'Name', autoComplete: 'name' },
                                { name: 'email', type: 'email', label: 'Email', autoComplete: 'email' }
                            ].map((field) => (
                                <div key={field.name}>
                                    <label
                                        htmlFor={field.name}
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        {field.label}
                                    </label>
                                    <input
                                        type={field.type}
                                        name={field.name}
                                        id={field.name}
                                        autoComplete={field.autoComplete}
                                        required
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2 sm:text-sm transition-all duration-300 hover:border-gray-400"
                                    />
                                </div>
                            ))}
                            <div>
                                <label
                                    htmlFor="message"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Message
                                </label>
                                <textarea
                                    name="message"
                                    id="message"
                                    rows={4}
                                    required
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2 sm:text-sm transition-all duration-300 hover:border-gray-400 resize-none"
                                ></textarea>
                            </div>
                            <div>
                                <button
                                    type="submit"
                                    className="flex w-full justify-center rounded-md border border-transparent bg-indigo-700 px-4 py-3 text-base font-medium text-white shadow-sm transition-all duration-300 hover:bg-indigo-800 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 group"
                                >
                                    Send Message
                                    <span className="ml-2 transform group-hover:translate-x-1 transition-transform duration-300">✉</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="mt-auto bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 py-8 text-gray-400 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="mb-8 grid gap-8 md:grid-cols-3">
                        <div className="animate-slideInLeft" style={{animationDelay: '0s'}}>
                            <div className="mb-4 flex items-center group">
                                <svg
                                    className="mr-2 h-8 w-auto text-white group-hover:rotate-12 transition-transform duration-300"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                   <path d="M12 2L3 7v10l9 5 9-5V7L12 2zm0 2.31L19.28 9 12 13.69 4.72 9 12 4.31zM4 8.24L11 12.5V19.4L4 15.17V8.24zm16 0V15.17L13 19.4V12.5L20 8.24z"/>
                                </svg>
                                <h3 className="text-xl font-semibold text-white group-hover:text-indigo-200 transition-colors duration-300">
                                    ParoleGuard
                                </h3>
                            </div>
                            <p className="text-sm leading-relaxed">
                                Advancing parole management through
                                innovation and technology.
                            </p>
                        </div>
                        <div className="animate-slideInLeft" style={{ animationDelay: '0.2s' }}>
                            <h4 className="mb-3 text-lg font-semibold text-white">
                                Quick Links
                            </h4>
                            <ul className="space-y-2 text-sm">
                                {[
                                    { label: 'Home', targetId: 'home' },
                                    { label: 'About Us', targetId: 'about' },
                                    { label: 'Contact Us', targetId: 'contact' }
                                ].map((item) => (
                                    <li key={item.label}>
                                        <Link
                                            to={`#${item.targetId}`}
                                            onClick={(e) => handleNavClick(e, item.targetId)}
                                            className="transition-all duration-300 hover:text-white hover:translate-x-1 inline-block group"
                                        >
                                            <span className="group-hover:border-b border-white pb-0.5">
                                                {item.label}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="animate-slideInRight" style={{ animationDelay: '0.4s' }}>
                            <h4 className="mb-3 text-lg font-semibold text-white">
                                Legal
                            </h4>
                            <ul className="space-y-2 text-sm">
                                {[
                                    { text: 'Privacy Policy', link: '/privacy-policy' },
                                    { text: 'Terms and Services', link: '/terms' },
                                    { text: 'Cookies Policy', link: '/cookies' }
                                ].map((item) => (
                                    <li key={item.text}>
                                        <Link
                                            to={item.link}
                                            className="transition-all duration-300 hover:text-white hover:translate-x-1 inline-block group"
                                        >
                                            <span className="group-hover:border-b border-white pb-0.5">
                                                {item.text}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-700 pt-6 text-center text-sm">
                        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
                            <p className="animate-fadeInUp" style={{animationDelay: '0s'}}>
                                © {currentYear} ParoleGuard. All rights reserved.
                            </p>
                            <div className="flex space-x-4 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                                {['Facebook', 'Twitter', 'LinkedIn'].map((social, index) => (
                                    <a
                                        key={social}
                                        href={`https://www.${social.toLowerCase()}.com`} // Example link
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-8 h-8 rounded-full bg-gray-700 hover:bg-indigo-600 transition-all duration-300 hover:scale-110 flex items-center justify-center group"
                                        style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                                        aria-label={`ParoleGuard on ${social}`}
                                    >
                                        <span className="text-xs font-semibold group-hover:text-white">
                                            {social.charAt(0)}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}