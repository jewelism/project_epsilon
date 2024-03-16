#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use futures_util::StreamExt;
use tokio::net::{TcpListener, TcpStream};

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use uuid::Uuid;
// use tokio_tungstenite::WebSocketStream;
use tokio::sync::mpsc::{unbounded_channel, UnboundedSender, UnboundedReceiver};
use tokio_tungstenite::tungstenite::Message;

type Id = Uuid; // 클라이언트를 식별하는 데 사용되는 타입
type ClientMap = Arc<Mutex<HashMap<Id, UnboundedSender<Message>>>>;


#[tauri::command]
fn serving(name: &str) -> String {
  tauri::async_runtime::spawn(start_server());
  format!("Hello, {}!", name)
}

async fn start_server() {
  let addr = "127.0.0.1:20058".to_string();
  let clients: ClientMap = Arc::new(Mutex::new(HashMap::new()));

  // Create the event loop and TCP listener we'll accept connections on.
  let try_socket = TcpListener::bind(&addr).await;
  let listener = try_socket.expect("Failed to bind");

  while let Ok((stream, _)) = listener.accept().await {
    let clients_clone = Arc::clone(&clients);
    tokio::spawn(accept_connection(stream, clients_clone));
  }
  ()
}

async fn accept_connection(stream: TcpStream, clients: ClientMap) {
  let ws_stream = tokio_tungstenite::accept_async(stream)
    .await
    .expect("Error during the websocket handshake occurred");
  
  let (tx, _rx): (UnboundedSender<Message>, UnboundedReceiver<Message>) = unbounded_channel();

  let id = Uuid::new_v4(); // 클라이언트를 식별하는 데 사용되는 고유한 ID 생성
  clients.lock().unwrap().insert(id, tx.clone()); // 클라이언트를 저장
  for (id, _) in clients.lock().unwrap().iter() {
    println!("Client ID: {}", id);
  }

  let (_write, mut read) = ws_stream.split();

  let read_handle = tokio::spawn(async move {
    while let Some(message) = read.next().await {
      match message {
        Ok(msg) => {
          if let Err(err) = tx.send(msg) {
            eprintln!("Error sending message: {}", err);
          }
        }
        Err(err) => {
          eprintln!("Error reading message: {}", err);
        }
      }
    }
  });

  if let Err(e) = read_handle.await {
    eprintln!("Error: {}", e);
  }
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