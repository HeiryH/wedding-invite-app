'use client';

import { motion } from 'framer-motion';
import { Template } from '@/lib/api';
import { TemplatePreview } from '@/components/templates/TemplatePreview';

interface TemplatesTabProps {
  templates: Template[];
  currentTemplateId: number;
  onChangeTemplate: (templateId: number) => void;
  onPreviewTemplate: (templateId: number) => void;
}

export default function TemplatesTab({
  templates,
  currentTemplateId,
  onChangeTemplate,
  onPreviewTemplate,
}: TemplatesTabProps) {
  const currentTemplate = templates.find(t => t.templateId === currentTemplateId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Template Selection
          </h3>
          <p className="text-gray-600 text-sm">
            Currently using:{' '}
            <span className="font-semibold">
              {currentTemplate?.templateName || `Template ${currentTemplateId}`}
            </span>
          </p>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No templates available</p>
            <p className="text-sm mt-2">Templates need to be seeded in the database</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((template) => (
                <div
                  key={template.templateId}
                  className={`relative rounded-xl border-2 overflow-hidden transition-all ${
                    currentTemplateId === template.templateId
                      ? 'border-rose-500 shadow-lg ring-2 ring-rose-200'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  {/* Premium Badge */}
                  {template.isPremium && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-md">
                        ⭐ Premium
                      </span>
                    </div>
                  )}

                  {/* Active Badge */}
                  {currentTemplateId === template.templateId && (
                    <div className="absolute top-3 right-3 z-10">
                      <span className="bg-rose-500 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-md">
                        ✓ Active
                      </span>
                    </div>
                  )}

                  {/* Template Preview */}
                  <TemplatePreview templateCode={template.templateCode} />

                  {/* Template Info */}
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-800 text-lg mb-1">
                      {template.templateName}
                    </h4>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {template.description}
                    </p>

                    {/* Actions */}
                    <div className="space-y-2">
                      <button
                        onClick={() => onPreviewTemplate(template.templateId)}
                        className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium text-sm"
                      >
                        👁️ Preview
                      </button>
                      
                      {currentTemplateId !== template.templateId && (
                        <button
                          onClick={() => onChangeTemplate(template.templateId)}
                          className="w-full px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors font-medium text-sm"
                        >
                          Use This Template
                        </button>
                      )}

                      {currentTemplateId === template.templateId && (
                        <div className="w-full px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-center font-medium text-sm">
                          Currently Active
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Click "Preview" to see how the template looks with your wedding data before applying it. 
            Changes take effect immediately on the public invitation.
          </p>
        </div>
      </div>
    </motion.div>
  );
}