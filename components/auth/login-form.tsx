'use client'

import { useActionState } from 'react'
import { authenticate } from '@/app/lib/actions'
import Link from 'next/link'

export function LoginForm() {
    const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined)

    return (
        <form action={dispatch} className="flex flex-col gap-5">
            <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1 text-slate-700">Email Address</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="doctor@medex.com"
                    required
                    className="input-field"
                />
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1 text-slate-700">Password</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="input-field"
                />
            </div>

            {errorMessage && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2 border border-red-100">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errorMessage}
                </div>
            )}

            <button
                type="submit"
                disabled={isPending}
                className="btn-primary w-full justify-center"
            >
                {isPending ? 'Authenticating...' : 'Sign In'}
            </button>

            <div className="text-center text-sm mt-4 text-slate-500">
                New to MedProfiler?{' '}
                <Link href="/signup" className="text-teal-600 font-semibold hover:underline">
                    Create an account
                </Link>
            </div>
        </form>
    )
}
