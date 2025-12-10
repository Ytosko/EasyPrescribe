import Link from 'next/link';
import { FiHome } from 'react-icons/fi';

export default function NotFoundView() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="text-center space-y-6 max-w-lg">
                <div className="relative w-40 h-40 mx-auto text-blue-100 mb-8">
                    <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full animate-bounce-slow">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" opacity="0.1" />
                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" className="text-[#007ACC]" />
                        <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z" className="text-[#007ACC]" />
                    </svg>
                </div>

                <h1 className="text-6xl font-black text-slate-900 tracking-tighter">404</h1>
                <h2 className="text-2xl font-bold text-slate-800">Page Not Found</h2>

                <p className="text-slate-500 text-lg mx-auto leading-relaxed">
                    The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </p>

                <div className="pt-6">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-8 py-3 bg-[#007ACC] text-white font-bold rounded-full hover:bg-blue-600 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl gap-2"
                    >
                        <FiHome size={20} /> Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
