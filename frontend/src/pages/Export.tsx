import { useState } from 'react';
import { exportApi } from '../api/export';
import { useToast } from '../hooks/useToast';
import Button from '../components/Button';
import Card from '../components/Card';
import FormField from '../components/FormField';
import PageHeader from '../components/PageHeader';

export default function Export() {
  const toast = useToast();
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      await exportApi.transactions(
        format,
        dateFrom || undefined,
        dateTo || undefined,
      );
      toast.success('Download started');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Export" />

      <Card className="max-w-lg">
        <div className="space-y-4">
          <FormField label="Date Range (optional)">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                placeholder="From"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                placeholder="To"
              />
            </div>
          </FormField>

          <FormField label="Format">
            <div className="flex rounded-lg border border-gray-300 overflow-hidden w-fit">
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  format === 'csv'
                    ? 'bg-teal-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                CSV
              </button>
              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                  format === 'json'
                    ? 'bg-teal-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                JSON
              </button>
            </div>
          </FormField>

          <Button onClick={handleDownload} isLoading={isLoading}>
            Download
          </Button>
        </div>
      </Card>
    </div>
  );
}
