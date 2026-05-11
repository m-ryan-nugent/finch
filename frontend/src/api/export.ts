import api from './client';

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const exportApi = {
  transactions: async (
    format: 'csv' | 'json',
    dateFrom?: string,
    dateTo?: string,
  ) => {
    const params: Record<string, string> = { format };
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;

    if (format === 'csv') {
      const response = await api.get('/export/transactions', {
        params,
        responseType: 'blob',
      });
      triggerDownload(response.data as Blob, 'transactions.csv');
    } else {
      const response = await api.get('/export/transactions', { params });
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json',
      });
      triggerDownload(blob, 'transactions.json');
    }
  },
};
