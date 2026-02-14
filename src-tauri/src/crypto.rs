use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use pbkdf2::pbkdf2_hmac_array;
use rand::RngCore;
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use std::collections::HashMap;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

// Seed provides additional entropy beyond the PIN.
// Set PELTZER_SEED env var at compile time for release builds (via GitHub secrets).
// Falls back to dev seed for local development.
const SEED: &[u8] = match option_env!("PELTZER_SEED") {
    Some(s) => s.as_bytes(),
    None => b"peltzer-dev-seed-not-for-production",
};

const PBKDF2_ITERATIONS: u32 = 100_000;
const CREDENTIALS_STORE: &str = "credentials.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Credentials {
    pub username: Option<String>,
    pub password: Option<String>,
    pub key: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct EncryptedData {
    iv: String,
    salt: String,
    data: String,
}

fn derive_key(pin: &str, salt: &[u8]) -> [u8; 32] {
    // Combine seed and PIN
    let mut combined = Vec::with_capacity(SEED.len() + pin.len());
    combined.extend_from_slice(SEED);
    combined.extend_from_slice(pin.as_bytes());

    pbkdf2_hmac_array::<Sha256, 32>(&combined, salt, PBKDF2_ITERATIONS)
}

fn encrypt(data: &str, pin: &str) -> Result<EncryptedData, String> {
    let mut salt = [0u8; 16];
    let mut iv = [0u8; 12];
    rand::thread_rng().fill_bytes(&mut salt);
    rand::thread_rng().fill_bytes(&mut iv);

    let key = derive_key(pin, &salt);
    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|e| e.to_string())?;
    let nonce = Nonce::from_slice(&iv);

    let ciphertext = cipher
        .encrypt(nonce, data.as_bytes())
        .map_err(|e| e.to_string())?;

    Ok(EncryptedData {
        iv: BASE64.encode(iv),
        salt: BASE64.encode(salt),
        data: BASE64.encode(ciphertext),
    })
}

fn decrypt(encrypted: &EncryptedData, pin: &str) -> Result<String, String> {
    let iv = BASE64.decode(&encrypted.iv).map_err(|e| e.to_string())?;
    let salt = BASE64.decode(&encrypted.salt).map_err(|e| e.to_string())?;
    let ciphertext = BASE64.decode(&encrypted.data).map_err(|e| e.to_string())?;

    let key = derive_key(pin, &salt);
    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|e| e.to_string())?;
    let nonce = Nonce::from_slice(&iv);

    let plaintext = cipher
        .decrypt(nonce, ciphertext.as_ref())
        .map_err(|_| "Invalid PIN".to_string())?;

    String::from_utf8(plaintext).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn store_credentials(
    app: AppHandle,
    connection_name: String,
    credentials: Credentials,
    pin: String,
) -> Result<(), String> {
    let json = serde_json::to_string(&credentials).map_err(|e| e.to_string())?;
    let encrypted = encrypt(&json, &pin)?;

    let store = app.store(CREDENTIALS_STORE).map_err(|e| e.to_string())?;

    // Get existing credentials map or create new one
    let mut creds_map: HashMap<String, EncryptedData> = store
        .get("credentials")
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();

    creds_map.insert(connection_name, encrypted);

    store.set("credentials", serde_json::to_value(&creds_map).unwrap());
    store.save().map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn retrieve_credentials(
    app: AppHandle,
    connection_name: String,
    pin: String,
) -> Result<Credentials, String> {
    let store = app.store(CREDENTIALS_STORE).map_err(|e| e.to_string())?;

    let creds_map: HashMap<String, EncryptedData> = store
        .get("credentials")
        .and_then(|v| serde_json::from_value(v).ok())
        .ok_or_else(|| "No credentials found".to_string())?;

    let encrypted = creds_map
        .get(&connection_name)
        .ok_or_else(|| "No credentials found for this connection".to_string())?;

    let json = decrypt(encrypted, &pin)?;
    serde_json::from_str(&json).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn remove_credentials(app: AppHandle, connection_name: String) -> Result<(), String> {
    let store = app.store(CREDENTIALS_STORE).map_err(|e| e.to_string())?;

    let mut creds_map: HashMap<String, EncryptedData> = store
        .get("credentials")
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();

    creds_map.remove(&connection_name);

    store.set("credentials", serde_json::to_value(&creds_map).unwrap());
    store.save().map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encrypt_decrypt_roundtrip() {
        let data = r#"{"username":"admin","password":"secret123"}"#;
        let pin = "1234";

        let encrypted = encrypt(data, pin).unwrap();
        let decrypted = decrypt(&encrypted, pin).unwrap();

        assert_eq!(data, decrypted);
    }

    #[test]
    fn wrong_pin_fails_decryption() {
        let data = r#"{"username":"admin","password":"secret123"}"#;
        let pin = "1234";
        let wrong_pin = "5678";

        let encrypted = encrypt(data, pin).unwrap();
        let result = decrypt(&encrypted, wrong_pin);

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Invalid PIN");
    }

    #[test]
    fn different_encryptions_have_different_ivs() {
        let data = "test data";
        let pin = "1234";

        let encrypted1 = encrypt(data, pin).unwrap();
        let encrypted2 = encrypt(data, pin).unwrap();

        assert_ne!(encrypted1.iv, encrypted2.iv);
        assert_ne!(encrypted1.salt, encrypted2.salt);
        assert_ne!(encrypted1.data, encrypted2.data);
    }
}
