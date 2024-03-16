#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use tauri::{utils::config::AppUrl, window::WindowBuilder, WindowUrl};
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

// broadcast 함수
async fn broadcast(clients: Arc<Mutex<HashMap<Uuid, UnboundedSender<Message>>>>, message: Message) {
  for (_, tx) in (*clients.lock().unwrap()).iter() {
    match tx.send(message.clone()) {
      Ok(_) => {
          println!("server: Message sent successfully: {}", message);
      }
      Err(err) => {
          eprintln!("Error sending message: {}", err);
      }
    }
  }
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
          println!("server: Received a message: {}", msg);
          broadcast(clients.clone(), msg).await;
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
  let port = portpicker::pick_unused_port().expect("failed to find unused port");
  let mut context = tauri::generate_context!();
  let url = format!("http://localhost:{}", port).parse().unwrap();
  let window_url = WindowUrl::External(url);
  // rewrite the config so the IPC is enabled on this URL
  context.config_mut().build.dist_dir = AppUrl::Url(window_url.clone());

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
      WindowBuilder::new(
        app,
        "main".to_string(),
        if cfg!(dev) {
          Default::default()
        } else {
          window_url
        }
      );
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![serving])  
    .plugin(tauri_plugin_websocket::init())
    .plugin(tauri_plugin_localhost::Builder::new(port).build())
    // .run(tauri::generate_context!())
    .run(context)
    .expect("error while running tauri application");
}