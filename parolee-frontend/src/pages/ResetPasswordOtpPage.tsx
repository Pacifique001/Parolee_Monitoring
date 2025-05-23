/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/ResetPasswordOtpPage.tsx
import React, { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../services/api';
import { ArrowLeft, Key, Lock, ShieldCheck } from 'lucide-react'; // Using ShieldCheck for OTP

const policelogo = '/images/policelogo.png';
const loginImage = '/images/LoginImage.png';

const ResetPasswordOtpPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [email, setEmail] = useState<string>('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<any>({});


    useEffect(() => {
        const urlEmail = searchParams.get('email');
        if (urlEmail) {
            setEmail(urlEmail);
        } else {
            setError("Email address not found. Please try the forgot password process again.");
            // navigate('/forgot-password'); // Or redirect
        }
    }, [searchParams, navigate]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);
        setError(null);
        setValidationErrors({});

        try {
            const response = await apiClient.post('/reset-password', {
                email,
                otp,
                password,
                password_confirmation: passwordConfirmation,
            });
            setMessage(response.data.message || 'Your password has been reset successfully! You can now log in.');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            if (err.response?.data?.errors) {
                setValidationErrors(err.response.data.errors);
            } else {
                setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
            }
            console.error("Reset password with OTP error:", err);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!email && !error) {
        return (
            <div className="relative h-screen flex items-center justify-center bg-gray-100 font-['Poppins']" style={{ backgroundImage: `url(${loginImage})` }}>
                <div className="absolute inset-0 bg-black opacity-50"></div>
                <div className="relative bg-white bg-opacity-50 backdrop-blur-sm rounded-lg shadow-xl p-8 md:p-10 z-10 w-full max-w-md text-center">
                    <p className="text-red-600">Email address is missing. Please start over.</p>
                    <Link to="/forgot-password" className="mt-4 inline-block text-sm text-blue-700 hover:text-blue-600">
                        Request Password Reset
                    </Link>
                </div>
            </div>
        );
    }


    function config(_arg0: string, _arg1: number): number | undefined {
        throw new Error('Function not implemented.');
    }

    return (
        <div
            className="relative h-screen flex items-center justify-center bg-gray-100 font-['Poppins']"
            style={{ backgroundImage: `url(${loginImage})` }}
        >
            <div className="absolute inset-0 bg-black opacity-50"></div>
            <div className="relative bg-white bg-opacity-50 backdrop-blur-sm rounded-lg shadow-xl p-8 md:p-10 z-10 w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <img src={policelogo} alt="Logo" className="h-12" />
                </div>
                <h2 className="text-2xl font-bold text-black text-center mb-6">Set New Password</h2>

                {message && <div className="mb-4 p-3 text-sm text-green-700 bg-green-100 rounded-md">{message}</div>}
                {error && <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-md">{error}</div>}
                {validationErrors.form && <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-md">{validationErrors.form}</div>}

                {!message && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email_otp_reset" className="block text-gray-900 text-sm font-medium mb-1">Email Address</label>
                            <input type="email" id="email_otp_reset" value={email} readOnly
                                className="input-style w-full bg-gray-100 cursor-not-allowed" />
                            {validationErrors.email && <p className="text-xs text-red-500 mt-1">{validationErrors.email[0]}</p>}
                        </div>
                        <div>
                            <label htmlFor="otp" className="block text-gray-900 text-sm font-medium mb-1">OTP</label>
                             <div className="relative">
                                <input type="text" id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={config('auth.passwords.users.otp_length', 6)}
                                    className="input-style w-full pl-10" placeholder="Enter OTP from email" />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500"><ShieldCheck className="h-5 w-5" /></div>
                            </div>
                            {validationErrors.otp && <p className="text-xs text-red-500 mt-1">{validationErrors.otp[0]}</p>}
                        </div>
                        <div>
                            <label htmlFor="password_otp_reset" className="block text-gray-900 text-sm font-medium mb-1">New Password</label>
                             <div className="relative">
                                <input type="password" id="password_otp_reset" value={password} onChange={(e) => setPassword(e.target.value)} required
                                    className="input-style w-full pl-10" placeholder="Enter new password" />
                                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500"><Lock className="h-5 w-5" /></div>
                            </div>
                            {validationErrors.password && <p className="text-xs text-red-500 mt-1">{validationErrors.password[0]}</p>}
                        </div>
                        <div>
                            <label htmlFor="password_confirmation_otp_reset" className="block text-gray-900 text-sm font-medium mb-1">Confirm New Password</label>
                            <div className="relative">
                                <input type="password" id="password_confirmation_otp_reset" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} required
                                    className="input-style w-full pl-10" placeholder="Confirm new password" />
                                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500"><Key className="h-5 w-5" /></div>
                            </div>
                            {validationErrors.password_confirmation && <p className="text-xs text-red-500 mt-1">{validationErrors.password_confirmation[0]}</p>}
                        </div>
                        <div>
                            <button type="submit" disabled={isLoading}
                                className="primary-button w-full justify-center py-3">
                                {isLoading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </div>
                    </form>
                )}
                <div className="mt-6 text-center">
                    <Link to="/login" className="text-sm text-blue-700 hover:text-blue-600 flex items-center justify-center">
                        <ArrowLeft size={16} className="mr-1" /> Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};
export default ResetPasswordOtpPage;