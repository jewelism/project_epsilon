#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]
use tauri::Manager;

#[tauri::command]
fn serving(name: &str) -> String {
  // tauri::async_runtime::spawn(start_server());
  format!("Hello, {}!", name)
}

fn main() {
  tauri::Builder::default()
    // .setup(|app| {
    //   tauri::WindowBuilder::new(
    //     app,
    //     "local", /* the unique window label */
    //     tauri::WindowUrl::App("index.html".into())
    //   ).build()?;
      // tauri::WindowBuilder::new(
      //   app,
      //   "local2",
      //   tauri::WindowUrl::App("index.html".into())
      // ).build()?;
        // let window = app.get_window("main").unwrap();
        // let window2 = app.get_window("local").unwrap();
        // window.open_devtools();
        // window2.open_devtools();
        // window.close_devtools();
    //   Ok(())
    // })
    .invoke_handler(tauri::generate_handler![serving])  
    .plugin(tauri_plugin_websocket::init())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}