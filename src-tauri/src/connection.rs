use gremlin_client::{aio::GremlinClient, ConnectionOptions};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionConfig {
    pub name: String,
    pub host: String,
    pub port: u16,
    #[serde(default)]
    pub username: Option<String>,
    #[serde(default)]
    pub password: Option<String>,
    #[serde(default)]
    pub use_ssl: bool,
}

impl ConnectionConfig {
    pub fn to_connection_options(&self) -> ConnectionOptions {
        let mut builder = ConnectionOptions::builder()
            .host(&self.host)
            .port(self.port);

        if let (Some(user), Some(pass)) = (&self.username, &self.password) {
            builder = builder.credentials(user, pass);
        }

        if self.use_ssl {
            builder = builder.ssl(true);
        }

        builder.build()
    }
}

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
    let opts = config.to_connection_options();

    let client = GremlinClient::connect(opts)
        .await
        .map_err(|e| format!("Connection failed: {}", e))?;

    let mut state = state.lock().await;
    state.client = Some(client);
    state.config = Some(config.clone());

    Ok(format!("Connected to {}:{}", config.host, config.port))
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
    let opts = config.to_connection_options();

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
