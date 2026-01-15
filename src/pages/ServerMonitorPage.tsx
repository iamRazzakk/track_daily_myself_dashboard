import { useState, useEffect, useCallback, useRef } from "react";
import {
  Server,
  Cpu,
  HardDrive,
  Database,
  Clock,
  Activity,
  RefreshCw,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
  AlertTriangle,
  TrendingUp,
  Users,
} from "lucide-react";
import { formatBytes, cn } from "../lib/utils";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  LoadingSpinner,
  Badge,
} from "../components/ui";
import { useAuth } from "../contexts/AuthContext";

interface WebSocketMetrics {
  type: "metrics";
  timestamp: string;
  system: {
    cpu: {
      usage: number;
      cores: number;
      model: string;
    };
    memory: {
      total: number;
      used: number;
      free: number;
      usagePercent: string;
    };
    uptime: {
      system: number;
      server: number;
    };
    platform: {
      type: string;
      platform: string;
      arch: string;
      hostname: string;
    };
  };
  database: {
    status: string;
    isConnected: boolean;
    connections?: number;
    availableConnections?: number;
  };
  requests: {
    total: number;
    lastMinute: number;
    lastHour: number;
    requestsPerSecond: number;
    errors: number;
    activeConnections: number;
    statusCodes: Record<string, number>;
  };
  traffic: {
    level: "low" | "normal" | "moderate" | "high" | "heavy";
    requestsPerSecond: number;
  };
  server: {
    status: string;
    uptime: number;
    nodeVersion: string;
    environment: string;
  };
  clients: {
    websocket: number;
    http: number;
  };
}

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(" ");
};

const getTrafficColor = (level: string) => {
  switch (level) {
    case "low":
      return "text-gray-500";
    case "normal":
      return "text-green-500";
    case "moderate":
      return "text-blue-500";
    case "high":
      return "text-yellow-500";
    case "heavy":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
};

const getTrafficBadgeVariant = (
  level: string
): "default" | "success" | "warning" | "danger" => {
  switch (level) {
    case "low":
    case "normal":
      return "success";
    case "moderate":
      return "default";
    case "high":
      return "warning";
    case "heavy":
      return "danger";
    default:
      return "default";
  }
};

export default function ServerMonitorPage() {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState<WebSocketMetrics | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("connecting");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connectWebSocket = useCallback(() => {
    if (!token) {
      setConnectionStatus("error");
      return;
    }

    // Determine WebSocket URL based on current location
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsHost =
      import.meta.env.VITE_WS_URL ||
      `${protocol}//${window.location.hostname}:5000`;
    const wsUrl = `${wsHost}/ws/monitor?token=${token}`;

    setConnectionStatus("connecting");

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionStatus("connected");
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event: any) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "metrics") {
            setMetrics(data as WebSocketMetrics);
            setLastUpdated(new Date());
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      ws.onclose = (event: CloseEvent) => {
        console.log("WebSocket connection closed:", event);
        setIsConnected(false);
        setConnectionStatus("disconnected");
        wsRef.current = null;

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            30000
          );
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connectWebSocket();
          }, delay);
        }
      };

      ws.onerror = (error: Event) => {
        console.error("WebSocket error:", error);
        setConnectionStatus("error");
      };
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      setConnectionStatus("error");
    }
  }, [token]);

  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus("disconnected");
  }, []);

  const reconnect = useCallback(() => {
    disconnectWebSocket();
    reconnectAttemptsRef.current = 0;
    setTimeout(connectWebSocket, 100);
  }, [connectWebSocket, disconnectWebSocket]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket]);

  // Send ping every 30 seconds to keep connection alive
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    return () => clearInterval(pingInterval);
  }, []);

  const getConnectionStatusBadge = () => {
    switch (connectionStatus) {
      case "connected":
        return (
          <Badge variant="success" className="animate-pulse">
            <Wifi className="w-3 h-3 mr-1" />
            Live
          </Badge>
        );
      case "connecting":
        return (
          <Badge variant="warning">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            Connecting...
          </Badge>
        );
      case "disconnected":
        return (
          <Badge variant="default">
            <WifiOff className="w-3 h-3 mr-1" />
            Disconnected
          </Badge>
        );
      case "error":
        return (
          <Badge variant="danger">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
    }
  };

  if (!metrics && connectionStatus === "connecting") {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-500">Connecting to server...</p>
      </div>
    );
  }

  if (
    !metrics &&
    (connectionStatus === "disconnected" || connectionStatus === "error")
  ) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <WifiOff className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Connection Lost
        </h2>
        <p className="text-gray-500 mb-4">
          Unable to establish real-time connection
        </p>
        <Button onClick={reconnect}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Reconnect
        </Button>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Real-time Server Monitoring
          </h2>
          <p className="text-sm text-gray-500">
            Live server health and performance metrics via WebSocket
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              Last update: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          {getConnectionStatusBadge()}
          {!isConnected && (
            <Button variant="secondary" size="sm" onClick={reconnect}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Reconnect
            </Button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <Card
        className={cn(
          "border-2",
          metrics.server.status === "online" && metrics.database.isConnected
            ? "border-green-200 bg-green-50"
            : "border-red-200 bg-red-50"
        )}
      >
        <CardBody className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              {metrics.server.status === "online" ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : (
                <XCircle className="w-8 h-8 text-red-500" />
              )}
              <div>
                <h3
                  className={cn(
                    "text-lg font-semibold",
                    metrics.server.status === "online"
                      ? "text-green-700"
                      : "text-red-700"
                  )}
                >
                  {metrics.server.status === "online"
                    ? "All Systems Operational"
                    : "System Issues Detected"}
                </h3>
                <p className="text-sm text-gray-600">
                  Server uptime: {formatUptime(metrics.server.uptime)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant={metrics.database.isConnected ? "success" : "danger"}
              >
                <Database className="w-3 h-3 mr-1" />
                DB: {metrics.database.status}
              </Badge>
              <Badge variant={getTrafficBadgeVariant(metrics.traffic.level)}>
                <TrendingUp className="w-3 h-3 mr-1" />
                Traffic: {metrics.traffic.level}
              </Badge>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Real-time Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* CPU Usage */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-3 rounded-xl",
                  metrics.system.cpu.usage > 80
                    ? "bg-red-100"
                    : metrics.system.cpu.usage > 50
                    ? "bg-yellow-100"
                    : "bg-green-100"
                )}
              >
                <Cpu
                  className={cn(
                    "w-6 h-6",
                    metrics.system.cpu.usage > 80
                      ? "text-red-600"
                      : metrics.system.cpu.usage > 50
                      ? "text-yellow-600"
                      : "text-green-600"
                  )}
                />
              </div>
              <div>
                <p className="text-sm text-gray-500">CPU</p>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    metrics.system.cpu.usage > 80
                      ? "text-red-600"
                      : metrics.system.cpu.usage > 50
                      ? "text-yellow-600"
                      : "text-green-600"
                  )}
                >
                  {metrics.system.cpu.usage}%
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-3 rounded-xl",
                  parseFloat(metrics.system.memory.usagePercent) > 80
                    ? "bg-red-100"
                    : parseFloat(metrics.system.memory.usagePercent) > 60
                    ? "bg-yellow-100"
                    : "bg-blue-100"
                )}
              >
                <HardDrive
                  className={cn(
                    "w-6 h-6",
                    parseFloat(metrics.system.memory.usagePercent) > 80
                      ? "text-red-600"
                      : parseFloat(metrics.system.memory.usagePercent) > 60
                      ? "text-yellow-600"
                      : "text-blue-600"
                  )}
                />
              </div>
              <div>
                <p className="text-sm text-gray-500">Memory</p>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    parseFloat(metrics.system.memory.usagePercent) > 80
                      ? "text-red-600"
                      : parseFloat(metrics.system.memory.usagePercent) > 60
                      ? "text-yellow-600"
                      : "text-blue-600"
                  )}
                >
                  {metrics.system.memory.usagePercent}%
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Requests/sec */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-3 rounded-xl",
                  `bg-${
                    getTrafficColor(metrics.traffic.level).split("-")[1]
                  }-100`
                )}
              >
                <Activity
                  className={cn(
                    "w-6 h-6",
                    getTrafficColor(metrics.traffic.level)
                  )}
                />
              </div>
              <div>
                <p className="text-sm text-gray-500">Requests/s</p>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    getTrafficColor(metrics.traffic.level)
                  )}
                >
                  {metrics.requests.requestsPerSecond}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Active Connections */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-100">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Connections</p>
                <p className="text-2xl font-bold text-purple-600">
                  {metrics.requests.activeConnections}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Uptime */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-indigo-100">
                <Clock className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Uptime</p>
                <p className="text-lg font-bold text-indigo-600">
                  {formatUptime(metrics.server.uptime)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Resources */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                System Resources
              </h3>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            {/* CPU Bar */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">
                  CPU Usage ({metrics.system.cpu.cores} cores)
                </span>
                <span className="font-medium">{metrics.system.cpu.usage}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    metrics.system.cpu.usage > 80
                      ? "bg-red-500"
                      : metrics.system.cpu.usage > 50
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  )}
                  style={{
                    width: `${Math.min(metrics.system.cpu.usage, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Memory Bar */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Memory Usage</span>
                <span className="font-medium">
                  {metrics.system.memory.usagePercent}%
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    parseFloat(metrics.system.memory.usagePercent) > 80
                      ? "bg-red-500"
                      : parseFloat(metrics.system.memory.usagePercent) > 60
                      ? "bg-yellow-500"
                      : "bg-blue-500"
                  )}
                  style={{ width: `${metrics.system.memory.usagePercent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-xs text-gray-500">Total Memory</p>
                <p className="text-lg font-semibold">
                  {formatBytes(metrics.system.memory.total)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Free Memory</p>
                <p className="text-lg font-semibold">
                  {formatBytes(metrics.system.memory.free)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">System Uptime</p>
                <p className="text-lg font-semibold">
                  {formatUptime(metrics.system.uptime.system)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">CPU Model</p>
                <p
                  className="text-xs font-medium truncate"
                  title={metrics.system.cpu.model}
                >
                  {metrics.system.cpu.model}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Request Statistics */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Request Statistics
                </h3>
              </div>
              <Badge variant={getTrafficBadgeVariant(metrics.traffic.level)}>
                {metrics.traffic.level.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.requests.total}
                </p>
                <p className="text-xs text-gray-500">Total Requests</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {metrics.requests.lastMinute}
                </p>
                <p className="text-xs text-gray-500">Last Minute</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {metrics.requests.lastHour}
                </p>
                <p className="text-xs text-gray-500">Last Hour</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-xl font-bold text-red-600">
                  {metrics.requests.errors}
                </p>
                <p className="text-xs text-gray-500">Errors</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-xl font-bold text-purple-600">
                  {metrics.clients.websocket}
                </p>
                <p className="text-xs text-gray-500">WebSocket Clients</p>
              </div>
            </div>

            {/* Status Codes */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Status Codes</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(metrics.requests.statusCodes || {}).map(
                  ([code, count]) => (
                    <Badge
                      key={code}
                      variant={
                        code.startsWith("2")
                          ? "success"
                          : code.startsWith("4")
                          ? "warning"
                          : code.startsWith("5")
                          ? "danger"
                          : "default"
                      }
                    >
                      {code}: {count}
                    </Badge>
                  )
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* System Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              System Information
            </h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Hostname
              </p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {metrics.system.platform.hostname}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Platform
              </p>
              <p className="text-sm font-medium text-gray-900 mt-1 capitalize">
                {metrics.system.platform.platform}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Architecture
              </p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {metrics.system.platform.arch}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Node.js
              </p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {metrics.server.nodeVersion}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Environment
              </p>
              <Badge
                variant={
                  metrics.server.environment === "production"
                    ? "success"
                    : "warning"
                }
              >
                {metrics.server.environment}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Database
              </p>
              <Badge
                variant={metrics.database.isConnected ? "success" : "danger"}
              >
                {metrics.database.status}
              </Badge>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
