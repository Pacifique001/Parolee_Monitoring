/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import React, { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'; // Added ArrowLeft

// Ensure these paths are correct relative to your `public` folder of the React project
const policelogo = '/images/policelogo.png';
const loginImage = '/images/LoginImage.png';



export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { login, isLoading: authIsLoading } = useAuth(); // isLoading from context
    const [isSubmitting, setIsSubmitting] = useState(false); // Local form submission state
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);
        try {
            const loggedInUser = await login(email, password); // login now returns user or null

            if (loggedInUser) {
                // Perform redirection based on user type and role
                if (loggedInUser.user_type === 'admin' && loggedInUser.roles?.some(r => r.name === 'System Administrator')) {
                    navigate('/admin/dashboard', { replace: true });
                } else if (loggedInUser.user_type === 'officer' && loggedInUser.roles?.some(r => r.name === 'Parole Officer')) {
                    navigate('/officer/dashboard', { replace: true });
                } else if (loggedInUser.user_type === 'staff' && (loggedInUser.roles?.some(r => r.name === 'Case Manager') || loggedInUser.roles?.some(r => r.name === 'Support Staff'))) {
                    navigate('/staff/dashboard', { replace: true });
                } else {
                    // Fallback if user is authenticated but no specific portal/role matches
                    console.warn(`User ${loggedInUser.email} logged in with type ${loggedInUser.user_type} and roles ${loggedInUser.roles?.map(r=>r.name).join(', ')} but no portal redirect configured.`);
                    setError('Login successful, but no specific portal assigned for your role.');
                    
                }
            } else {
                
                setError('Login attempt failed to return user data.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials or account status.');
            console.error("Login page submit error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputStyle = "w-full py-3 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-purple-admin focus:border-brand-purple-admin text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 bg-white/80 dark:bg-gray-700/80";
    const primaryButtonStyle = "w-full flex justify-center bg-brand-purple-admin hover:bg-brand-purple-dark text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-purple-admin transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed";

    return (
        <div
            className="relative h-screen flex items-center justify-center bg-gray-200 dark:bg-gray-900 font-['Poppins'] p-4"
            style={{ backgroundImage: `url(${loginImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
            <div className="absolute inset-0 bg-black opacity-50 backdrop-brightness-75"></div>

            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-2xl p-8 sm:p-10 z-10 w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <img src={policelogo} alt="Parole Monitoring System Logo" className="h-12 sm:h-14 w-auto" />
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-2">
                    Welcome Back
                </h2>
                <p className="text-gray-700 dark:text-gray-300 text-sm text-center mb-6">
                    Sign in to access the Parole Monitoring System
                </p>

                {error && (
                    <div role="alert" className="mb-4 p-3 text-sm text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/50 rounded-md border border-red-300 dark:border-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="email_login_page" className="block text-gray-800 dark:text-gray-200 text-sm font-medium mb-1">
                            Email Address
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                                <Mail className="h-5 w-5" />
                            </span>
                            <input
                                type="email"
                                id="email_login_page"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className={inputStyle}
                                placeholder="your@email.com"
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password_login_page" className="block text-gray-800 dark:text-gray-200 text-sm font-medium mb-1">
                            Password
                        </label>
                        <div className="relative">
                             <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                                <Lock className="h-5 w-5" />
                            </span>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password_login_page"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className={`${inputStyle} pr-10`}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none p-1 rounded-full"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-end text-sm"> {/* Simplified to only show forgot password */}
                        <div>
                            <Link
                                to="/forgot-password"
                                className="font-medium text-brand-purple-admin hover:text-brand-purple-dark dark:text-brand-purple-light dark:hover:text-brand-purple underline"
                            >
                                Forgot your password?
                            </Link>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting || authIsLoading}
                            className={primaryButtonStyle}
                        >
                            {isSubmitting || authIsLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </div>
                </form>

                <p className="mt-8 text-center text-xs text-gray-600 dark:text-gray-400">
                    By signing in, you agree to our{' '}
                    <Link to="/terms-of-service" className="font-medium text-brand-purple-admin hover:underline">Terms</Link>
                    {' '}and{' '}
                    <Link to="/privacy-policy" className="font-medium text-brand-purple-admin hover:underline">Privacy Policy</Link>.
                </p>
                 <div className="mt-6 text-center">
                    <Link to="/" className="text-sm text-brand-purple-admin hover:text-brand-purple-dark flex items-center justify-center">
                        <ArrowLeft size={16} className="mr-1" />
                        Back to Landing Page
                    </Link>
                </div>
            </div>
        </div>
    );
}
