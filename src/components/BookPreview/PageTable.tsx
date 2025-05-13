import React from 'react';
import { Pencil } from 'lucide-react';

interface Page {
  id: string;
  pageNumber: number;
  event: string;
  prompt: string;
}

interface PageTableProps {
  pages: Page[];
  onUpdate: (pageId: string, field: 'event' | 'prompt', value: string) => void;
}

const PageTable: React.FC<PageTableProps> = ({ pages, onUpdate }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-purple-50">
            <th className="py-3 px-4 text-left text-sm font-medium text-purple-900">Página</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-purple-900">Acontecimiento</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-purple-900">Prompt ilustración</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {pages.map((page) => (
            <tr key={page.id} className="hover:bg-gray-50">
              <td className="py-3 px-4 text-sm text-gray-500">
                {page.pageNumber}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-start gap-2">
                  <textarea
                    value={page.event}
                    onChange={(e) => onUpdate(page.id, 'event', e.target.value)}
                    className="flex-1 min-h-[60px] p-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Describe qué sucede en esta página..."
                  />
                  <button className="p-1 text-purple-600 hover:text-purple-800">
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-start gap-2">
                  <textarea
                    value={page.prompt}
                    onChange={(e) => onUpdate(page.id, 'prompt', e.target.value)}
                    className="flex-1 min-h-[60px] p-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Describe la ilustración que deseas generar..."
                  />
                  <button className="p-1 text-purple-600 hover:text-purple-800">
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PageTable;