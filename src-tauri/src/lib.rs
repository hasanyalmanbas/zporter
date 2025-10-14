use serde::{Deserialize, Serialize};
use sysinfo::{Pid, ProcessesToUpdate, System};
use tokio::time::{sleep, Duration};

#[derive(Serialize, Deserialize, Clone)]
pub struct PortInfo {
    pub port: u16,
    pub protocol: String,
    pub pid: u32,
    pub process_name: String,
    pub exe_path: String,
    pub user: String,
    pub source: String,
    pub remarks: String,
}

#[derive(Serialize, Deserialize)]
pub struct KillResult {
    pub success: bool,
    pub message: String,
}

#[tauri::command]
async fn list_ports(ports: Vec<u16>, only_listening: bool) -> Result<Vec<PortInfo>, String> {
    use std::process::Command;

    let mut results = Vec::new();

    for &port in &ports {
        // Use lsof to find processes using the port
        let output = Command::new("lsof")
            .args(&["-i", &format!(":{}", port), "-P", "-n"])
            .output();

        match output {
            Ok(output) => {
                if output.status.success() {
                    let stdout = String::from_utf8_lossy(&output.stdout);
                    let lines: Vec<&str> = stdout.lines().collect();

                    // Skip header line
                    for line in lines.iter().skip(1) {
                        let parts: Vec<&str> = line.split_whitespace().collect();
                        if parts.len() >= 9 {
                            let _command = parts[0];
                            let pid_str = parts[1];
                            let user = parts[2];

                            // Parse PID
                            if let Ok(pid) = pid_str.parse::<u32>() {
                                // Get process info using sysinfo
                                let mut system = System::new();
                                system.refresh_processes(ProcessesToUpdate::All, true);

                                let (process_name, exe_path) = if let Some(process) = system.process(Pid::from(pid as usize)) {
                                    (process.name().to_string_lossy().to_string(),
                                     process.exe().map_or_else(|| "".to_string(), |p| p.to_string_lossy().to_string()))
                                } else {
                                    ("unknown".to_string(), "".to_string())
                                };

                                // Detect source
                                let source = detect_source_sync(pid);

                                // Parse connection info from the name field
                                let name = parts[8..].join(" ");
                                let (protocol, is_listening) = if name.contains("(LISTEN)") {
                                    ("tcp".to_string(), true)
                                } else if name.contains("UDP") {
                                    ("udp".to_string(), false)
                                } else {
                                    ("tcp".to_string(), false)
                                };

                                // Only include listening sockets if requested
                                if !only_listening || is_listening {
                                    results.push(PortInfo {
                                        port,
                                        protocol,
                                        pid,
                                        process_name,
                                        exe_path,
                                        user: user.to_string(),
                                        source,
                                        remarks: if is_listening { "LISTENING".to_string() } else { "CONNECTED".to_string() },
                                    });
                                }
                            }
                        }
                    }
                }
            }
            Err(e) => {
                eprintln!("Failed to run lsof: {}", e);
            }
        }
    }

    Ok(results)
}

#[tauri::command]
async fn kill_process(pid: u32, force: bool) -> Result<KillResult, String> {
    let mut system = System::new();
    system.refresh_processes(ProcessesToUpdate::All, true);

    if let Some(process) = system.process(Pid::from(pid as usize)) {
        // Try graceful termination first
        if !force {
            if process.kill() {
                // Wait a bit to see if it terminates
                sleep(Duration::from_millis(800)).await;
                let mut system_check = System::new();
                system_check.refresh_processes(ProcessesToUpdate::All, true);
                if system_check.process(Pid::from(pid as usize)).is_none() {
                    return Ok(KillResult {
                        success: true,
                        message: "Process terminated gracefully".to_string(),
                    });
                }
            }
        }

        // Force kill if graceful failed or force requested
        if process.kill_with(sysinfo::Signal::Kill).unwrap_or(false) {
            Ok(KillResult {
                success: true,
                message: "Process force terminated".to_string(),
            })
        } else {
            Err("Failed to terminate process - permission denied. Try running with elevated privileges.".to_string())
        }
    } else {
        Err("Process not found".to_string())
    }
}

#[tauri::command]
async fn kill_by_port(port: u16, force: bool) -> Result<KillResult, String> {
    // First get processes using the port
    let ports_info = list_ports(vec![port], true).await?;
    if ports_info.is_empty() {
        return Err(format!("No process found listening on port {}", port));
    }

    // Kill the first process found (there should typically be only one listener)
    let pid = ports_info[0].pid;
    kill_process(pid, force).await
}

fn detect_source_sync(pid: u32) -> String {
    let mut system = System::new();
    system.refresh_processes(ProcessesToUpdate::All, true);

    if let Some(process) = system.process(Pid::from(pid as usize)) {
        let exe_path = process.exe().map_or_else(|| "".to_string(), |p| p.to_string_lossy().to_string());

        // Simple heuristics for source detection
        if exe_path.contains("docker") || exe_path.contains("containerd") {
            "docker".to_string()
        } else if exe_path.contains("systemd") {
            "systemd".to_string()
        } else if exe_path.contains("launchd") {
            "launchd".to_string()
        } else if exe_path.contains("brew") {
            "brew".to_string()
        } else {
            "unknown".to_string()
        }
    } else {
        "unknown".to_string()
    }
}

#[tauri::command]
async fn list_all_ports() -> Result<Vec<PortInfo>, String> {
    use std::process::Command;

    let mut results = Vec::new();

    // Use lsof to find all network connections
    let output = Command::new("lsof")
        .args(&["-i", "-P", "-n"])
        .output();

    match output {
        Ok(output) => {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let lines: Vec<&str> = stdout.lines().collect();

                // Skip header line
                for line in lines.iter().skip(1) {
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if parts.len() >= 9 {
                        let _command = parts[0];
                        let pid_str = parts[1];
                        let user = parts[2];

                        // Parse PID
                        if let Ok(pid) = pid_str.parse::<u32>() {
                            // Get process info using sysinfo
                            let mut system = System::new();
                            system.refresh_processes(ProcessesToUpdate::All, true);

                            let (process_name, exe_path) = if let Some(process) = system.process(Pid::from(pid as usize)) {
                                (process.name().to_string_lossy().to_string(),
                                 process.exe().map_or_else(|| "".to_string(), |p| p.to_string_lossy().to_string()))
                            } else {
                                ("unknown".to_string(), "".to_string())
                            };

                            // Detect source
                            let source = detect_source_sync(pid);

                            // Parse connection info from the name field
                            let name = parts[8..].join(" ");
                            let (protocol, port_str) = if let Some(port_part) = name.split(':').last() {
                                if let Some(port_num) = port_part.split(' ').next() {
                                    if let Ok(port) = port_num.parse::<u16>() {
                                        if name.contains("(LISTEN)") {
                                            ("tcp".to_string(), port)
                                        } else if name.contains("UDP") {
                                            ("udp".to_string(), port)
                                        } else {
                                            ("tcp".to_string(), port)
                                        }
                                    } else {
                                        continue;
                                    }
                                } else {
                                    continue;
                                }
                            } else {
                                continue;
                            };

                            results.push(PortInfo {
                                port: port_str,
                                protocol,
                                pid,
                                process_name,
                                exe_path,
                                user: user.to_string(),
                                source,
                                remarks: if name.contains("(LISTEN)") { "LISTENING".to_string() } else { "CONNECTED".to_string() },
                            });
                        }
                    }
                }
            }
        }
        Err(e) => {
            eprintln!("Failed to run lsof: {}", e);
        }
    }

    Ok(results)
}

#[tauri::command]
fn detect_source(pid: u32) -> String {
    let mut system = System::new();
    system.refresh_processes(ProcessesToUpdate::All, true);

    if let Some(process) = system.process(Pid::from(pid as usize)) {
        let exe_path = process.exe().map_or_else(|| "".to_string(), |p| p.to_string_lossy().to_string());

        // Simple heuristics for source detection
        if exe_path.contains("docker") || exe_path.contains("containerd") {
            "docker".to_string()
        } else if exe_path.contains("systemd") {
            "systemd".to_string()
        } else if exe_path.contains("launchd") {
            "launchd".to_string()
        } else if exe_path.contains("brew") {
            "brew".to_string()
        } else {
            "unknown".to_string()
        }
    } else {
        "unknown".to_string()
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            list_ports,
            list_all_ports,
            kill_process,
            kill_by_port,
            detect_source
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
