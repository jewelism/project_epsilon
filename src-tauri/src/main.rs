// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]


use serde::{Deserialize, Serialize};
use std::net::SocketAddr;

use hyper::server::conn::http1;
use hyper_util::rt::TokioIo;
use serde_json::Value;
use socketioxide::{
    extract::{AckSender, Bin, Data, SocketRef},
    SocketIo,
};
use tokio::net::TcpListener;
use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;

#[tauri::command]
fn greet(name: &str) -> String {
   format!("Hello, {}!", name)
}

#[derive(Serialize, Deserialize)]
struct PlayerPoint {
  x: i32,
  y: i32,
}

fn on_connect(socket: SocketRef, Data(data): Data<Value>) {
  println!("Message from Rust: {}", socket.id);
  info!("Socket.IO connected: {:?} {:?}", socket.ns(), socket.id);
  socket.emit("auth", data).ok();

  socket.on(
      "message",
      |socket: SocketRef, Data::<Value>(data), Bin(bin)| {
          info!("Received event: {:?} {:?}", data, bin);
          socket.bin(bin).emit("message-back", data).ok();
      },
  );

  socket.on(
      "message-with-ack",
      |Data::<Value>(data), ack: AckSender, Bin(bin)| {
          info!("Received event: {:?} {:?}", data, bin);
          ack.bin(bin).send(data).ok();
      },
  );
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
  info!("Starting server");
  let subscriber = FmtSubscriber::builder()
        .with_line_number(true)
        .with_max_level(Level::TRACE)
        .finish();
    tracing::subscriber::set_global_default(subscriber)?;

    let (svc, io) = SocketIo::new_svc();

    io.ns("/", on_connect);

    let addr = SocketAddr::from(([127, 0, 0, 1], 20058));
    let listener = TcpListener::bind(addr).await?;
    
    // 소켓 서버를 수용하는 루프를 별도의 비동기 태스크로 실행
  let server_task = tokio::spawn(async move {
    loop {
      let (stream, _) = listener.accept().await.unwrap();
      let io = TokioIo::new(stream);
      let svc = svc.clone();

      tokio::task::spawn(async move {
        if let Err(err) = http1::Builder::new()
            .serve_connection(io, svc)
            .with_upgrades()
            .await
        {
            println!("Error serving connection: {:?}", err);
        }
      });
    }
  });

  // Tauri 애플리케이션 실행
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![greet])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");

  // 서버 태스크가 완료될 때까지 기다림 (이 경우에는 무한 루프이므로 실제로는 완료되지 않음)
  server_task.await.unwrap();

  Ok(())
    // tauri::Builder::default()
    //   .invoke_handler(tauri::generate_handler![greet])
    //   .run(tauri::generate_context!())
    //   .expect("error while running tauri application");
    // // We start a loop to continuously accept incoming connections
    // loop {
    //   println!("await server1");
    //     let (stream, _) = listener.accept().await?;
    //     println!("await server2");

    //     // Use an adapter to access something implementing `tokio::io` traits as if they implement
    //     // `hyper::rt` IO traits.
    //     let io = TokioIo::new(stream);
    //     let svc = svc.clone();

    //     // Spawn a tokio task to serve multiple connections concurrently
    //     tokio::task::spawn(async move {
    //         // Finally, we bind the incoming connection to our `hello` service
    //         if let Err(err) = http1::Builder::new()
    //             .serve_connection(io, svc)
    //             .with_upgrades()
    //             .await
    //         {
    //             println!("Error serving connection: {:?}", err);
    //         }
    //     });
    // }
}