import React, { useState, type FormEvent } from 'react';
import { Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';


const policelogo = '/images/policelogo.png';  // Image should be in public/images/
const loginImage = '/images/LoginImage.png';  // Image should be in public/images/


function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { login, isLoading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            await login(email, password);
            navigate('/admin/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
            console.error(err);
        }
    };

    return (
        <div className="relative h-screen flex items-center justify-center bg-gray-100 font-['Poppins']">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${loginImage})` }}
            >
                <div className="absolute inset-0 bg-black opacity-50"></div>
            </div>

            {/* Login Form Container */}
            <div className="relative bg-white bg-opacity-50 backdrop-blur-sm rounded-lg shadow-xl p-8 md:p-10 z-10 w-full max-w-md">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <img src={policelogo} alt="Parolee Monitoring Logo" className="h-12" />
                </div>

                {/* Welcome Message */}
                <h2 className="text-2xl font-bold text-black text-center mb-2">Welcome Back</h2>
                <p className="text-gray-900 text-sm text-center mb-6">Sign in to access the Parolee Monitoring System</p>

                {error && (
                    <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-md">
                        {error}
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-gray-900 text-sm font-medium mb-2">
                            Email Address
                        </label>
                        <div className="relative">
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full py-3 pl-10 pr-4 border border-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 placeholder-gray-400"
                                placeholder="Enter your email"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                                <Mail className="h-5 w-5" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-gray-900 text-sm font-medium mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full py-3 pl-4 pr-10 border border-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 placeholder-gray-400"
                                placeholder="Enter your password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-600 focus:outline-none"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input 
                                type="checkbox" 
                                id="remember" 
                                className="mr-2 form-checkbox h-4 w-4 text-blue-500 rounded focus:ring-blue-500" 
                            />
                            <label htmlFor="remember" className="text-gray-600 text-sm">Remember me</label>
                        </div>
                        <div className="text-sm">
                        <Link // Use react-router-dom Link
                            to="/forgot-password" // Corrected path
                            className="font-medium text-brand-purple hover:text-brand-purple-dark dark:text-brand-purple-light dark:hover:text-brand-purple"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </div>
                </form>

                {/* Footer */}
                <p className="text-white  text-xs text-center mt-6">
                    By signing in, you agree to our <a href="#" className="underline text-blue-300 hover:text-gray-600">Terms</a> and <a href="#" className="underline text-blue-300 hover:text-gray-600">Privacy Policy</a>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;