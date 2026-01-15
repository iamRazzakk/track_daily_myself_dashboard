import { useState, useEffect } from "react";
import { FileText, Search, RefreshCw, Clock } from "lucide-react";
import { logsService } from "../services/api";
import {
  formatBytes,
  formatDateTime,
  getLogLevelColor,
  getStatusColor,
  cn,
} from "../lib/utils";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  LoadingSpinner,
  Badge,
  EmptyState,
} from "../components/ui";
import type { LogFile, LogEntry } from "../types";

export default function LogsPage() {
  const [logFiles, setLogFiles] = useState<LogFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [search, setSearch] = useState("");
  const [lineCount, setLineCount] = useState(100);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    loadLogFiles();
  }, []);

  useEffect(() => {
    if (selectedFile) {
      loadLogContent();
    }
  }, [selectedFile, lineCount]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (autoRefresh && selectedFile) {
      interval = setInterval(loadLogContent, 5000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, selectedFile]);

  const loadLogFiles = async () => {
    try {
      setIsLoadingFiles(true);
      const data = await logsService.getLogFiles();
      setLogFiles(data.files);
      if (data.files.length > 0 && !selectedFile) {
        setSelectedFile(data.files[0]?.name || null);
      }
    } catch (err) {
      console.error("Failed to load log files:", err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const loadLogContent = async () => {
    if (!selectedFile) return;

    try {
      setIsLoadingLogs(true);
      const data = await logsService.getLogContent(selectedFile, {
        lines: lineCount,
        search: search || undefined,
      });
      setLogs(data.logs);
    } catch (err) {
      console.error("Failed to load log content:", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadLogContent();
  };

  const getLogTypeLabel = (filename: string) => {
    if (filename.includes("error")) return "Error";
    if (filename.includes("http")) return "HTTP";
    if (filename.includes("exception")) return "Exception";
    if (filename.includes("rejection")) return "Rejection";
    return "App";
  };

  const getLogTypeBadge = (filename: string) => {
    if (filename.includes("error")) return "danger";
    if (filename.includes("http")) return "info";
    if (filename.includes("exception")) return "danger";
    if (filename.includes("rejection")) return "warning";
    return "default";
  };

  const renderLogEntry = (log: LogEntry, index: number) => {
    if (log.raw) {
      return (
        <div
          key={index}
          className="px-4 py-2 font-mono text-xs text-gray-600 bg-gray-50"
        >
          {log.raw}
        </div>
      );
    }

    const isHttpLog = log.method && log.url;

    return (
      <div
        key={index}
        className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start gap-3">
          {/* Level Badge */}
          <span
            className={cn(
              "px-2 py-0.5 text-xs font-medium rounded uppercase shrink-0",
              getLogLevelColor(log.level)
            )}
          >
            {log.level || "LOG"}
          </span>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Main message */}
            <p className="text-sm font-medium text-gray-900">
              {log.message ||
                (isHttpLog ? `${log.method} ${log.url}` : "Log entry")}
            </p>

            {/* HTTP details */}
            {isHttpLog && (
              <div className="flex items-center gap-3 mt-1 text-xs">
                <span className="font-medium">{log.method}</span>
                <span className="text-gray-500 truncate max-w-md">
                  {log.url}
                </span>
                <span className={cn("font-medium", getStatusColor(log.status))}>
                  {log.status}
                </span>
                <span className="text-gray-400">{log.responseTime}</span>
              </div>
            )}

            {log.type === "auth" ? (
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <span className="font-medium">{String(log.action)}</span>
                {log.email && <span>{String(log.email)}</span>}
                {log.success !== undefined && (
                  <Badge variant={Boolean(log.success) ? "success" : "danger"} size="sm">
                    {Boolean(log.success) ? "Success" : "Failed"}
                  </Badge>
                )}
              </div>
            ) : null}

            {log.type === "transaction" ? (
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <span className="font-medium">{String(log.action)}</span>
                {log.userId && <span>User: {String(log.userId)}</span>}
              </div>
            ) : null}

            {/* Additional metadata */}
            {log.stack && (
              <pre className="mt-2 p-2 bg-red-50 text-red-700 text-xs rounded overflow-x-auto max-h-32">
                {String(log.stack)}
              </pre>
            )}
          </div>

          {/* Timestamp */}
          {log.timestamp && (
            <span className="text-xs text-gray-400 shrink-0">
              {formatDateTime(log.timestamp)}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Application Logs
          </h2>
          <p className="text-sm text-gray-500">
            Real-time log viewer for monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "primary" : "secondary"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw
              className={cn("w-4 h-4 mr-2", autoRefresh && "animate-spin")}
            />
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Log Files List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-gray-900">Log Files</h3>
            </CardHeader>
            <CardBody className="p-0">
              {isLoadingFiles ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : logFiles.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  No log files found
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                  {logFiles.map((file) => (
                    <button
                      key={file.name}
                      onClick={() => setSelectedFile(file.name)}
                      className={cn(
                        "w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors",
                        selectedFile === file.name && "bg-primary-50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <Badge
                          variant={
                            getLogTypeBadge(file.name) as
                              | "default"
                              | "success"
                              | "danger"
                              | "warning"
                              | "info"
                          }
                        >
                          {getLogTypeLabel(file.name)}
                        </Badge>
                      </div>
                      <p className="text-xs font-medium text-gray-900 mt-1 truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <span>{formatBytes(file.size)}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{formatDateTime(file.modified)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Log Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  {selectedFile || "Select a log file"}
                </h3>
                {isLoadingLogs && <LoadingSpinner size="sm" />}
              </div>

              {/* Search and Controls */}
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <Input
                  type="search"
                  placeholder="Search logs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-48"
                />
                <select
                  value={lineCount}
                  onChange={(e) => setLineCount(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value={50}>50 lines</option>
                  <option value={100}>100 lines</option>
                  <option value={200}>200 lines</option>
                  <option value={500}>500 lines</option>
                </select>
                <Button type="submit" size="sm">
                  <Search className="w-4 h-4" />
                </Button>
              </form>
            </CardHeader>
            <CardBody className="p-0">
              {!selectedFile ? (
                <EmptyState
                  icon={<FileText className="w-12 h-12" />}
                  title="Select a log file"
                  description="Choose a log file from the left panel to view its contents"
                />
              ) : isLoadingLogs && logs.length === 0 ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : logs.length === 0 ? (
                <EmptyState
                  icon={<Search className="w-12 h-12" />}
                  title="No logs found"
                  description={
                    search
                      ? "Try adjusting your search terms"
                      : "This log file is empty"
                  }
                />
              ) : (
                <div className="max-h-[600px] overflow-y-auto">
                  {logs.map((log, index) => renderLogEntry(log, index))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
