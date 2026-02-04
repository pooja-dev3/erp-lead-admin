import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { visitorsAPI, leadsAPI } from '../utils/apiService';
import { Download, FileText, Users, Clock } from 'lucide-react';

const Exports = () => {
  const { user, companyId } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [selectedDataType, setSelectedDataType] = useState('visitors');
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState([]);

  useEffect(() => {
    setExportHistory([
      {
        id: 1,
        dataType: 'visitors',
        format: 'csv',
        dateRange: '2024-01-01 to 2024-01-31',
        status: 'completed',
        createdAt: '2024-01-31T10:30:00Z',
        recordCount: 1247
      }
    ]);
  }, []);

  const dataTypes = [
    { id: 'visitors', name: 'Visitors', icon: Users, description: 'Export visitor check-in data' },
    { id: 'leads', name: 'Leads', icon: FileText, description: 'Export lead generation data' }
  ];

  const formats = [
    { id: 'csv', name: 'CSV', extension: '.csv', description: 'Comma-separated values' },
    { id: 'excel', name: 'Excel', extension: '.xlsx', description: 'Microsoft Excel format' }
  ];

  const handleExport = async () => {
    if (!dateRange.start || !dateRange.end) {
      showError('Please select both start and end dates');
      return;
    }

    setIsExporting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newExport = {
        id: exportHistory.length + 1,
        dataType: selectedDataType,
        format: selectedFormat,
        dateRange: `${dateRange.start} to ${dateRange.end}`,
        status: 'completed',
        createdAt: new Date().toISOString(),
        recordCount: Math.floor(Math.random() * 1000) + 100
      };
      
      setExportHistory([newExport, ...exportHistory]);
      showSuccess('Export completed successfully!');
      
      setDateRange({ start: '', end: '' });
    } catch (error) {
      showError('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const renderExportHistory = () => {
    if (exportHistory.length === 0) {
      return <div className="text-center py-12"><p className="text-sm text-gray-500">No export history available</p></div>;
    }

    const items = [];
    for (let i = 0; i < exportHistory.length; i++) {
      const exportItem = exportHistory[i];
      items.push(
        <div key={exportItem.id} className="border rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900 capitalize">{exportItem.dataType}</h4>
              <p className="text-sm text-gray-500">{exportItem.format} • {exportItem.dateRange}</p>
              <p className="text-xs text-gray-400">{new Date(exportItem.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                {exportItem.status}
              </span>
              <button className="text-primary-600 hover:text-primary-900">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      );
    }
    return <div>{items}</div>;
  };

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Data Exports
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Export your visitor and lead data in various formats
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Export Configuration
          </h3>
        </div>
        <div className="px-4 py-5 sm:p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Data Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dataTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => setSelectedDataType(type.id)}
                  className={`relative rounded-lg border p-4 cursor-pointer transition-colors ${
                    selectedDataType === type.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <type.icon className="h-6 w-6 text-primary-600" />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{type.name}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {formats.map((format) => (
                <div
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  className={`relative rounded-lg border p-4 cursor-pointer transition-colors ${
                    selectedFormat === format.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">{format.name}</div>
                  <div className="text-xs text-gray-500">{format.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Date Range</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleExport}
              disabled={isExporting || !dateRange.start || !dateRange.end}
              className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Export History
          </h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          {renderExportHistory()}
        </div>
      </div>
    </div>
  );
};

export default Exports;
