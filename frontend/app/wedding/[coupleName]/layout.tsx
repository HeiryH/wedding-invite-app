'use client';

import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function WeddingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const coupleName = params.coupleName as string;

  const navItems = [
  { name: 'Invitation', href: `/wedding/${coupleName}` },
  { name: 'RSVP', href: `/wedding/${coupleName}/rsvp` },
  { name: 'Wishes', href: `/wedding/${coupleName}/wishes` },
  { name: 'Photos', href: `/wedding/${coupleName}/photos` }, // ADD THIS
];

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-rose-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-center gap-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <motion.div
                    className={`relative px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'text-rose-600 font-semibold'
                        : 'text-gray-600 hover:text-rose-500'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {item.name}
                    {isActive && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600"
                        layoutId="activeTab"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main>{children}</main>
    </div>
  );
}