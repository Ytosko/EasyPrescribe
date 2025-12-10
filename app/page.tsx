import { Metadata } from 'next';
import HomeClient from '@/components/home/HomeClient';

export const metadata: Metadata = {
  title: 'Easy Prescribe - Digital Prescription Management for Modern Doctors',
  description: 'Streamline your medical practice with Easy Prescribe. Create professional digital prescriptions, manage patient records, and improve efficiency. Start for free.',
  openGraph: {
    title: 'Easy Prescribe - The Future of Medical Records',
    description: 'Transform your practice with secure, efficient, and beautiful digital prescriptions. Join 500+ doctors on Easy Prescribe.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=2000',
        width: 1200,
        height: 630,
        alt: 'Easy Prescribe Dashboard',
      },
    ],
  },
};

export default function Home() {
  return <HomeClient />;
}
