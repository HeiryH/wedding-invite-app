'use client';

import { motion } from 'framer-motion';
import { WeddingFeature } from '@/lib/api';

interface FeaturesTabProps {
  features: WeddingFeature[];
  onToggle: (featureId: number, featureCode: string, currentStatus: boolean) => void;
}

export default function FeaturesTab({ features, onToggle }: FeaturesTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Wedding Features</h3>

        {/* Info Box */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            💡 <strong>Note:</strong> Disabling features will hide their corresponding tabs.
            For example, disabling "Photo Booth" will hide the Photos tab.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <div
              // key={feature.weddingFeatureId}
              key={feature.featureId}
              className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${feature.isEnabled
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
                }`}
              onClick={() => onToggle(feature.featureId, feature.featureCode, feature.isEnabled)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-800">{feature.featureName}</h4>
                  {/* <p className="text-sm text-gray-600 mt-1">{feature.featureDescription}</p> */}
                </div>
                <div
                  className={`w-12 h-6 rounded-full transition-colors ${feature.isEnabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transform transition-transform ${feature.isEnabled ? 'translate-x-6' : 'translate-x-1'
                      } mt-0.5`}
                  />
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {feature.isEnabled ? '✅ Enabled' : '❌ Disabled'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}