// src/pages/ForgotPasswordPage.tsx
import React, { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import { Mail, ArrowLeft } from 'lucide-react';

const policelogo = '/images/policelogo.png';
const loginImage = '/images/LoginImage.png';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);
        setError(null);
        try {
            const response = await apiClient.post('/forgot-password', { email });
            setMessage(response.data.message || 'If your email is registered, an OTP has been sent.');
            // Navigate to OTP entry page, passing email along
            navigate(`/reset-password?email=${encodeURIComponent(email)}`);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative h-screen flex items-center justify-center bg-gray-100 font-['Poppins']" style={{ backgroundImage: `url(${loginImage})` }}>
            <div className="absolute inset-0 bg-black opacity-50"></div>
            <div className="relative bg-white bg-opacity-50 backdrop-blur-sm rounded-lg shadow-xl p-8 md:p-10 z-10 w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <img src={policelogo} alt="Logo" className="h-12" />
                </div>
                <h2 className="text-2xl font-bold text-black text-center mb-2">Forgot Password?</h2>
                <p className="text-gray-900 text-sm text-center mb-6">Enter your email address and we'll send you an OTP to reset your password.</p>
                {message && <div className="mb-4 p-3 text-sm text-green-700 bg-green-100 rounded-md">{message}</div>}
                {error && <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-md">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email_forgot" className="block text-gray-900 text-sm font-medium mb-2">Email Address</label>
                        <div className="relative">
                            <input type="email" id="email_forgot" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-style w-full pl-10" placeholder="Enter your email" />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500"><Mail className="h-5 w-5" /></div>
                        </div>
                    </div>
                    <div>
                        <button type="submit" disabled={isLoading} className="primary-button w-full justify-center py-3">
                            {isLoading ? 'Sending OTP...' : 'Send OTP'}
                        </button>
                    </div>
                </form>
                <div className="mt-6 text-center">
                    <Link to="/login" className="text-sm text-blue-700 hover:text-blue-600 flex items-center justify-center">
                        <ArrowLeft size={16} className="mr-1" /> Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};
export default ForgotPasswordPage;