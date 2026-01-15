use crate::connection::SharedConnectionState;
use futures::StreamExt;
use gremlin_client::{GKey, GValue, GID};
use serde_json::{json, Value as JsonValue};

fn gid_to_json(id: &GID) -> JsonValue {
    match id {
        GID::Int32(n) => json!(n),
        GID::Int64(n) => json!(n),
        GID::String(s) => json!(s),
    }
}

fn gkey_to_string(key: &GKey) -> String {
    match key {
        GKey::String(s) => s.clone(),
        GKey::Token(t) => t.value().to_string(),
        GKey::Vertex(v) => format!("vertex:{}", gid_to_json(v.id())),
        GKey::Edge(e) => format!("edge:{}", gid_to_json(e.id())),
        GKey::T(t) => format!("{:?}", t),
        GKey::Direction(d) => format!("{:?}", d),
    }
}

fn gvalue_to_json(value: &GValue) -> JsonValue {
    match value {
        GValue::Null => JsonValue::Null,
        GValue::Bool(b) => json!(b),
        GValue::Int32(n) => json!(n),
        GValue::Int64(n) => json!(n),
        GValue::Float(n) => json!(n),
        GValue::Double(n) => json!(n),
        GValue::String(s) => json!(s),
        GValue::List(list) => {
            let items: Vec<JsonValue> = list.iter().map(gvalue_to_json).collect();
            json!(items)
        }
        GValue::Map(map) => {
            let mut obj = serde_json::Map::new();
            for (k, v) in map.iter() {
                let key = gkey_to_string(k);
                obj.insert(key, gvalue_to_json(v));
            }
            JsonValue::Object(obj)
        }
        GValue::Vertex(v) => {
            json!({
                "type": "vertex",
                "id": gid_to_json(v.id()),
                "label": v.label(),
            })
        }
        GValue::Edge(e) => {
            json!({
                "type": "edge",
                "id": gid_to_json(e.id()),
                "label": e.label(),
                "inV": gid_to_json(e.in_v().id()),
                "outV": gid_to_json(e.out_v().id()),
            })
        }
        GValue::Path(path) => {
            let objects: Vec<JsonValue> = path.objects().iter().map(gvalue_to_json).collect();
            json!({
                "type": "path",
                "objects": objects,
            })
        }
        GValue::Uuid(u) => json!(u.to_string()),
        GValue::Date(d) => json!(d.timestamp_millis()),
        // Handle other types as debug strings
        other => json!(format!("{:?}", other)),
    }
}

#[tauri::command]
pub async fn execute_query(
    query: String,
    state: tauri::State<'_, SharedConnectionState>,
) -> Result<String, String> {
    let state = state.lock().await;

    let client = state
        .client
        .as_ref()
        .ok_or_else(|| "Not connected to a database".to_string())?;

    let results = client
        .execute(&query, &[])
        .await
        .map_err(|e| format!("Query execution failed: {}", e))?;

    // Collect results from the async stream
    let results_vec: Vec<GValue> = results
        .map(|r| r.map_err(|e| format!("Error reading result: {}", e)))
        .collect::<Vec<_>>()
        .await
        .into_iter()
        .collect::<Result<Vec<_>, _>>()?;

    let json_results: Vec<JsonValue> = results_vec.iter().map(gvalue_to_json).collect();

    serde_json::to_string_pretty(&json_results)
        .map_err(|e| format!("Failed to serialize results: {}", e))
}
