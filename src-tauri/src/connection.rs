use gremlin_client::{aio::GremlinClient, ConnectionOptions, GraphSON};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ConnectionConfig {
    Standard {
        name: String,
        host: String,
        port: u16,
        #[serde(default)]
        username: Option<String>,
        #[serde(default)]
        password: Option<String>,
        #[serde(default)]
        use_ssl: bool,
    },
    Cosmos {
        name: String,
        endpoint: String,
        database: String,
        container: String,
        key: String,
    },
}

impl ConnectionConfig {
    pub fn name(&self) -> &str {
        match self {
            ConnectionConfig::Standard { name, .. } => name,
            ConnectionConfig::Cosmos { name, .. } => name,
        }
    }

    pub fn display_info(&self) -> String {
        match self {
            ConnectionConfig::Standard { host, port, .. } => format!("{}:{}", host, port),
            ConnectionConfig::Cosmos {
                endpoint,
                database,
                container,
                ..
            } => format!("{}/{}/{}", endpoint, database, container),
        }
    }

    pub fn to_connection_options(&self) -> Result<ConnectionOptions, String> {
        match self {
            ConnectionConfig::Standard {
                host,
                port,
                username,
                password,
                use_ssl,
                ..
            } => {
                let mut builder = ConnectionOptions::builder().host(host).port(*port);

                if let (Some(user), Some(pass)) = (username, password) {
                    builder = builder.credentials(user, pass);
                }

                if *use_ssl {
                    builder = builder.ssl(true);
                }

                Ok(builder.build())
            }
            ConnectionConfig::Cosmos {
                endpoint,
                database,
                container,
                key,
                ..
            } => {
                // CosmosDB uses "/" as the WebSocket path (not "/gremlin")
                // Username format: /dbs/<database>/colls/<container>
                // CosmosDB only supports GraphSON v2
                let username = format!("/dbs/{}/colls/{}", database, container);
                Ok(ConnectionOptions::builder()
                    .host(endpoint)
                    .port(443)
                    .ssl(true)
                    .path("/")
                    .credentials(&username, key)
                    .serializer(GraphSON::V2)
                    .deserializer(GraphSON::V2)
                    .build())
            }
        }
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
