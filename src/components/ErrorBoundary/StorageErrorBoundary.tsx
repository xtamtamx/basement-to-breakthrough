import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Database, AlertTriangle, Download, Trash2 } from 'lucide-react';
import { haptics } from '@utils/mobile';
import { saveManager } from '@game/mechanics/SaveManager';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  storageInfo: {
    usage: number;
    quota: number;
  } | null;
}

export class StorageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      storageInfo: null
    };
  }

  async componentDidMount() {
    // Check storage quota
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        this.setState({
          storageInfo: {
            usage: estimate.usage || 0,
            quota: estimate.quota || 0
          }
        });
      } catch (error) {
        console.warn('Could not estimate storage:', error);
      }
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> | null {
    // Detect storage-related errors
    const storageErrors = [
      'QuotaExceededError',
      'localStorage',
      'IndexedDB',
      'Storage',
      'exceeded the quota'
    ];
    
    const isStorageError = storageErrors.some(keyword => 
      error.name.includes(keyword) || error.message.includes(keyword)
    );

    if (isStorageError) {
      return { hasError: true, error };
    }
    
    return null;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Storage error caught:', error, errorInfo);
    haptics.error();
  }

  handleExportSave = () => {
    haptics.medium();
    const saveData = saveManager.exportSave();
    
    if (saveData) {
      // Create download link
      const blob = new Blob([saveData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `btb-save-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      haptics.success();
    }
  };

  handleClearStorage = async () => {
    haptics.warning();
    
    if (confirm('This will delete all game data. Are you sure?')) {
      try {
        // Clear all storage
        localStorage.clear();
        
        if ('caches' in window) {
          const names = await caches.keys();
          await Promise.all(names.map(name => caches.delete(name)));
        }
        
        if ('indexedDB' in window) {
          const databases = await indexedDB.databases();
          await Promise.all(
            databases.map(db => {
              if (db.name) indexedDB.deleteDatabase(db.name);
            })
          );
        }
        
        haptics.success();
        window.location.reload();
      } catch (error) {
        console.error('Failed to clear storage:', error);
        haptics.error();
      }
    }
  };

  handleRetry = () => {
    haptics.light();
    this.setState({ hasError: false, error: null });
  };

  formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  render() {
    const { hasError, error, storageInfo } = this.state;
    const { children } = this.props;

    if (hasError) {
      const isQuotaError = error?.name === 'QuotaExceededError' || 
                          error?.message.includes('quota');

      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <Database className="w-8 h-8 text-red-500 mr-3" />
              <h2 className="text-xl font-bold text-white">Storage Error</h2>
            </div>
            
            <p className="text-gray-300 mb-4">
              {isQuotaError 
                ? "Your device is running out of storage space for the game."
                : error?.message || "Unable to save game data."
              }
            </p>

            {storageInfo && (
              <div className="bg-gray-900 rounded p-3 mb-4">
                <p className="text-sm text-gray-400">Storage Usage</p>
                <div className="mt-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">
                      {this.formatBytes(storageInfo.usage)}
                    </span>
                    <span className="text-gray-500">
                      / {this.formatBytes(storageInfo.quota)}
                    </span>
                  </div>
                  <div className="mt-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600"
                      style={{ 
                        width: `${(storageInfo.usage / storageInfo.quota) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleExportSave}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Save File
              </button>

              <button
                onClick={this.handleClearStorage}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear Storage
              </button>

              <button
                onClick={this.handleRetry}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                Try Again
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Export your save before clearing storage!
            </p>
          </div>
        </div>
      );
    }

    return children;
  }
}