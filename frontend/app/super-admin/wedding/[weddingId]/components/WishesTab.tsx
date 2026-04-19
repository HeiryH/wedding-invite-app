'use client';

import { motion } from 'framer-motion';
import { Wish } from '@/lib/api';

interface WishesTabProps {
  wishes: Wish[];
  onDelete: (wishId: number) => void;
  onExport: () => void;
}

export default function WishesTab({ wishes, onDelete, onExport }: WishesTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800">All Wishes ({wishes.length})</h3>
          <button
            onClick={onExport}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            📥 Export CSV
          </button>
        </div>

        {wishes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No wishes yet</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wishes
              .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
              .map((wish) => (
                <div
                  key={wish.wishId}
                  className="relative group bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-4 border-l-4 border-pink-400"
                >
                  <button
                    onClick={() => onDelete(wish.wishId)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete wish"
                  >
                    🗑️
                  </button>
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-gray-800">{wish.guestName}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(wish.createdDate).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-gray-600 text-sm italic pr-6">"{wish.message}"</p>
                </div>
              ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}