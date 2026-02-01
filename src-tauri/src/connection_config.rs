use gremlin_client::{ConnectionOptions, GraphSON};
use serde::{Deserialize, Serialize};

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
        #[serde(default)]
        secure_storage: bool,
    },
    Cosmos {
        name: String,
        endpoint: String,
        database: String,
        container: String,
        key: String,
        #[serde(default)]
        secure_storage: bool,
    },
}

impl ConnectionConfig {
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn standard_connection_creates_correct_options() {
        let config = ConnectionConfig::Standard {
            name: "Test".to_string(),
            host: "localhost".to_string(),
            port: 8182,
            username: None,
            password: None,
            use_ssl: false,
            secure_storage: false,
        };

        let opts = config.to_connection_options().unwrap();
        assert_eq!(opts.websocket_url(), "ws://localhost:8182/gremlin");
    }

    #[test]
    fn standard_connection_with_ssl() {
        let config = ConnectionConfig::Standard {
            name: "Test".to_string(),
            host: "example.com".to_string(),
            port: 443,
            username: None,
            password: None,
            use_ssl: true,
            secure_storage: false,
        };

        let opts = config.to_connection_options().unwrap();
        assert_eq!(opts.websocket_url(), "wss://example.com:443/gremlin");
    }

    #[test]
    fn cosmos_connection_creates_correct_options() {
        let config = ConnectionConfig::Cosmos {
            name: "Test Cosmos".to_string(),
            endpoint: "myaccount.gremlin.cosmos.azure.com".to_string(),
            database: "mydb".to_string(),
            container: "mygraph".to_string(),
            key: "secret-key".to_string(),
            secure_storage: false,
        };

        let opts = config.to_connection_options().unwrap();
        // CosmosDB uses "/" path, not "/gremlin"
        assert_eq!(
            opts.websocket_url(),
            "wss://myaccount.gremlin.cosmos.azure.com:443/"
        );
    }

    #[test]
    fn display_info_standard() {
        let config = ConnectionConfig::Standard {
            name: "Test".to_string(),
            host: "localhost".to_string(),
            port: 8182,
            username: None,
            password: None,
            use_ssl: false,
            secure_storage: false,
        };

        assert_eq!(config.display_info(), "localhost:8182");
    }

    #[test]
    fn display_info_cosmos() {
        let config = ConnectionConfig::Cosmos {
            name: "Test".to_string(),
            endpoint: "myaccount.cosmos.azure.com".to_string(),
            database: "mydb".to_string(),
            container: "mygraph".to_string(),
            key: "secret".to_string(),
            secure_storage: false,
        };

        assert_eq!(
            config.display_info(),
            "myaccount.cosmos.azure.com/mydb/mygraph"
        );
    }

    #[test]
    fn secure_storage_defaults_to_false_when_missing() {
        let json = r#"{"type":"standard","name":"Test","host":"localhost","port":8182,"use_ssl":false}"#;
        let config: ConnectionConfig = serde_json::from_str(json).unwrap();
        match config {
            ConnectionConfig::Standard { secure_storage, .. } => {
                assert!(!secure_storage);
            }
            _ => panic!("Expected Standard variant"),
        }
    }

    #[test]
    fn secure_storage_cosmos_defaults_to_false_when_missing() {
        let json = r#"{"type":"cosmos","name":"Test","endpoint":"test.cosmos.azure.com","database":"db","container":"c","key":"k"}"#;
        let config: ConnectionConfig = serde_json::from_str(json).unwrap();
        match config {
            ConnectionConfig::Cosmos { secure_storage, .. } => {
                assert!(!secure_storage);
            }
            _ => panic!("Expected Cosmos variant"),
        }
    }
}
