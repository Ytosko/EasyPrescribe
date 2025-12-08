"use client";

import Link from "next/link";
import EasyPrescribeLogo from "@/components/ui/Logo";

export default function MarketingFooter() {
    return (
        <footer className="bg-slate-900 text-white py-12 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <EasyPrescribeLogo className="w-8 h-8 text-white relative z-10" />
                        <div className="text-xl font-bold">Easy Prescribe</div>
                    </div>
                    <div className="flex gap-8 text-slate-400 text-sm">
                        <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
                        <Link href="/contact" className="hover:text-white transition">Contact</Link>
                    </div>
                    <div className="text-slate-500 text-sm">
                        © {new Date().getFullYear()} Easy Prescribe.
                    </div>
                </div>
            </div>
        </footer>
    );
}
