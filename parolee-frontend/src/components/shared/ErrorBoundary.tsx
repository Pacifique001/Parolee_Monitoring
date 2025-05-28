import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error);
        console.error('Component stack:', errorInfo.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                    <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md">
                        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Something went wrong
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {this.state.error?.message || 'An unexpected error occurred.'}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-brand-purple-600 text-white rounded-md hover:bg-brand-purple-700 transition-colors"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;