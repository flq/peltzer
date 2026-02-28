mod connection;
mod connection_config;
mod crypto;
mod query;

use connection::{connect, disconnect, get_connection_status, test_connection};
use crypto::{remove_credentials, retrieve_credentials, store_credentials};
use query::execute_query;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(connection::create_connection_state())
        .invoke_handler(tauri::generate_handler![
            connect,
            disconnect,
            get_connection_status,
            test_connection,
            execute_query,
            store_credentials,
            retrieve_credentials,
            remove_credentials,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
