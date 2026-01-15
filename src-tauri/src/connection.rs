use gremlin_client::aio::GremlinClient;
use std::sync::Arc;
use tokio::sync::Mutex;

use crate::connection_config::ConnectionConfig;

pub struct ConnectionState {
    pub client: Option<GremlinClient>,
    pub config: Option<ConnectionConfig>,
}

impl Default for ConnectionState {
    fn default() -> Self {
        Self {
            client: None,
            config: None,
        }
    }
}

pub type SharedConnectionState = Arc<Mutex<ConnectionState>>;

pub fn create_connection_state() -> SharedConnectionState {
    Arc::new(Mutex::new(ConnectionState::default()))
}

#[tauri::command]
pub async fn connect(
    config: ConnectionConfig,
    state: tauri::State<'_, SharedConnectionState>,
) -> Result<String, String> {
    let opts = config.to_connection_options()?;

    let client = GremlinClient::connect(opts)
        .await
        .map_err(|e| format!("Connection failed: {}", e))?;

    let display = config.display_info();
    let mut state = state.lock().await;
    state.client = Some(client);
    state.config = Some(config);

    Ok(format!("Connected to {}", display))
}

#[tauri::command]
pub async fn disconnect(state: tauri::State<'_, SharedConnectionState>) -> Result<String, String> {
    let mut state = state.lock().await;

    if state.client.is_none() {
        return Err("Not connected".to_string());
    }

    state.client = None;
    state.config = None;

    Ok("Disconnected".to_string())
}

#[tauri::command]
pub async fn get_connection_status(
    state: tauri::State<'_, SharedConnectionState>,
) -> Result<Option<ConnectionConfig>, String> {
    let state = state.lock().await;
    Ok(state.config.clone())
}

#[tauri::command]
pub async fn test_connection(config: ConnectionConfig) -> Result<String, String> {
    let opts = config.to_connection_options()?;

    let client = GremlinClient::connect(opts)
        .await
        .map_err(|e| format!("Connection failed: {}", e))?;

    // Try a simple query to verify connection works
    let _ = client
        .execute("g.V().limit(1)", &[])
        .await
        .map_err(|e| format!("Query test failed: {}", e))?;

    Ok("Connection successful".to_string())
}
