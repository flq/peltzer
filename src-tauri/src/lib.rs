mod connection;
mod query;

use connection::{connect, disconnect, get_connection_status, test_connection};
use query::execute_query;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .manage(connection::create_connection_state())
        .invoke_handler(tauri::generate_handler![
            connect,
            disconnect,
            get_connection_status,
            test_connection,
            execute_query,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
