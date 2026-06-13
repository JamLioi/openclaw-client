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
) -> Result<String, String> {
    let client = reqwest::Client::new();
    let url = format!("http://{}:{}/v1/chat/completions", config.host, config.port);
    
    let mut req = request;
    req.stream = false;
    
    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", config.token))
        .header("Content-Type", "application/json")
        .json(&req)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    
    let body = response.text().await.map_err(|e| e.to_string())?;
    
    let json: serde_json::Value = serde_json::from_str(&body).map_err(|e| e.to_string())?;
    let content = json["choices"][0]["message"]["content"]
        .as_str()
        .unwrap_or("")
        .to_string();
    
    Ok(content)
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


#[tauri::command]
async fn fetch_models(config: ConnectionConfig) -> Result<Vec<String>, String> {
    let client = reqwest::Client::new();
    let url = format!("http://{}:{}/v1/models", config.host, config.port);
    
    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", config.token))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    
    let body: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
    let models = body["data"]
        .as_array()
        .map(|arr| arr.iter().filter_map(|m| m["id"].as_str().map(String::from)).collect())
        .unwrap_or_default();
    Ok(models)
}


#[tauri::command]
async fn generate_log(config: ConnectionConfig, messages_json: String) -> Result<String, String> {
    use std::time::{SystemTime, UNIX_EPOCH};
    let ts = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
    
    let mut log = String::new();
    log.push_str(&format!("=== OpenClaw Client Debug Log ===\n"));
    log.push_str(&format!("Time: {}\n", ts));
    log.push_str(&format!("Host: {}\n", config.host));
    log.push_str(&format!("Port: {}\n", config.port));
    log.push_str(&format!("Token: {}...{}\n", &config.token[..4.min(config.token.len())], &config.token[config.token.len().saturating_sub(4)..]));
    log.push_str(&format!("Token length: {}\n\n", config.token.len()));
    
    // Test connection
    let client = reqwest::Client::new();
    let url = format!("http://{}:{}/v1/models", config.host, config.port);
    log.push_str(&format!("=== Test GET {} ===\n", url));
    match client.get(&url).header("Authorization", format!("Bearer {}", config.token)).send().await {
        Ok(resp) => {
            log.push_str(&format!("Status: {}\n", resp.status()));
            match resp.text().await {
                Ok(body) => {
                    if body.len() > 500 {
                        log.push_str(&format!("Body (first 500): {}\n", &body[..500]));
                    } else {
                        log.push_str(&format!("Body: {}\n", body));
                    }
                }
                Err(e) => log.push_str(&format!("Body read error: {}\n", e)),
            }
        }
        Err(e) => log.push_str(&format!("Request error: {}\n", e)),
    }
    
    // Test chat
    let chat_url = format!("http://{}:{}/v1/chat/completions", config.host, config.port);
    let chat_body = serde_json::json!({
        "model": "openclaw/main",
        "messages": [{"role": "user", "content": "say hi"}],
        "stream": false
    });
    log.push_str(&format!("\n=== Test POST {} ===\n", chat_url));
    match client.post(&chat_url)
        .header("Authorization", format!("Bearer {}", config.token))
        .header("Content-Type", "application/json")
        .json(&chat_body)
        .send()
        .await {
        Ok(resp) => {
            log.push_str(&format!("Status: {}\n", resp.status()));
            match resp.text().await {
                Ok(body) => {
                    if body.len() > 500 {
                        log.push_str(&format!("Body (first 500): {}\n", &body[..500]));
                    } else {
                        log.push_str(&format!("Body: {}\n", body));
                    }
                }
                Err(e) => log.push_str(&format!("Body read error: {}\n", e)),
            }
        }
        Err(e) => log.push_str(&format!("Request error: {}\n", e)),
    }
    
    log.push_str(&format!("\n=== Messages ({}) ===\n", messages_json.len()));
    if messages_json.len() > 2000 {
        log.push_str(&format!("{}\n", &messages_json[..2000]));
    } else {
        log.push_str(&format!("{}\n", messages_json));
    }
    
    Ok(log)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            send_chat_message,
            stream_chat_message,
            test_connection,
            fetch_models,
            generate_log
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
