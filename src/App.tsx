import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import {
  Search,
  Server,
  Folder,
  User,
  Tag,
  Check,
  X,
  RefreshCw,
  Network,
  Activity,
  Settings,
  Info,
  Zap,
  Shield,
  AlertTriangle
} from "lucide-react";

interface PortInfo {
  port: number;
  protocol: string;
  pid: number;
  process_name: string;
  exe_path: string;
  user: string;
  source: string;
  remarks: string;
}

interface KillResult {
  success: boolean;
  message: string;
}

function App() {
  const [ports, setPorts] = useState<string>("");
  const [portData, setPortData] = useState<PortInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    pid: number;
    force: boolean;
    processName: string;
  } | null>(null);
  // Settings state - simplified for port scanner only
  const [settings, setSettings] = useState({
    theme: 'light',
    compactMode: false,
    tableDensity: 'normal'
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));

    // Apply theme changes immediately
    if (key === 'theme') {
      document.documentElement.classList.toggle('dark', value === 'dark');
    }

    // Apply compact mode changes
    if (key === 'compactMode') {
      document.documentElement.classList.toggle('compact', value);
    }
  };

  const parsePortInput = (input: string): number[] => {
    const ports: number[] = [];
    const parts = input.split(',').map(p => p.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        // Handle ranges like "8000-8100"
        const [start, end] = part.split('-').map(p => parseInt(p.trim()));
        if (!isNaN(start) && !isNaN(end) && start <= end && start >= 1 && end <= 65535) {
          for (let port = start; port <= end; port++) {
            ports.push(port);
          }
        }
      } else {
        // Handle single ports
        const port = parseInt(part);
        if (!isNaN(port) && port >= 1 && port <= 65535) {
          ports.push(port);
        }
      }
    }

    // Remove duplicates and sort
    return [...new Set(ports)].sort((a, b) => a - b);
  };

  const searchPorts = async () => {
    if (!ports.trim()) return;

    setLoading(true);
    try {
      const portNumbers = parsePortInput(ports);
      let result: PortInfo[];

      if (portNumbers.length > 0) {
        result = await invoke("list_ports", {
          ports: portNumbers,
          onlyListening: false
        });
      } else {
        result = [];
      }

      setPortData(result);
      console.log(`Found ${result.length} processes`);
    } catch (error) {
      console.error("Failed to list ports:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchAllPorts = async () => {
    setLoading(true);
    try {
      const result: PortInfo[] = await invoke("list_all_ports", {});
      setPortData(result);
      console.log(`Found ${result.length} processes on all ports`);
    } catch (error) {
      console.error("Failed to list all ports:", error);
    } finally {
      setLoading(false);
    }
  };

  const killProcess = async (pid: number, force: boolean = false) => {
    try {
      const result: KillResult = await invoke("kill_process", { pid, force });
      if (result.success) {
        console.log(result.message);
        // Refresh the list
        await searchPorts();
      } else {
        // Check if it's a permission error
        if (result.message.toLowerCase().includes("permission denied")) {
          console.error("Permission denied - elevation required");
        } else {
          console.error(result.message);
        }
      }
    } catch (error) {
      console.error("Failed to kill process:", error);
    }
  };

  const handleKillClick = (pid: number, force: boolean, processName: string) => {
    setConfirmDialog({ open: true, pid, force, processName });
  };

  const confirmKill = () => {
    if (confirmDialog) {
      killProcess(confirmDialog.pid, confirmDialog.force);
      setConfirmDialog(null);
    }
  };

  // Table rows for desktop view
  const rows = portData.map((item) => (
    <TableRow key={item.pid}>
      <TableCell className="text-center">
        <Badge variant="secondary" className="font-bold">
          {item.port}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <Badge
          variant={item.protocol === 'tcp' ? 'default' : 'secondary'}
        >
          {item.protocol.toUpperCase()}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="font-bold text-blue-600 cursor-pointer hover:text-blue-700 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {item.pid}
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-xs bg-slate-900 text-white border-slate-700 shadow-lg"
          >
            <div className="space-y-1">
              <p className="font-semibold">{item.process_name}</p>
              <p className="text-xs text-slate-300">PID: {item.pid}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell className="max-w-0">
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-gray-500 flex-shrink-0" />
          <span className="text-sm text-gray-600 truncate font-mono">
            {item.exe_path.split('/').pop() || item.exe_path.split('\\').pop() || item.exe_path}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1">
          <User className="h-3 w-3 text-gray-500" />
          <span className="text-sm font-medium">{item.user}</span>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Badge
          variant="outline"
          className={
            item.source === "unknown" ? "text-gray-500" :
            item.source === "docker" ? "text-blue-600 border-blue-200" :
            item.source === "systemd" ? "text-green-600 border-green-200" :
            item.source === "launchd" ? "text-orange-600 border-orange-200" :
            item.source === "brew" ? "text-purple-600 border-purple-200" : ""
          }
        >
          <Tag className="h-3 w-3 mr-1" />
          {item.source}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex gap-1 justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                  onClick={() => handleKillClick(item.pid, false, item.process_name)}
                >
                  <Check className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 text-white border-slate-700 shadow-lg">
                <p>Graceful terminate</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => handleKillClick(item.pid, true, item.process_name)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 text-white border-slate-700 shadow-lg">
                <p>Force terminate</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>
    </TableRow>
  ));

  // Card-based layout for mobile/tablet view
  const processCards = portData.map((item) => (
    <Card key={item.pid} className="p-4 bg-white border border-slate-200">
      <div className="space-y-3">
        {/* Header row with port and protocol */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="font-bold">
              Port {item.port}
            </Badge>
            <Badge variant={item.protocol === 'tcp' ? 'default' : 'secondary'}>
              {item.protocol.toUpperCase()}
            </Badge>
          </div>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                    onClick={() => handleKillClick(item.pid, false, item.process_name)}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 text-white border-slate-700 shadow-lg">
                  <p>Graceful terminate</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleKillClick(item.pid, true, item.process_name)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 text-white border-slate-700 shadow-lg">
                  <p>Force terminate</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Process info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">PID:</span>
            <span className="font-bold text-blue-600">{item.pid}</span>
          </div>

          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 font-mono break-all">
              {item.exe_path.split('/').pop() || item.exe_path.split('\\').pop() || item.exe_path}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-3 w-3 text-gray-500" />
              <span className="text-sm font-medium">{item.user}</span>
            </div>
            <Badge
              variant="outline"
              className={
                item.source === "unknown" ? "text-gray-500" :
                item.source === "docker" ? "text-blue-600 border-blue-200" :
                item.source === "systemd" ? "text-green-600 border-green-200" :
                item.source === "launchd" ? "text-orange-600 border-orange-200" :
                item.source === "brew" ? "text-purple-600 border-purple-200" : ""
              }
            >
              <Tag className="h-3 w-3 mr-1" />
              {item.source}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  ));

  return (
    <TooltipProvider>
      <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 ${settings.compactMode ? 'text-sm' : ''}`}>
        <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-primary rounded-xl shadow-lg">
                <Network className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  zPorter
                </h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                  Cross-platform port & process manager
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Badge variant="secondary" className="px-3 py-1">
                <Activity className="h-3 w-3 mr-1" />
                {portData.length > 0 ? `${portData.length} Found` : 'Ready'}
              </Badge>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
              {/* Search Section */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Search className="h-5 w-5 text-primary" />
                    Port Scanner
                  </CardTitle>
                  <CardDescription className="text-base">
                    Enter ports separated by commas or ranges (e.g., 3000, 5432, 8000-8100)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col gap-4">
                    <div className="w-full">
                      <label className="text-sm font-medium mb-2 block text-slate-700">
                        Port Numbers
                      </label>
                      <Input
                        placeholder="3000, 5432, 8000-8100"
                        value={ports}
                        onChange={(e) => setPorts(e.target.value)}
                        className="w-full h-11 text-base"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                      <Button
                        onClick={searchPorts}
                        disabled={loading || !ports.trim()}
                        size="lg"
                        className="flex-1 sm:flex-none px-8 h-11"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Scanning...
                          </>
                        ) : (
                          <>
                            <Search className="h-4 w-4 mr-2" />
                            Scan Ports
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={searchAllPorts}
                        disabled={loading}
                        variant="outline"
                        size="lg"
                        className="flex-1 sm:flex-none px-8 h-11"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Scanning...
                          </>
                        ) : (
                          <>
                            <Server className="h-4 w-4 mr-2" />
                            Show All Ports
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Results Section */}
              {portData.length > 0 && (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Server className="h-5 w-5 text-primary" />
                      Found {portData.length} Process{portData.length !== 1 ? 'es' : ''} Using the Specified Ports
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Desktop Table View */}
                    <div className="hidden lg:block">
                      <div className="rounded-md border overflow-hidden">
                        <ScrollArea className="h-[600px] w-full">
                          <Table className={settings.tableDensity === 'compact' ? 'text-sm' : ''}>
                            <TableHeader className="bg-slate-50/80 dark:bg-slate-800/80 sticky top-0">
                              <TableRow>
                                <TableHead className="text-center w-20 font-semibold">Port</TableHead>
                                <TableHead className="text-center w-24 font-semibold">Protocol</TableHead>
                                <TableHead className="text-center w-20 font-semibold">PID</TableHead>
                                <TableHead className="min-w-0 w-1/3 font-semibold">Executable Path</TableHead>
                                <TableHead className="text-center w-24 font-semibold">User</TableHead>
                                <TableHead className="text-center w-32 font-semibold">Source</TableHead>
                                <TableHead className="text-center w-32 font-semibold">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {rows}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </div>
                    </div>

                    {/* Mobile/Tablet Card View */}
                    <div className="lg:hidden">
                      <ScrollArea className="h-[600px] w-full">
                        <div className="space-y-4">
                          {processCards}
                        </div>
                      </ScrollArea>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Empty State */}
              {portData.length === 0 && !loading && (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="py-16">
                    <div className="text-center space-y-6">
                      <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center">
                        <Network className="h-12 w-12 text-slate-400" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-slate-900">
                          No processes found
                        </h3>
                        <p className="text-slate-600 max-w-md mx-auto">
                          Try entering different port numbers or check if the services are running
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={searchPorts}
                        className="mt-4"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Try Again
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>

          {/* Confirmation Dialog */}
          <Dialog open={confirmDialog?.open || false} onOpenChange={() => setConfirmDialog(null)}>
            <DialogContent className="sm:max-w-md mx-4 sm:mx-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Confirm {confirmDialog?.force ? 'Force' : 'Graceful'} Termination
                </DialogTitle>
                <DialogDescription asChild>
                  <div className="space-y-4 mt-4">
                    <p className="text-slate-600 text-sm sm:text-base">
                      Are you sure you want to {confirmDialog?.force ? 'force terminate' : 'gracefully terminate'} the following process?
                    </p>
                    <div className="bg-slate-50 p-3 sm:p-4 rounded-lg border">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-slate-700">PID:</span>
                          <span className="ml-2 text-slate-900">{confirmDialog?.pid}</span>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">Process:</span>
                          <span className="ml-2 text-slate-900 break-all">{confirmDialog?.processName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <Shield className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-orange-800">
                        {confirmDialog?.force
                          ? 'Force termination will immediately kill the process without cleanup. This may cause data loss.'
                          : 'Graceful termination allows the process to clean up before exiting. This is the recommended method.'
                        }
                      </p>
                    </div>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end mt-6">
                <Button variant="outline" onClick={() => setConfirmDialog(null)} className="order-2 sm:order-1">
                  Cancel
                </Button>
                <Button
                  variant={confirmDialog?.force ? "destructive" : "default"}
                  onClick={confirmKill}
                  className="min-w-32 order-1 sm:order-2"
                >
                  {confirmDialog?.force ? (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Force Terminate
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Graceful Terminate
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default App;
