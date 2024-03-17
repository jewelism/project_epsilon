#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

#[tauri::command]
fn serving(name: &str) -> String {
  // tauri::async_runtime::spawn(start_server());
  format!("Hello, {}!", name)
}

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      tauri::WindowBuilder::new(
        app,
        "local2", /* the unique window label */
        tauri::WindowUrl::App("index.html".into())
      ).build()?;
      tauri::WindowBuilder::new(
        app,
        "local",
        tauri::WindowUrl::App("index.html".into())
      ).build()?;
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![serving])  
    .plugin(tauri_plugin_websocket::init())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}