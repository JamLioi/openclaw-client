use serde::{Deserialize, Serialize};
use tauri::Emitter;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionConfig {
    pub host: String,
    pub port: u16,
    pub token: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: String,
    pub role: String,
    pub content: String,
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatRequest {
    pub model: String,
    pub messages: Vec<Message>,
    pub stream: bool,
}

#[tauri::command]
async fn send_chat_message(
    config: ConnectionConfig,
    request: ChatRequest,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    let url = format!("http://{}:{}/v1/chat/completions", config.host, config.port);
    
    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", config.token))
        .header("Content-Type", "application/json")
        .json(&request)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    
    let body = response.text().await.map_err(|e| e.to_string())?;
    Ok(body)
}

#[tauri::command]
async fn stream_chat_message(
    config: ConnectionConfig,
    request: ChatRequest,
    window: tauri::Window,
) -> Result<(), String> {
    let client = reqwest::Client::new();
    let url = format!("http://{}:{}/v1/chat/completions", config.host, config.port);
    
    eprintln!("[HTTP] POST {}:{} -> {}", config.host, config.port, url);
    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", config.token))
        .header("Content-Type", "application/json")
        .json(&request)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    eprintln!("[HTTP] status: {}", response.status());
    
    let mut stream = response.bytes_stream();
    use futures::StreamExt;
    
    let mut buffer = String::new();
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));
        
        // Parse SSE: extract data: lines
        while let Some(line_end) = buffer.find('\n') {
            let line = buffer[..line_end].trim().to_string();
            buffer = buffer[line_end+1..].to_string();
            
            if line.starts_with("data: ") {
                let data = &line[6..];
                if data == "[DONE]" {
                    window.emit("stream-chunk", "[DONE]".to_string()).map_err(|e| e.to_string())?;
                } else if !data.is_empty() {
                    window.emit("stream-chunk", data.to_string()).map_err(|e| e.to_string())?;
                }
            }
        }
    }
    
    Ok(())
}

#[tauri::command]
async fn test_connection(config: ConnectionConfig) -> Result<bool, String> {
    let client = reqwest::Client::new();
    let url = format!("http://{}:{}/v1/models", config.host, config.port);
    
    eprintln!("[HTTP] GET {} -> {}", url, url);
    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", config.token))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    eprintln!("[HTTP] status: {}", response.status());
    
    Ok(response.status().is_success())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            send_chat_message,
            stream_chat_message,
            test_connection
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
