import Phaser from "phaser";
import "normalize.css";
import { StartScene } from "@/scenes/StartScene";
import { MultiplayLobbyScene } from "@/scenes/MultiplayLobbyScene";
import { InGameScene } from "@/scenes/InGameScene";
import { InGameUIScene } from "@/scenes/InGameUIScene";
import { EditPlayerScene } from "@/scenes/EditPlayerScene";

const config: Phaser.Types.Core.GameConfig = {
  scene: [
    StartScene,
    EditPlayerScene,
    MultiplayLobbyScene,
    InGameScene,
    InGameUIScene,
  ],
  title: "project epsilon",
  url: "jewelism.github.io",
  // type: Phaser.WEBGL,
  // type: Phaser.CANVAS,
  scale: {
    mode: Phaser.Scale.FIT,
    // mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
    // width: Number(import.meta.env.RENDERER_VITE_WINDOW_WIDTH),
    // height: Number(import.meta.env.RENDERER_VITE_WINDOW_HEIGHT),
    // min: {
    //   width: 480 * 2,
    //   height: 270 * 2,
    // },
    // max: {
    //   width: 1920,
    //   height: 1080,
    // },
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: true,
    },
  },
  parent: "body",
  render: { pixelArt: true, antialias: false },
  dom: {
    createContainer: true,
  },
  // backgroundColor: '#222',
  // fps: {
  //   target: 10,
  //   forceSetTimeOut: true,
  // },
};

export const game = new Phaser.Game(config);
