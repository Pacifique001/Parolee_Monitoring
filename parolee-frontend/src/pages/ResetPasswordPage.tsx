// src/pages/ResetPasswordPage.tsx
import React, { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../services/api';
import { Mail, Lock, Key, ArrowLeft } from 'lucide-react';

const policelogo = '/images/policelogo.png';
const loginImage = '/images/LoginImage.png';

const ResetPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [otp, setOtp] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [errors, setValidationErrors] = useState<any>({});

    useEffect(() => {
        const urlEmail = searchParams.get('email');
        if (urlEmail) setEmail(urlEmail);

        if (!urlEmail) {
            setError("Invalid password reset link or missing email parameter.");
            // Optionally redirect to login after a delay
        }
    }, [searchParams]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);
        setError(null);
        setValidationErrors({});

        if (!otp) {
            setError("OTP is required.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await apiClient.post('/reset-password', {
                email,
                otp,
                password,
                password_confirmation: passwordConfirmation,
            });
            setMessage(response.data.message || 'Your password has been reset successfully! You can now log in.');
            // Redirect to login after a delay
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            if (err.response?.data?.errors) {
                setValidationErrors(err.response.data.errors);
            } else {
                setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
            }
            console.error("Reset password error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!email && !error) { // If email is not in URL and no error explicitly set yet
         return (
            <div className="relative h-screen flex items-center justify-center bg-gray-100 font-['Poppins']" style={{ backgroundImage: `url(${loginImage})` }}>
                <div className="absolute inset-0 bg-black opacity-50"></div>
                <div className="relative bg-white bg-opacity-50 backdrop-blur-sm rounded-lg shadow-xl p-8 md:p-10 z-10 w-full max-w-md text-center">
                    <p className="text-red-600">Invalid or missing email in URL.</p>
                    <Link to="/login" className="mt-4 inline-block text-sm text-blue-700 hover:text-blue-600">
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div
            className="relative h-screen flex items-center justify-center bg-gray-100 font-['Poppins']"
            style={{ backgroundImage: `url(${loginImage})` }}
        >
            <div className="absolute inset-0 bg-black opacity-50"></div>
            <div className="relative bg-white bg-opacity-50 backdrop-blur-sm rounded-lg shadow-xl p-8 md:p-10 z-10 w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <img src={policelogo} alt="Parolee Monitoring Logo" className="h-12" />
                </div>

                <h2 className="text-2xl font-bold text-black text-center mb-6">Reset Your Password</h2>

                {message && <div className="mb-4 p-3 text-sm text-green-700 bg-green-100 rounded-md">{message}</div>}
                {error && <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-md">{error}</div>}
                {errors.form && <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-md">{errors.form}</div>}

                {!message && ( // Hide form after success message
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email_reset" className="block text-gray-900 text-sm font-medium mb-1">Email Address</label>
                            <div className="relative">
                                <input type="email" id="email_reset" value={email} onChange={(e) => setEmail(e.target.value)} required readOnly // Email often pre-filled and read-only
                                    className="w-full py-3 pl-10 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 placeholder-gray-400 bg-gray-100 cursor-not-allowed"
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500"><Mail className="h-5 w-5" /></div>
                            </div>
                            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email[0]}</p>}
                        </div>
                        <div>
                            <label htmlFor="otp_reset" className="block text-gray-900 text-sm font-medium mb-1">OTP Code</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    id="otp_reset" 
                                    value={otp} 
                                    onChange={(e) => setOtp(e.target.value)} 
                                    required
                                    className="w-full py-3 pl-10 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 placeholder-gray-400"
                                    placeholder="Enter 6-digit OTP code" 
                                    maxLength={6}
                                    pattern="\d{6}"
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500"><Key className="h-5 w-5" /></div>
                            </div>
                            {errors.otp && <p className="text-xs text-red-500 mt-1">{errors.otp[0]}</p>}
                        </div>
                        <div>
                            <label htmlFor="password_reset" className="block text-gray-900 text-sm font-medium mb-1">New Password</label>
                            <div className="relative">
                                <input type="password" id="password_reset" value={password} onChange={(e) => setPassword(e.target.value)} required
                                    className="w-full py-3 pl-10 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 placeholder-gray-400"
                                    placeholder="Enter new password" />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500"><Lock className="h-5 w-5" /></div>
                            </div>
                            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password[0]}</p>}
                        </div>
                        <div>
                            <label htmlFor="password_confirmation_reset" className="block text-gray-900 text-sm font-medium mb-1">Confirm New Password</label>
                            <div className="relative">
                                <input type="password" id="password_confirmation_reset" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} required
                                    className="w-full py-3 pl-10 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 placeholder-gray-400"
                                    placeholder="Confirm new password" />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500"><Lock className="h-5 w-5" /></div>
                            </div>
                            {errors.password_confirmation && <p className="text-xs text-red-500 mt-1">{errors.password_confirmation[0]}</p>}
                        </div>
                        <div>
                            <button type="submit" disabled={isLoading}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </div>
                    </form>
                )}
                <div className="mt-6 text-center">
                    <Link to="/login" className="text-sm text-blue-700 hover:text-blue-600 flex items-center justify-center">
                        <ArrowLeft size={16} className="mr-1" />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;