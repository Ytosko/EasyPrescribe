'use client'

import { useActionState } from 'react'
import { register } from '@/app/lib/actions'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function SignupForm() {
    const [state, dispatch, isPending] = useActionState(register, undefined)
    const router = useRouter()

    useEffect(() => {
        if (state === 'Success') {
            router.push('/login?registered=true')
        }
    }, [state, router])

    return (
        <form action={dispatch} className="flex flex-col gap-5">
            <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1 text-slate-700">Full Name</label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Dr. John Doe"
                    required
                    className="input-field"
                />
            </div>
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
                    placeholder="Create a strong password"
                    required
                    minLength={6}
                    className="input-field"
                />
            </div>

            {state && state !== 'Success' && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                    {state}
                </div>
            )}

            <button
                type="submit"
                disabled={isPending}
                className="btn-primary w-full justify-center"
            >
                {isPending ? 'Creating Account...' : 'Create Account'}
            </button>

            <div className="text-center text-sm mt-4 text-slate-500">
                Already have an account?{' '}
                <Link href="/login" className="text-teal-600 font-semibold hover:underline">
                    Sign in
                </Link>
            </div>
        </form>
    )
}
