import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { OBJExporter } from "three/addons/exporters/OBJExporter.js";

(() => {
  const app = document.getElementById("app");
  const statusNode = document.getElementById("export-status");
  const selectionNode = document.getElementById("selection-label");
  const viewButtons = [...document.querySelectorAll("[data-view]")];
  const exportGlbButton = document.getElementById("export-glb");
  const exportObjButton = document.getElementById("export-obj");
  const designSelect = document.getElementById("design-select");
  const loadDesignButton = document.getElementById("load-design");
  const importDesignButton = document.getElementById("import-design");
  const designFileInput = document.getElementById("design-file");
  const catalogSelect = document.getElementById("catalog-select");
  const addItemButton = document.getElementById("add-item");
  const moveModeButton = document.getElementById("mode-move");
  const rotateModeButton = document.getElementById("mode-rotate");
  const rotateQuarterButton = document.getElementById("rotate-quarter");
  const duplicateItemButton = document.getElementById("duplicate-item");
  const deleteItemButton = document.getElementById("delete-item");
  const saveLayoutButton = document.getElementById("save-layout");
  const loadLayoutButton = document.getElementById("load-layout");
  const resetLayoutButton = document.getElementById("reset-layout");
  const layoutFileInput = document.getElementById("layout-file");
  const sizeXInput = document.getElementById("size-x");
  const sizeYInput = document.getElementById("size-y");
  const sizeZInput = document.getElementById("size-z");
  const constructorEnabled = false;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.98;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  app.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe4ddd3);
  scene.fog = new THREE.Fog(0xe4ddd3, 18, 42);

  const camera = new THREE.PerspectiveCamera(
    48,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0.4, 7.4, 16.8);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 8;
  controls.maxDistance = 28;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.target.set(0.0, 1.55, 2.65);
  controls.update();

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const roomEnvironment = new RoomEnvironment(renderer);
  scene.environment = pmremGenerator.fromScene(roomEnvironment, 0.04).texture;
  roomEnvironment.dispose();
  pmremGenerator.dispose();

  const transformControls = new TransformControls(camera, renderer.domElement);
  transformControls.visible = false;
  transformControls.size = 0.8;
  scene.add(transformControls);

  const layoutRoot = new THREE.Group();
  layoutRoot.name = "layout-root";
  scene.add(layoutRoot);

  const palette = {
    plaster: 0xf3ede4,
    plasterShadow: 0xe4d7c8,
    wood: 0x6a4a33,
    woodDark: 0x3d281b,
    paper: 0xc6a271,
    paperDark: 0x8d6643,
    steel: 0x90979c,
    steelDark: 0x5f666b,
    black: 0x1d1a18,
    upholstery: 0x8b7058,
    upholsteryDark: 0x644d3c,
    wicker: 0xbc8f5b,
    wickerDark: 0x89613b,
    floor: 0xb9a693,
    warmLight: 0xffd7a0,
    softGlow: 0xfff0d5,
    bronze: 0x97734b,
  };

  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

  function textureFromCanvas(
    width,
    height,
    draw,
    {
      colorSpace = THREE.SRGBColorSpace,
      wrapS = THREE.RepeatWrapping,
      wrapT = THREE.RepeatWrapping,
    } = {}
  ) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    draw(context, width, height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = colorSpace;
    texture.anisotropy = maxAnisotropy;
    texture.wrapS = wrapS;
    texture.wrapT = wrapT;
    return texture;
  }

  function grayscaleTextureFromCanvas(width, height, draw, options = {}) {
    return textureFromCanvas(width, height, draw, {
      colorSpace: THREE.NoColorSpace,
      ...options,
    });
  }

  function setRepeat(texture, x, y) {
    texture.repeat.set(x, y);
    return texture;
  }

  function randomNoise(context, width, height, alpha, count) {
    for (let i = 0; i < count; i += 1) {
      const shade = 180 + Math.floor(Math.random() * 50);
      context.fillStyle = `rgba(${shade}, ${shade - 12}, ${shade - 25}, ${alpha})`;
      const size = Math.random() * 3 + 0.6;
      context.fillRect(Math.random() * width, Math.random() * height, size, size);
    }
  }

  function randomMonochromeNoise(context, width, height, alpha, count, minShade = 120, shadeRange = 90) {
    for (let i = 0; i < count; i += 1) {
      const shade = minShade + Math.floor(Math.random() * shadeRange);
      context.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${alpha})`;
      const size = Math.random() * 3 + 0.5;
      context.fillRect(Math.random() * width, Math.random() * height, size, size);
    }
  }

  const plasterTexture = textureFromCanvas(
    768,
    768,
    (ctx, width, height) => {
      ctx.fillStyle = "#efe4d5";
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 22; i += 1) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = 60 + Math.random() * 150;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        const tone = 224 + Math.floor(Math.random() * 20);
        gradient.addColorStop(0, `rgba(${tone}, ${tone - 7}, ${tone - 14}, 0.16)`);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      }

      randomNoise(ctx, width, height, 0.1, 7000);
      randomMonochromeNoise(ctx, width, height, 0.035, 9500, 185, 36);

      for (let i = 0; i < 220; i += 1) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.018 + Math.random() * 0.018})`;
        ctx.lineWidth = 1.5 + Math.random() * 2.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.bezierCurveTo(
          x + (Math.random() - 0.5) * 40,
          y + (Math.random() - 0.5) * 18,
          x + (Math.random() - 0.5) * 42,
          y + (Math.random() - 0.5) * 22,
          x + (Math.random() - 0.5) * 46,
          y + (Math.random() - 0.5) * 16
        );
        ctx.stroke();
      }
    },
    {
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
    }
  );

  const woodTexture = setRepeat(
    textureFromCanvas(1024, 256, (ctx, width, height) => {
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, "#3f291c");
      gradient.addColorStop(0.22, "#6a4a33");
      gradient.addColorStop(0.5, "#835938");
      gradient.addColorStop(0.8, "#5f402b");
      gradient.addColorStop(1, "#2e1c12");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 190; i += 1) {
        const x = Math.random() * width;
        ctx.strokeStyle = `rgba(28, 16, 10, ${0.08 + Math.random() * 0.16})`;
        ctx.lineWidth = 1 + Math.random() * 2;
        ctx.beginPath();
        ctx.moveTo(x, -10);
        ctx.bezierCurveTo(
          x + Math.random() * 20,
          height * 0.35,
          x - Math.random() * 20,
          height * 0.7,
          x + Math.random() * 8,
          height + 10
        );
        ctx.stroke();
      }

      for (let i = 0; i < 24; i += 1) {
        const knotX = Math.random() * width;
        const knotY = Math.random() * height;
        ctx.strokeStyle = "rgba(20, 12, 8, 0.18)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(knotX, knotY, 12 + Math.random() * 16, 4 + Math.random() * 8, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }),
    3,
    1
  );

  const floorTexture = setRepeat(
    textureFromCanvas(768, 768, (ctx, width, height) => {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#bca895");
      gradient.addColorStop(1, "#a08c79");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      randomNoise(ctx, width, height, 0.18, 9000);

      ctx.strokeStyle = "rgba(87, 67, 51, 0.12)";
      ctx.lineWidth = 3;
      for (let x = 0; x < width; x += width / 6) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += height / 5) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }),
    6,
    5
  );

  const plasterBumpTexture = grayscaleTextureFromCanvas(
    768,
    768,
    (ctx, width, height) => {
      ctx.fillStyle = "#8f8f8f";
      ctx.fillRect(0, 0, width, height);
      randomMonochromeNoise(ctx, width, height, 0.14, 10500, 106, 54);

      for (let i = 0; i < 260; i += 1) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = 10 + Math.random() * 28;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(214, 214, 214, ${0.05 + Math.random() * 0.04})`);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      }

      for (let i = 0; i < 280; i += 1) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        ctx.strokeStyle = `rgba(228, 228, 228, ${0.014 + Math.random() * 0.015})`;
        ctx.lineWidth = 1 + Math.random() * 1.8;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (Math.random() - 0.5) * 18, y + (Math.random() - 0.5) * 18);
        ctx.stroke();
      }
    },
    {
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
    }
  );

  const plasterRoughnessTexture = grayscaleTextureFromCanvas(
    768,
    768,
    (ctx, width, height) => {
      ctx.fillStyle = "#e8e8e8";
      ctx.fillRect(0, 0, width, height);
      randomMonochromeNoise(ctx, width, height, 0.12, 9000, 162, 46);

      for (let i = 0; i < 36; i += 1) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = 45 + Math.random() * 95;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        const shade = 176 + Math.floor(Math.random() * 36);
        gradient.addColorStop(0, `rgba(${shade}, ${shade}, ${shade}, 0.14)`);
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      }
    },
    {
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
    }
  );

  const woodBumpTexture = setRepeat(
    grayscaleTextureFromCanvas(1024, 256, (ctx, width, height) => {
      ctx.fillStyle = "#7f7f7f";
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 220; i += 1) {
        const x = Math.random() * width;
        const alpha = 0.1 + Math.random() * 0.12;
        ctx.strokeStyle = `rgba(215, 215, 215, ${alpha})`;
        ctx.lineWidth = 1 + Math.random() * 1.5;
        ctx.beginPath();
        ctx.moveTo(x, -8);
        ctx.bezierCurveTo(
          x + Math.random() * 14,
          height * 0.28,
          x - Math.random() * 18,
          height * 0.72,
          x + Math.random() * 10,
          height + 8
        );
        ctx.stroke();
      }

      for (let i = 0; i < 18; i += 1) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radiusX = 10 + Math.random() * 12;
        const radiusY = 3 + Math.random() * 5;
        ctx.strokeStyle = "rgba(52, 52, 52, 0.28)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }),
    3,
    1
  );

  const woodRoughnessTexture = setRepeat(
    grayscaleTextureFromCanvas(1024, 256, (ctx, width, height) => {
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, "#cdcdcd");
      gradient.addColorStop(0.5, "#9a9a9a");
      gradient.addColorStop(1, "#d5d5d5");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      randomMonochromeNoise(ctx, width, height, 0.12, 7000, 120, 90);
    }),
    3,
    1
  );

  const floorBumpTexture = setRepeat(
    grayscaleTextureFromCanvas(768, 768, (ctx, width, height) => {
      ctx.fillStyle = "#8b8b8b";
      ctx.fillRect(0, 0, width, height);
      randomMonochromeNoise(ctx, width, height, 0.18, 10000, 110, 80);

      ctx.strokeStyle = "rgba(40, 40, 40, 0.48)";
      ctx.lineWidth = 4;
      for (let x = 0; x < width; x += width / 6) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += height / 5) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }),
    6,
    5
  );

  const floorRoughnessTexture = setRepeat(
    grayscaleTextureFromCanvas(768, 768, (ctx, width, height) => {
      ctx.fillStyle = "#dfdfdf";
      ctx.fillRect(0, 0, width, height);
      randomMonochromeNoise(ctx, width, height, 0.12, 10000, 125, 85);

      const tileWidth = width / 6;
      const tileHeight = height / 5;
      for (let row = 0; row < 5; row += 1) {
        for (let column = 0; column < 6; column += 1) {
          const shade = 165 + Math.floor(Math.random() * 40);
          ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.14)`;
          ctx.fillRect(column * tileWidth, row * tileHeight, tileWidth, tileHeight);
        }
      }
    }),
    6,
    5
  );

  const paperTexture = setRepeat(
    textureFromCanvas(512, 1024, (ctx, width, height) => {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#d8b98d");
      gradient.addColorStop(0.6, "#c29b6e");
      gradient.addColorStop(1, "#a97d54");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      randomNoise(ctx, width, height, 0.16, 7000);
      for (let i = 0; i < 10; i += 1) {
        const creaseY = Math.random() * height;
        ctx.strokeStyle = "rgba(117, 83, 49, 0.16)";
        ctx.lineWidth = 1 + Math.random() * 2;
        ctx.beginPath();
        ctx.moveTo(0, creaseY);
        ctx.bezierCurveTo(width * 0.25, creaseY + 12, width * 0.75, creaseY - 8, width, creaseY + 8);
        ctx.stroke();
      }
    }),
    1,
    1
  );

  const fabricTexture = setRepeat(
    textureFromCanvas(512, 512, (ctx, width, height) => {
      ctx.fillStyle = "#8e735b";
      ctx.fillRect(0, 0, width, height);
      for (let x = 0; x < width; x += 6) {
        ctx.fillStyle = x % 12 === 0 ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(x, 0, 2, height);
      }
      for (let y = 0; y < height; y += 6) {
        ctx.fillStyle = y % 12 === 0 ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)";
        ctx.fillRect(0, y, width, 2);
      }
    }),
    2,
    1
  );

  const fabricBumpTexture = setRepeat(
    grayscaleTextureFromCanvas(512, 512, (ctx, width, height) => {
      ctx.fillStyle = "#8e8e8e";
      ctx.fillRect(0, 0, width, height);
      for (let x = 0; x < width; x += 6) {
        ctx.fillStyle = x % 12 === 0 ? "rgba(220, 220, 220, 0.18)" : "rgba(60, 60, 60, 0.14)";
        ctx.fillRect(x, 0, 2, height);
      }
      for (let y = 0; y < height; y += 6) {
        ctx.fillStyle = y % 12 === 0 ? "rgba(220, 220, 220, 0.14)" : "rgba(70, 70, 70, 0.12)";
        ctx.fillRect(0, y, width, 2);
      }
    }),
    2,
    1
  );

  const mirrorTexture = textureFromCanvas(512, 1024, (ctx, width, height) => {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#f9f3ea");
    gradient.addColorStop(0.25, "#ced6db");
    gradient.addColorStop(0.6, "#f4dfbf");
    gradient.addColorStop(1, "#b8c4cc");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.fillRect(width * 0.12, 0, width * 0.14, height);
    ctx.fillStyle = "rgba(255, 255, 255, 0.09)";
    ctx.fillRect(width * 0.7, 0, width * 0.07, height);
  });

  const glowTexture = textureFromCanvas(768, 256, (ctx, width, height) => {
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width / 2);
    gradient.addColorStop(0, "rgba(255, 234, 188, 1)");
    gradient.addColorStop(0.45, "rgba(255, 219, 156, 0.55)");
    gradient.addColorStop(1, "rgba(255, 219, 156, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  });

  const steelRoughnessTexture = setRepeat(
    grayscaleTextureFromCanvas(512, 512, (ctx, width, height) => {
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, "#4c4c4c");
      gradient.addColorStop(0.5, "#d4d4d4");
      gradient.addColorStop(1, "#5e5e5e");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      for (let x = 0; x < width; x += 3) {
        const shade = 90 + Math.floor(Math.random() * 100);
        ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.16)`;
        ctx.fillRect(x, 0, 1, height);
      }
    }),
    2,
    2
  );

  const glassRoughnessTexture = grayscaleTextureFromCanvas(512, 512, (ctx, width, height) => {
    ctx.fillStyle = "#181818";
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < 18; i += 1) {
      const x = Math.random() * width;
      const lineWidth = 8 + Math.random() * 16;
      const gradient = ctx.createLinearGradient(x, 0, x + lineWidth, 0);
      gradient.addColorStop(0, "rgba(42, 42, 42, 0)");
      gradient.addColorStop(0.5, "rgba(145, 145, 145, 0.24)");
      gradient.addColorStop(1, "rgba(42, 42, 42, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(x, 0, lineWidth, height);
    }
  });

  const exteriorGroundTexture = setRepeat(
    textureFromCanvas(1024, 1024, (ctx, width, height) => {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#cbbfb2");
      gradient.addColorStop(1, "#b9ab9d");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      randomNoise(ctx, width, height, 0.08, 12000);
      for (let i = 0; i < 90; i += 1) {
        ctx.strokeStyle = `rgba(104, 92, 82, ${0.04 + Math.random() * 0.05})`;
        ctx.lineWidth = 1 + Math.random() * 2;
        const startX = Math.random() * width;
        const startY = Math.random() * height;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + 40 + Math.random() * 80, startY + (Math.random() - 0.5) * 24);
        ctx.stroke();
      }
    }),
    10,
    10
  );

  const exteriorGroundBumpTexture = setRepeat(
    grayscaleTextureFromCanvas(1024, 1024, (ctx, width, height) => {
      ctx.fillStyle = "#8a8a8a";
      ctx.fillRect(0, 0, width, height);
      randomMonochromeNoise(ctx, width, height, 0.18, 18000, 110, 80);
    }),
    10,
    10
  );

  const exteriorGroundRoughnessTexture = setRepeat(
    grayscaleTextureFromCanvas(1024, 1024, (ctx, width, height) => {
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(0, 0, width, height);
      randomMonochromeNoise(ctx, width, height, 0.12, 16000, 130, 80);
    }),
    10,
    10
  );

  const exteriorShadowTexture = textureFromCanvas(
    1024,
    1024,
    (ctx, width, height) => {
      const gradient = ctx.createRadialGradient(
        width / 2,
        height * 0.54,
        width * 0.12,
        width / 2,
        height * 0.54,
        width * 0.48
      );
      gradient.addColorStop(0, "rgba(60, 42, 28, 0.42)");
      gradient.addColorStop(0.45, "rgba(76, 56, 39, 0.16)");
      gradient.addColorStop(1, "rgba(76, 56, 39, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    },
    {
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
    }
  );

  const skyTexture = textureFromCanvas(
    2048,
    1024,
    (ctx, width, height) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#d6e2ec");
      gradient.addColorStop(0.38, "#ece2d4");
      gradient.addColorStop(0.78, "#efe0cf");
      gradient.addColorStop(1, "#d3c0ae");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const haze = ctx.createRadialGradient(width * 0.5, height * 0.7, 40, width * 0.5, height * 0.7, width * 0.48);
      haze.addColorStop(0, "rgba(255, 244, 220, 0.12)");
      haze.addColorStop(1, "rgba(255, 244, 220, 0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, width, height);
    },
    {
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
    }
  );

  function createPlantTexture(draw) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw(ctx, canvas.width, canvas.height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = maxAnisotropy;
    return texture;
  }

  const pampasLightTexture = createPlantTexture((ctx, width, height) => {
    const stemX = width * 0.5;
    const stemTop = height * 0.24;
    ctx.strokeStyle = "rgba(183, 150, 101, 0.95)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(stemX, height);
    ctx.quadraticCurveTo(stemX - 10, height * 0.55, stemX + 6, stemTop + 80);
    ctx.stroke();

    for (let i = 0; i < 140; i += 1) {
      const t = i / 139;
      const y = stemTop + t * (height * 0.5);
      const spread = 18 + (1 - Math.abs(t - 0.42) / 0.42) * 120;
      const alpha = 0.1 + (1 - t) * 0.14;
      const left = spread * (0.55 + Math.random() * 0.6);
      const right = spread * (0.55 + Math.random() * 0.6);
      ctx.strokeStyle = `rgba(242, 235, 214, ${alpha})`;
      ctx.lineWidth = 1 + Math.random() * 1.1;
      ctx.beginPath();
      ctx.moveTo(stemX, y);
      ctx.lineTo(stemX - left, y - 4 - Math.random() * 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(stemX, y);
      ctx.lineTo(stemX + right, y - 4 - Math.random() * 8);
      ctx.stroke();
    }
  });

  const pampasWarmTexture = createPlantTexture((ctx, width, height) => {
    const stemX = width * 0.5;
    const stemTop = height * 0.2;
    ctx.strokeStyle = "rgba(168, 133, 86, 0.95)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(stemX, height);
    ctx.quadraticCurveTo(stemX + 12, height * 0.55, stemX - 4, stemTop + 90);
    ctx.stroke();

    for (let i = 0; i < 145; i += 1) {
      const t = i / 144;
      const y = stemTop + t * (height * 0.52);
      const spread = 14 + (1 - Math.abs(t - 0.38) / 0.38) * 110;
      const alpha = 0.1 + (1 - t) * 0.16;
      const left = spread * (0.55 + Math.random() * 0.55);
      const right = spread * (0.55 + Math.random() * 0.55);
      ctx.strokeStyle = `rgba(222, 203, 172, ${alpha})`;
      ctx.lineWidth = 1 + Math.random() * 1.1;
      ctx.beginPath();
      ctx.moveTo(stemX, y);
      ctx.lineTo(stemX - left, y - 5 - Math.random() * 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(stemX, y);
      ctx.lineTo(stemX + right, y - 5 - Math.random() * 8);
      ctx.stroke();
    }
  });

  const wickerAlphaTexture = setRepeat(
    textureFromCanvas(512, 512, (ctx, width, height) => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "white";
      for (let y = 10; y < height; y += 24) {
        ctx.fillRect(0, y, width, 5);
      }
      for (let x = 12; x < width; x += 22) {
        ctx.fillRect(x, 0, 4, height);
      }
      ctx.clearRect(0, 0, width, 18);
    }),
    1,
    1
  );

  function createTextTexture(width, height, draw) {
    return textureFromCanvas(width, height, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      draw(ctx, w, h);
    });
  }

  const brandTextTexture = createTextTexture(1536, 512, (ctx, width, height) => {
    ctx.fillStyle = "#f8ecd5";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = 'bold 180px "Segoe UI", Arial, sans-serif';
    ctx.fillText("РџРёСЂС–Р¶РєРё.ua", width / 2, height / 2 - 6);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(255, 231, 188, 0.45)";
    ctx.strokeText("РџРёСЂС–Р¶РєРё.ua", width / 2, height / 2 - 6);
  });

  const taglineTexture = createTextTexture(1024, 320, (ctx, width, height) => {
    ctx.fillStyle = "#2a221b";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = '700 88px "Segoe UI", Arial, sans-serif';
    ctx.fillText("РЎРњРђР§РќРћ.", 40, height * 0.32);
    ctx.fillText("РЎРРўРќРћ.", 40, height * 0.54);
    ctx.fillText("РЎР’РћР„.", 40, height * 0.76);
  });

  function makeMenuTexture(title, items) {
    return createTextTexture(700, 1400, (ctx, width, height) => {
      ctx.drawImage(paperTexture.image, 0, 0, width, height);

      ctx.fillStyle = "#3a2719";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = '700 92px "Segoe UI", Arial, sans-serif';
      ctx.fillText(title, width / 2, 132);

      ctx.strokeStyle = "rgba(61, 40, 27, 0.45)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(90, 200);
      ctx.lineTo(width - 90, 200);
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.font = '600 54px "Segoe UI", Arial, sans-serif';
      items.forEach((item, index) => {
        const y = 300 + index * 140;
        ctx.fillText(item.label, 90, y);
        ctx.textAlign = "right";
        ctx.fillText(item.price, width - 90, y);
        ctx.textAlign = "left";
        ctx.strokeStyle = "rgba(61, 40, 27, 0.16)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(90, y + 48);
        ctx.lineTo(width - 90, y + 48);
        ctx.stroke();
      });

      ctx.font = '500 36px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = "rgba(58, 39, 25, 0.78)";
      ctx.fillText("Р”РѕРјР°С€РЅСЏ РІРёРїС–С‡РєР°", 90, height - 170);
      ctx.fillText("С‰РѕРґРЅСЏ", 90, height - 118);
    });
  }

  const materials = {
    plaster: new THREE.MeshStandardMaterial({
      color: palette.plaster,
      map: plasterTexture,
      bumpMap: plasterBumpTexture,
      bumpScale: 0.028,
      roughnessMap: plasterRoughnessTexture,
      roughness: 0.98,
      metalness: 0,
      envMapIntensity: 0.22,
    }),
    wood: new THREE.MeshStandardMaterial({
      color: palette.wood,
      map: woodTexture,
      bumpMap: woodBumpTexture,
      bumpScale: 0.014,
      roughnessMap: woodRoughnessTexture,
      roughness: 0.68,
      metalness: 0.06,
      envMapIntensity: 0.42,
    }),
    darkWood: new THREE.MeshStandardMaterial({
      color: palette.woodDark,
      map: woodTexture,
      bumpMap: woodBumpTexture,
      bumpScale: 0.012,
      roughnessMap: woodRoughnessTexture,
      roughness: 0.72,
      metalness: 0.05,
      envMapIntensity: 0.38,
    }),
    lightWood: new THREE.MeshStandardMaterial({
      color: 0xb88a5f,
      map: woodTexture,
      bumpMap: woodBumpTexture,
      bumpScale: 0.015,
      roughnessMap: woodRoughnessTexture,
      roughness: 0.7,
      metalness: 0.04,
      envMapIntensity: 0.45,
    }),
    floor: new THREE.MeshStandardMaterial({
      color: palette.floor,
      map: floorTexture,
      bumpMap: floorBumpTexture,
      bumpScale: 0.022,
      roughnessMap: floorRoughnessTexture,
      roughness: 0.88,
      metalness: 0,
      envMapIntensity: 0.18,
    }),
    steel: new THREE.MeshStandardMaterial({
      color: palette.steel,
      roughnessMap: steelRoughnessTexture,
      roughness: 0.18,
      metalness: 0.94,
      envMapIntensity: 1.4,
    }),
    blackMetal: new THREE.MeshStandardMaterial({
      color: palette.black,
      roughnessMap: steelRoughnessTexture,
      roughness: 0.34,
      metalness: 0.72,
      envMapIntensity: 1.1,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xf6f1e9,
      transparent: true,
      opacity: 0.16,
      roughnessMap: glassRoughnessTexture,
      roughness: 0.03,
      metalness: 0.02,
      transmission: 0.92,
      thickness: 0.12,
      ior: 1.48,
      reflectivity: 0.92,
      attenuationDistance: 1.4,
      attenuationColor: new THREE.Color(0xf3eadb),
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      envMapIntensity: 1.35,
    }),
    paper: new THREE.MeshStandardMaterial({
      color: palette.paper,
      map: paperTexture,
      roughness: 0.96,
      metalness: 0,
    }),
    fabric: new THREE.MeshStandardMaterial({
      color: palette.upholstery,
      map: fabricTexture,
      bumpMap: fabricBumpTexture,
      bumpScale: 0.01,
      roughness: 0.98,
      metalness: 0,
      envMapIntensity: 0.12,
    }),
    wicker: new THREE.MeshStandardMaterial({
      color: palette.wicker,
      roughness: 0.92,
      metalness: 0,
      alphaMap: wickerAlphaTexture,
      transparent: true,
      side: THREE.DoubleSide,
      alphaTest: 0.38,
    }),
    warmBulb: new THREE.MeshStandardMaterial({
      color: palette.softGlow,
      emissive: palette.warmLight,
      emissiveIntensity: 1.85,
      roughness: 0.16,
      metalness: 0,
    }),
    mirror: new THREE.MeshStandardMaterial({
      color: 0xd7dfe3,
      map: mirrorTexture,
      roughnessMap: glassRoughnessTexture,
      roughness: 0.025,
      metalness: 0.98,
      envMapIntensity: 1.85,
    }),
    soil: new THREE.MeshStandardMaterial({
      color: 0x6c5641,
      roughness: 0.96,
      metalness: 0,
    }),
    dryGrassStem: new THREE.MeshStandardMaterial({
      color: 0xb99668,
      roughness: 0.96,
      metalness: 0,
    }),
    dryGrassLight: new THREE.MeshStandardMaterial({
      color: 0xe8dcc1,
      roughness: 0.98,
      metalness: 0,
    }),
    dryGrassDark: new THREE.MeshStandardMaterial({
      color: 0xd2c09d,
      roughness: 0.98,
      metalness: 0,
    }),
    pampasLight: new THREE.MeshBasicMaterial({
      map: pampasLightTexture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    pampasWarm: new THREE.MeshBasicMaterial({
      map: pampasWarmTexture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    text: new THREE.MeshBasicMaterial({
      map: brandTextTexture,
      transparent: true,
    }),
  };

  const exteriorGroundMaterial = new THREE.MeshStandardMaterial({
    color: 0xc4b7aa,
    map: exteriorGroundTexture,
    bumpMap: exteriorGroundBumpTexture,
    bumpScale: 0.018,
    roughnessMap: exteriorGroundRoughnessTexture,
    roughness: 0.96,
    metalness: 0,
    envMapIntensity: 0.1,
  });

  function createBox(width, height, depth, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function createCylinder(radiusTop, radiusBottom, height, radialSegments, material) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments),
      material
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  const plan = {
    leftX: -4.45,
    hallRightX: 4.55,
    serviceLeftX: 1.45,
    serviceRightX: 3.45,
    serviceAnnexRightX: 2.35,
    rightX: 4.55,
    notchX: 4.55,
    hallFrontZ: 7.15,
    hallSplitZ: -0.55,
    serviceFrontZ: 2.55,
    serviceAnnexBackZ: -1.72,
    serviceDoorLeftX: 2.18,
    serviceDoorRightX: 2.98,
    backZ: -4.25,
    wallHeight: 4.8,
    wallThickness: 0.18,
    ceilingY: 4.8,
    openingLeftX: -0.15,
    openingRightX: 1.0,
    entryLeftX: -0.88,
    entryRightX: 0.88,
    leftDividerX: -3.18,
    leftDividerBackZ: -0.02,
    leftDividerFrontZ: 2.52,
  };

  function createPlanShape() {
    const shape = new THREE.Shape();
    shape.moveTo(plan.leftX, plan.backZ);
    shape.lineTo(plan.rightX, plan.backZ);
    shape.lineTo(plan.rightX, plan.hallFrontZ);
    shape.lineTo(plan.leftX, plan.hallFrontZ);
    shape.closePath();
    return shape;
  }

  function createShapeSurface(shape, material, y, upsideDown = false) {
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), material);
    mesh.rotation.x = upsideDown ? Math.PI / 2 : -Math.PI / 2;
    mesh.position.y = y;
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    return mesh;
  }

  function addWallSegment(x1, z1, x2, z2, height = plan.wallHeight, thickness = plan.wallThickness, material = materials.plaster) {
    const length = Math.hypot(x2 - x1, z2 - z1);
    const mesh = createBox(length, height, thickness, material);
    mesh.position.set((x1 + x2) / 2, height / 2, (z1 + z2) / 2);
    mesh.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
    scene.add(mesh);
    return mesh;
  }

  function addBaseboardSegment(x1, z1, x2, z2) {
    const length = Math.hypot(x2 - x1, z2 - z1);
    const mesh = createBox(length, 0.16, 0.08, materials.darkWood);
    mesh.position.set((x1 + x2) / 2, 0.08, (z1 + z2) / 2);
    mesh.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
    scene.add(mesh);
    return mesh;
  }

  function addCurveWall(start, control1, control2, end, height = plan.wallHeight, thickness = plan.wallThickness, material = materials.plaster) {
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(start.x, 0, start.z),
      new THREE.Vector3(control1.x, 0, control1.z),
      new THREE.Vector3(control2.x, 0, control2.z),
      new THREE.Vector3(end.x, 0, end.z)
    );
    const points = curve.getPoints(18);
    points.forEach((point, index) => {
      if (index === points.length - 1) {
        return;
      }
      const next = points[index + 1];
      addWallSegment(point.x, point.z, next.x, next.z, height, thickness, material);
      addBaseboardSegment(point.x, point.z, next.x, next.z);
    });
  }

  function addRoom() {
    const roomShape = createPlanShape();
    scene.add(createShapeSurface(roomShape, materials.plaster, plan.ceilingY, true));
  }

  function createPastry(color) {
    const group = new THREE.Group();
    const crust = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 18, 16),
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.82,
        metalness: 0,
      })
    );
    crust.scale.set(1.25, 0.55, 0.9);
    crust.castShadow = true;
    crust.receiveShadow = true;
    group.add(crust);

    const glaze = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 18, 16),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(color).offsetHSL(0, 0, 0.08),
        roughness: 0.48,
        metalness: 0,
      })
    );
    glaze.scale.set(1.1, 0.38, 0.82);
    glaze.position.y = 0.04;
    glaze.castShadow = true;
    group.add(glaze);

    return group;
  }

  function createPastryTray() {
    const group = new THREE.Group();
    const tray = createBox(1.2, 0.04, 0.54, materials.steel);
    tray.position.y = -0.02;
    group.add(tray);

    const pastryColors = [0xc89047, 0xb8783a, 0xd4a162, 0xc48252];
    let counter = 0;
    for (let z = -0.18; z <= 0.18; z += 0.18) {
      for (let x = -0.42; x <= 0.42; x += 0.21) {
        const pastry = createPastry(pastryColors[counter % pastryColors.length]);
        pastry.position.set(x + (Math.random() - 0.5) * 0.03, 0.05, z + (Math.random() - 0.5) * 0.03);
        pastry.rotation.y = Math.random() * Math.PI;
        group.add(pastry);
        counter += 1;
      }
    }

    return group;
  }

  function createDisplayWarmer() {
    const group = new THREE.Group();

    const base = createBox(3.35, 0.22, 1.45, materials.steel);
    base.position.y = 0.14;
    group.add(base);

    const lowerPanel = createBox(3.2, 0.38, 1.28, materials.darkWood);
    lowerPanel.position.y = 0.42;
    group.add(lowerPanel);

    const counterTop = createBox(3.45, 0.08, 1.52, materials.steel);
    counterTop.position.y = 0.72;
    group.add(counterTop);

    const glassFront = new THREE.Mesh(new THREE.BoxGeometry(3.18, 0.98, 0.05), materials.glass);
    glassFront.position.set(0, 1.18, 0.68);
    group.add(glassFront);

    const glassBack = new THREE.Mesh(new THREE.BoxGeometry(3.18, 0.98, 0.05), materials.glass);
    glassBack.position.set(0, 1.18, -0.68);
    group.add(glassBack);

    const glassLeft = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.98, 1.36), materials.glass);
    glassLeft.position.set(-1.58, 1.18, 0);
    group.add(glassLeft);

    const glassRight = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.98, 1.36), materials.glass);
    glassRight.position.set(1.58, 1.18, 0);
    group.add(glassRight);

    const topFrame = createBox(3.26, 0.1, 1.44, materials.steel);
    topFrame.position.y = 1.7;
    group.add(topFrame);

    const verticalFramePositions = [
      [-1.58, 1.2, 0.68],
      [1.58, 1.2, 0.68],
      [-1.58, 1.2, -0.68],
      [1.58, 1.2, -0.68],
    ];
    verticalFramePositions.forEach(([x, y, z]) => {
      const pole = createBox(0.06, 1.0, 0.06, materials.steel);
      pole.position.set(x, y, z);
      group.add(pole);
    });

    const shelfLevels = [0.98, 1.38];
    shelfLevels.forEach((y) => {
      const shelf = createBox(3.04, 0.04, 1.1, materials.steel);
      shelf.position.y = y;
      group.add(shelf);

      const warmStrip = createBox(
        3.02,
        0.02,
        0.04,
        new THREE.MeshStandardMaterial({
          color: 0xffe5b6,
          emissive: 0xffcd80,
          emissiveIntensity: 1.35,
          roughness: 0.25,
        })
      );
      warmStrip.position.set(0, y + 0.03, -0.5);
      group.add(warmStrip);
    });

    shelfLevels.forEach((y) => {
      const tray = createPastryTray();
      tray.position.set(0, y + 0.02, 0.04);
      group.add(tray);
    });

    const lowerTray = createPastryTray();
    lowerTray.scale.set(1.02, 1, 1.02);
    lowerTray.position.set(0, 0.58, 0.04);
    group.add(lowerTray);

    [-1.35, -0.45, 0.45, 1.35].forEach((x) => {
      const wheelArm = createBox(0.08, 0.18, 0.08, materials.blackMetal);
      wheelArm.position.set(x, -0.02, 0.62);
      group.add(wheelArm);

      const wheel = createCylinder(0.09, 0.09, 0.05, 20, materials.blackMetal);
      wheel.position.set(x, -0.12, 0.62);
      wheel.rotation.z = Math.PI / 2;
      group.add(wheel);

      const backArm = wheelArm.clone();
      backArm.position.z = -0.62;
      group.add(backArm);

      const backWheel = wheel.clone();
      backWheel.position.z = -0.62;
      group.add(backWheel);
    });

    return group;
  }

  function createPrepCounter(width, depth, withUpperShelf = false) {
    const group = new THREE.Group();

    const body = createBox(
      width,
      0.76,
      depth - 0.04,
      new THREE.MeshStandardMaterial({
        color: 0x6f5a48,
        roughness: 0.78,
        metalness: 0.04,
      })
    );
    body.position.y = 0.38;
    group.add(body);

    const plinth = createBox(width - 0.1, 0.08, depth - 0.08, materials.blackMetal);
    plinth.position.y = 0.04;
    group.add(plinth);

    const top = createBox(width + 0.08, 0.06, depth + 0.06, materials.steel);
    top.position.y = 0.81;
    group.add(top);

    const lowerShelf = createBox(width - 0.18, 0.04, depth - 0.16, materials.steel);
    lowerShelf.position.y = 0.22;
    group.add(lowerShelf);

    if (withUpperShelf) {
      [-width / 2 + 0.12, width / 2 - 0.12].forEach((x) => {
        [-depth / 2 + 0.12, depth / 2 - 0.12].forEach((z) => {
          const post = createBox(0.04, 0.86, 0.04, materials.blackMetal);
          post.position.set(x, 1.24, z);
          group.add(post);
        });
      });

      const upperShelf = createBox(width - 0.08, 0.05, depth - 0.12, materials.steel);
      upperShelf.position.y = 1.67;
      group.add(upperShelf);
    }

    return group;
  }

  function createKitchenSinkUnit(options = {}) {
    const width = options.width ?? 1.45;
    const depth = options.depth ?? 0.72;
    const group = new THREE.Group();

    const body = createBox(
      width,
      0.78,
      depth - 0.02,
      new THREE.MeshStandardMaterial({
        color: 0x7f878d,
        roughness: 0.32,
        metalness: 0.82,
      })
    );
    body.position.y = 0.39;
    group.add(body);

    const top = createBox(width + 0.05, 0.06, depth + 0.04, materials.steel);
    top.position.y = 0.81;
    group.add(top);

    const backsplash = createBox(width + 0.03, 0.22, 0.04, materials.steel);
    backsplash.position.set(0, 0.94, -depth / 2 + 0.02);
    group.add(backsplash);

    const shelf = createBox(width - 0.18, 0.04, depth - 0.12, materials.steel);
    shelf.position.y = 0.2;
    group.add(shelf);

    const bowl = createBox(0.46, 0.18, 0.34, new THREE.MeshStandardMaterial({
      color: 0x596167,
      roughness: 0.26,
      metalness: 0.88,
    }));
    bowl.position.set(-width * 0.14, 0.71, 0);
    group.add(bowl);

    const drainer = createBox(0.48, 0.02, 0.36, materials.steel);
    drainer.position.set(width * 0.19, 0.73, 0);
    group.add(drainer);

    [-0.16, -0.06, 0.04, 0.14].forEach((x) => {
      const groove = createBox(0.008, 0.012, 0.32, materials.blackMetal);
      groove.position.set(width * 0.19 + x, 0.735, 0);
      group.add(groove);
    });

    const faucetStem = createCylinder(0.018, 0.018, 0.42, 10, materials.steel);
    faucetStem.position.set(-width * 0.02, 1.01, -depth * 0.14);
    group.add(faucetStem);

    const faucetArm = createCylinder(0.014, 0.014, 0.36, 10, materials.steel);
    faucetArm.rotation.z = Math.PI / 2;
    faucetArm.position.set(0.11, 1.16, -depth * 0.14);
    group.add(faucetArm);

    const faucetDrop = createCylinder(0.012, 0.012, 0.16, 10, materials.steel);
    faucetDrop.position.set(0.27, 1.08, -depth * 0.14);
    group.add(faucetDrop);

    [-width / 2 + 0.12, width / 2 - 0.12].forEach((x) => {
      [-depth / 2 + 0.12, depth / 2 - 0.12].forEach((z) => {
        const leg = createBox(0.04, 0.78, 0.04, materials.steel);
        leg.position.set(x, 0.39, z);
        group.add(leg);
      });
    });

    return group;
  }

  function createPastryEquipmentLine(options = {}) {
    const width = options.width ?? 2.95;
    const depth = options.depth ?? 0.84;
    const group = new THREE.Group();

    const body = createBox(
      width,
      0.84,
      depth - 0.02,
      new THREE.MeshStandardMaterial({
        color: 0x868d92,
        roughness: 0.34,
        metalness: 0.8,
      })
    );
    body.position.y = 0.42;
    group.add(body);

    const top = createBox(width + 0.05, 0.06, depth + 0.04, materials.steel);
    top.position.y = 0.87;
    group.add(top);

    const kick = createBox(width - 0.08, 0.08, depth - 0.08, materials.blackMetal);
    kick.position.y = 0.04;
    group.add(kick);

    const separatorXs = [-0.48, 0.46];
    separatorXs.forEach((x) => {
      const separator = createBox(0.03, 0.72, depth - 0.12, materials.steel);
      separator.position.set(x, 0.4, 0);
      group.add(separator);
    });

    const darkDoorMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x26292c,
      roughness: 0.16,
      metalness: 0.22,
      transmission: 0.12,
      thickness: 0.02,
    });

    [-0.96, -0.69, -0.2, 0.16, 0.82].forEach((x, index) => {
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(index < 2 ? 0.22 : index === 2 ? 0.48 : 0.3, 0.54, 0.03),
        index === 2 ? darkDoorMaterial : materials.steel
      );
      door.position.set(x, 0.42, depth / 2 - 0.03);
      door.castShadow = true;
      door.receiveShadow = true;
      group.add(door);

      const handle = createBox(0.02, 0.22, 0.02, materials.blackMetal);
      handle.position.set(x + ((index < 2 || index === 2) ? 0.07 : 0.1), 0.42, depth / 2 - 0.005);
      group.add(handle);
    });

    const lowerShelf = createBox(width - 0.22, 0.04, depth - 0.18, materials.steel);
    lowerShelf.position.y = 0.23;
    group.add(lowerShelf);

    const machineBody = createBox(0.76, 0.18, 0.42, materials.steel);
    machineBody.position.set(-0.78, 0.99, 0.02);
    group.add(machineBody);

    [-0.22, 0.22].forEach((z) => {
      const roller = createCylinder(0.04, 0.04, 0.56, 12, materials.blackMetal);
      roller.rotation.z = Math.PI / 2;
      roller.position.set(-0.78, 1.02, z * 0.7);
      group.add(roller);
    });

    const doughSheet = createBox(0.46, 0.012, 0.22, new THREE.MeshStandardMaterial({
      color: 0xe7d6bb,
      roughness: 0.98,
      metalness: 0,
    }));
    doughSheet.position.set(-0.78, 1.03, 0);
    group.add(doughSheet);

    const proofCabinet = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.58, 0.04), darkDoorMaterial);
    proofCabinet.position.set(0.03, 0.46, depth / 2 - 0.02);
    proofCabinet.castShadow = true;
    group.add(proofCabinet);

    const trayGlow = createBox(
      0.52,
      0.02,
      0.28,
      new THREE.MeshStandardMaterial({
        color: 0xffe2b6,
        emissive: 0xffc878,
        emissiveIntensity: 1.0,
        roughness: 0.28,
      })
    );
    trayGlow.position.set(0.03, 0.58, 0);
    group.add(trayGlow);

    const mixerBase = createBox(0.36, 0.3, 0.32, materials.steel);
    mixerBase.position.set(0.96, 0.98, 0.02);
    group.add(mixerBase);

    const mixerNeck = createBox(0.12, 0.34, 0.12, materials.steel);
    mixerNeck.position.set(1.02, 1.26, 0);
    group.add(mixerNeck);

    const mixerHead = createBox(0.28, 0.14, 0.22, materials.steel);
    mixerHead.position.set(0.97, 1.4, 0.02);
    group.add(mixerHead);

    const bowl = createCylinder(0.16, 0.11, 0.22, 18, materials.steel);
    bowl.position.set(0.92, 1.03, 0.02);
    group.add(bowl);

    const rackSide = createBox(0.04, 0.78, 0.04, materials.blackMetal);
    rackSide.position.set(width / 2 + 0.1, 0.78, -0.14);
    group.add(rackSide);

    const rackSideRear = rackSide.clone();
    rackSideRear.position.z = 0.14;
    group.add(rackSideRear);

    [0.34, 0.52, 0.7, 0.88].forEach((y) => {
      const tray = createBox(0.42, 0.02, 0.34, materials.steel);
      tray.position.set(width / 2 + 0.1, y, 0);
      group.add(tray);
    });

    return group;
  }

  function createBrandSign() {
    const group = new THREE.Group();

    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(5.4, 1.8),
      new THREE.MeshBasicMaterial({
        map: glowTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.72,
      })
    );
    glow.position.z = -0.04;
    group.add(glow);

    const panel = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.18), materials.darkWood);
    group.add(panel);

    const textPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(4.28, 1.32),
      new THREE.MeshBasicMaterial({
        map: brandTextTexture,
        transparent: true,
      })
    );
    textPlane.position.z = 0.02;
    group.add(textPlane);

    const frameTop = createBox(4.72, 0.08, 0.08, materials.wood);
    frameTop.position.set(0, 0.62, 0.06);
    group.add(frameTop);

    const frameBottom = createBox(4.72, 0.08, 0.08, materials.wood);
    frameBottom.position.set(0, -0.62, 0.06);
    group.add(frameBottom);

    const frameLeft = createBox(0.08, 1.24, 0.08, materials.wood);
    frameLeft.position.set(-2.32, 0, 0.06);
    group.add(frameLeft);

    const frameRight = createBox(0.08, 1.24, 0.08, materials.wood);
    frameRight.position.set(2.32, 0, 0.06);
    group.add(frameRight);

    return group;
  }

  function createMenuScroll(title, items) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.2), materials.paper);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const textTexture = makeMenuTexture(title, items);
    const textPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.02, 2.04),
      new THREE.MeshBasicMaterial({
        map: textTexture,
      })
    );
    textPlane.position.z = 0.01;
    group.add(textPlane);

    const topRoll = createCylinder(0.05, 0.05, 1.18, 18, materials.darkWood);
    topRoll.rotation.z = Math.PI / 2;
    topRoll.position.y = 1.13;
    group.add(topRoll);

    const bottomRoll = createCylinder(0.05, 0.05, 1.18, 18, materials.darkWood);
    bottomRoll.rotation.z = Math.PI / 2;
    bottomRoll.position.y = -1.13;
    group.add(bottomRoll);

    const strapLeft = createBox(0.02, 0.18, 0.02, materials.blackMetal);
    strapLeft.position.set(-0.35, 1.26, 0);
    group.add(strapLeft);

    const strapRight = createBox(0.02, 0.18, 0.02, materials.blackMetal);
    strapRight.position.set(0.35, 1.26, 0);
    group.add(strapRight);

    return group;
  }

  function createSconce() {
    const group = new THREE.Group();

    const arm = createBox(0.05, 0.26, 0.05, materials.blackMetal);
    arm.position.z = 0.1;
    group.add(arm);

    const shade = createCylinder(0.18, 0.08, 0.34, 18, materials.wicker);
    shade.rotation.x = Math.PI / 2;
    shade.position.z = 0.24;
    group.add(shade);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), materials.warmBulb);
    bulb.position.z = 0.2;
    group.add(bulb);

    const pointLight = new THREE.PointLight(palette.warmLight, 0.75, 2.4, 2);
    pointLight.position.set(0, 0.02, 0.18);
    group.add(pointLight);

    return group;
  }

  function createPowerOutlet(kind = "single", options = {}) {
    const isDouble = kind === "double";
    const width = options.width ?? (isDouble ? 0.16 : 0.092);
    const height = options.height ?? (isDouble ? 0.086 : 0.092);
    const depth = options.depth ?? 0.022;
    const group = new THREE.Group();

    const plateMaterial = new THREE.MeshStandardMaterial({
      color: 0xf1eee8,
      roughness: 0.64,
      metalness: 0.02,
    });
    const insertMaterial = new THREE.MeshStandardMaterial({
      color: 0xe0d8cb,
      roughness: 0.72,
      metalness: 0.02,
    });
    const socketMaterial = new THREE.MeshStandardMaterial({
      color: 0x252220,
      roughness: 0.32,
      metalness: 0.16,
    });

    const plate = createBox(width, height, depth, plateMaterial);
    group.add(plate);

    const insertWidth = width - 0.022;
    const insertHeight = height - 0.022;
    const insert = createBox(insertWidth, insertHeight, depth * 0.5, insertMaterial);
    insert.position.z = depth * 0.34;
    group.add(insert);

    const socketCenters = isDouble ? [-width * 0.24, width * 0.24] : [0];
    socketCenters.forEach((x) => {
      [-0.012, 0.012].forEach((offsetX) => {
        const hole = createCylinder(0.008, 0.008, depth * 0.65, 18, socketMaterial);
        hole.rotation.x = Math.PI / 2;
        hole.position.set(x + offsetX, 0.002, depth * 0.42);
        group.add(hole);
      });

      const ground = createBox(0.032, 0.007, depth * 0.4, socketMaterial);
      ground.position.set(x, -insertHeight * 0.2, depth * 0.42);
      group.add(ground);
    });

    const screwTop = createCylinder(0.0045, 0.0045, depth * 0.28, 14, materials.steel);
    screwTop.rotation.x = Math.PI / 2;
    screwTop.position.set(0, insertHeight * 0.28, depth * 0.46);
    group.add(screwTop);

    const screwBottom = createCylinder(0.0045, 0.0045, depth * 0.28, 14, materials.steel);
    screwBottom.rotation.x = Math.PI / 2;
    screwBottom.position.set(0, -insertHeight * 0.28, depth * 0.46);
    group.add(screwBottom);

    return group;
  }

  function createChair() {
    const group = new THREE.Group();
    const seat = createBox(0.46, 0.05, 0.46, materials.blackMetal);
    seat.position.y = 0.48;
    group.add(seat);

    const back = createBox(0.46, 0.5, 0.05, materials.blackMetal);
    back.position.set(0, 0.78, -0.2);
    group.add(back);

    const rearRail = createBox(0.38, 0.03, 0.03, materials.blackMetal);
    rearRail.position.set(0, 0.64, -0.18);
    group.add(rearRail);

    [-0.18, 0.18].forEach((x) => {
      [-0.18, 0.18].forEach((z) => {
        const leg = createBox(0.04, 0.48, 0.04, materials.blackMetal);
        leg.position.set(x, 0.24, z);
        group.add(leg);
      });
    });

    return group;
  }

  function createTableSet(position, extraChair) {
    const group = new THREE.Group();
    group.position.copy(position);

    const top = createBox(0.92, 0.06, 0.92, materials.wood);
    top.position.y = 0.76;
    group.add(top);

    const leg = createCylinder(0.08, 0.11, 0.72, 20, materials.blackMetal);
    leg.position.y = 0.39;
    group.add(leg);

    const base = createBox(0.52, 0.04, 0.52, materials.blackMetal);
    base.position.y = 0.02;
    group.add(base);

    const frontChair = createChair();
    frontChair.position.set(-0.72, 0, 0);
    frontChair.rotation.y = Math.PI / 2;
    group.add(frontChair);

    const sideChair = createChair();
    sideChair.position.set(0.05, 0, -0.78);
    sideChair.rotation.y = 0;
    group.add(sideChair);

    if (extraChair) {
      const endChair = createChair();
      endChair.position.set(0.05, 0, 0.78);
      endChair.rotation.y = Math.PI;
      group.add(endChair);
    }

    return group;
  }

  function createBench(length) {
    const group = new THREE.Group();
    const base = createBox(0.76, 0.42, length, materials.darkWood);
    base.position.y = 0.21;
    group.add(base);

    const seat = createBox(0.72, 0.12, length - 0.08, materials.fabric);
    seat.position.set(-0.02, 0.48, 0);
    group.add(seat);

    const back = createBox(0.12, 0.78, length - 0.04, materials.fabric);
    back.position.set(-0.34, 0.84, 0);
    group.add(back);

    const woodCap = createBox(0.08, 0.08, length, materials.wood);
    woodCap.position.set(-0.35, 1.24, 0);
    group.add(woodCap);

    return group;
  }

  function createArchMirror() {
    const group = new THREE.Group();

    const shape = new THREE.Shape();
    shape.moveTo(-0.55, -1.0);
    shape.lineTo(-0.55, 0.5);
    shape.absarc(0, 0.5, 0.55, Math.PI, 0, false);
    shape.lineTo(0.55, -1.0);
    shape.lineTo(-0.55, -1.0);

    const mirrorPanel = new THREE.Mesh(new THREE.ShapeGeometry(shape), materials.mirror);
    mirrorPanel.position.z = -0.02;
    mirrorPanel.castShadow = true;
    mirrorPanel.receiveShadow = true;
    group.add(mirrorPanel);

    const sideLeft = createBox(0.08, 1.52, 0.12, materials.wood);
    sideLeft.position.set(-0.59, -0.24, 0);
    group.add(sideLeft);

    const sideRight = createBox(0.08, 1.52, 0.12, materials.wood);
    sideRight.position.set(0.59, -0.24, 0);
    group.add(sideRight);

    const base = createBox(1.26, 0.08, 0.12, materials.wood);
    base.position.set(0, -1.04, 0);
    group.add(base);

    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(0.59, 0.045, 18, 42, Math.PI),
      materials.wood
    );
    arch.rotation.z = Math.PI;
    arch.position.y = 0.48;
    arch.castShadow = true;
    group.add(arch);

    return group;
  }

  function createPendantLamp() {
    const group = new THREE.Group();
    const cord = createCylinder(0.012, 0.012, 1.1, 8, materials.blackMetal);
    cord.position.y = 0.55;
    group.add(cord);

    const shade = new THREE.Mesh(
      new THREE.SphereGeometry(0.58, 28, 18, 0, Math.PI * 2, 0.08, Math.PI / 1.9),
      materials.wicker
    );
    shade.position.y = -0.08;
    shade.castShadow = true;
    shade.receiveShadow = true;
    group.add(shade);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.02, 8, 32),
      new THREE.MeshStandardMaterial({
        color: palette.wickerDark,
        roughness: 0.88,
      })
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, -0.44, 0);
    group.add(rim);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 18), materials.warmBulb);
    bulb.position.set(0, -0.22, 0);
    group.add(bulb);

    const pointLight = new THREE.PointLight(palette.warmLight, 1.45, 7, 2);
    pointLight.position.set(0, -0.18, 0);
    pointLight.castShadow = true;
    pointLight.shadow.mapSize.set(512, 512);
    group.add(pointLight);

    return group;
  }

  function createCloudChandelier(options = {}) {
    const width = THREE.MathUtils.clamp(options.width ?? 2.8, 1.6, 4.8);
    const height = THREE.MathUtils.clamp(options.height ?? 0.64, 0.36, 0.82);
    const depth = THREE.MathUtils.clamp(options.depth ?? 1.02, 0.48, 1.8);
    const group = new THREE.Group();
    const chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xd6d8dc,
      roughness: 0.14,
      metalness: 0.95,
    });
    const cableMaterial = new THREE.MeshStandardMaterial({
      color: 0x8d8f91,
      roughness: 0.38,
      metalness: 0.82,
    });
    const meshWireMaterial = new THREE.LineBasicMaterial({
      color: 0xf9f7f2,
      transparent: true,
      opacity: 0.96,
    });
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xfff0d8,
      transparent: true,
      opacity: 0.11,
      depthWrite: false,
    });

    const canopy = createCylinder(0.15, 0.15, 0.05, 24, chromeMaterial);
    canopy.position.y = 1.48;
    group.add(canopy);

    const capRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.012, 10, 32),
      chromeMaterial
    );
    capRing.rotation.x = Math.PI / 2;
    capRing.position.y = 1.46;
    capRing.castShadow = true;
    capRing.receiveShadow = true;
    group.add(capRing);

    [-0.15, 0, 0.15].forEach((x) => {
      const cord = createCylinder(0.005, 0.005, 1.08, 8, cableMaterial);
      cord.position.set(x, 0.93, 0);
      group.add(cord);
    });

    function createNetLobe(spec, seed) {
      const geometry = new THREE.IcosahedronGeometry(0.52, 3);
      const positions = geometry.attributes.position;
      const vertex = new THREE.Vector3();

      for (let index = 0; index < positions.count; index += 1) {
        vertex.fromBufferAttribute(positions, index);
        const wave =
          1 +
          Math.sin(vertex.x * 5.2 + seed) * 0.07 +
          Math.cos(vertex.y * 7.4 - seed * 1.6) * 0.05 +
          Math.sin(vertex.z * 4.8 + vertex.x * 2.4 + seed * 0.8) * 0.04;
        vertex.multiplyScalar(wave);
        positions.setXYZ(index, vertex.x, vertex.y, vertex.z);
      }

      positions.needsUpdate = true;
      geometry.computeVertexNormals();

      const wire = new THREE.LineSegments(
        new THREE.WireframeGeometry(geometry),
        meshWireMaterial
      );
      wire.position.set(spec.x, spec.y, spec.z);
      wire.scale.set(spec.sx, spec.sy, spec.sz);
      wire.rotation.set(spec.rx ?? 0, spec.ry ?? 0, spec.rz ?? 0);
      return wire;
    }

    const meshShade = new THREE.Group();
    meshShade.position.y = 0.08;
    meshShade.scale.set(width, height, depth);
    group.add(meshShade);

    const lobeSpecs = [
      { x: -0.9, y: -0.02, z: 0.04, sx: 0.56, sy: 0.42, sz: 0.3, ry: 0.18, rz: 0.08 },
      { x: -0.58, y: 0.12, z: -0.02, sx: 0.52, sy: 0.46, sz: 0.31, ry: -0.22, rz: -0.06 },
      { x: -0.26, y: -0.06, z: 0.06, sx: 0.48, sy: 0.39, sz: 0.3, ry: 0.24, rz: 0.1 },
      { x: 0.02, y: 0.15, z: 0.01, sx: 0.54, sy: 0.48, sz: 0.32, ry: -0.18, rz: -0.08 },
      { x: 0.32, y: -0.04, z: -0.04, sx: 0.5, sy: 0.38, sz: 0.3, ry: 0.2, rz: 0.06 },
      { x: 0.62, y: 0.09, z: 0.02, sx: 0.46, sy: 0.43, sz: 0.29, ry: -0.14, rz: -0.05 },
      { x: 0.9, y: -0.01, z: 0.03, sx: 0.34, sy: 0.32, sz: 0.24, ry: 0.16, rz: 0.04 },
      { x: -0.68, y: -0.28, z: -0.02, sx: 0.38, sy: 0.2, sz: 0.24, ry: -0.08, rz: -0.04 },
      { x: -0.22, y: -0.31, z: 0.02, sx: 0.34, sy: 0.18, sz: 0.22, ry: 0.12, rz: 0.05 },
      { x: 0.18, y: -0.3, z: 0.01, sx: 0.36, sy: 0.19, sz: 0.24, ry: -0.12, rz: -0.04 },
      { x: 0.6, y: -0.23, z: -0.03, sx: 0.3, sy: 0.17, sz: 0.2, ry: 0.1, rz: 0.03 },
    ];

    lobeSpecs.forEach((spec, index) => {
      meshShade.add(createNetLobe(spec, index * 0.73 + 0.4));
    });

    [-0.52, 0, 0.48].forEach((x, index) => {
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), glowMaterial);
      glow.position.set(x * width * 0.42, -0.06 - index * 0.01, 0);
      glow.scale.set(1.25, 0.82, 0.92);
      group.add(glow);
    });

    const pointLight = new THREE.PointLight(palette.warmLight, 1.2, 8, 2);
    pointLight.position.set(0, -0.04, 0);
    pointLight.castShadow = true;
    pointLight.shadow.mapSize.set(512, 512);
    group.add(pointLight);

    return group;
  }

  function createTaglinePanel() {
    return new THREE.Mesh(
      new THREE.PlaneGeometry(2.5, 0.8),
      new THREE.MeshBasicMaterial({
        map: taglineTexture,
        transparent: true,
      })
    );
  }

  function addAtmosphere() {
    const skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(70, 48, 24),
      new THREE.MeshBasicMaterial({
        map: skyTexture,
        side: THREE.BackSide,
        depthWrite: false,
      })
    );
    skyDome.rotation.y = Math.PI * 0.35;
    scene.add(skyDome);

    const siteCenterX = (plan.leftX + plan.rightX) / 2;
    const siteCenterZ = (plan.backZ + plan.hallFrontZ) / 2;

    const siteGround = new THREE.Mesh(
      new THREE.PlaneGeometry(48, 48),
      exteriorGroundMaterial
    );
    siteGround.rotation.x = -Math.PI / 2;
    siteGround.position.set(siteCenterX, -0.08, siteCenterZ + 2.4);
    siteGround.receiveShadow = true;
    scene.add(siteGround);

    const exteriorShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 22),
      new THREE.MeshBasicMaterial({
        map: exteriorShadowTexture,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      })
    );
    exteriorShadow.rotation.x = -Math.PI / 2;
    exteriorShadow.position.set(siteCenterX, -0.018, siteCenterZ + 1.5);
    scene.add(exteriorShadow);
  }

  function addLighting() {
    const hemi = new THREE.HemisphereLight(0xd7e6f2, 0xa98666, 0.62);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff1db, 2.8);
    sun.position.set(9.5, 10.6, 11.4);
    sun.target.position.set(-0.8, 0.2, 2.4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(3072, 3072);
    sun.shadow.camera.left = -12;
    sun.shadow.camera.right = 12;
    sun.shadow.camera.top = 14;
    sun.shadow.camera.bottom = -14;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 36;
    sun.shadow.bias = -0.00022;
    sun.shadow.normalBias = 0.025;
    scene.add(sun);
    scene.add(sun.target);

    const fill = new THREE.DirectionalLight(0xc6d6e8, 0.42);
    fill.position.set(-7.5, 6.2, 6.8);
    scene.add(fill);

    const warmCeiling = new THREE.PointLight(0xffddb0, 0.28, 22, 2);
    warmCeiling.position.set(0.2, 4.3, 2.5);
    scene.add(warmCeiling);

    const facadeBounce = new THREE.SpotLight(0xfff5ea, 1.35, 22, 0.82, 0.75, 2);
    facadeBounce.position.set(0.1, 3.8, 10.7);
    facadeBounce.target.position.set(0.1, 1.3, 3.6);
    scene.add(facadeBounce);
    scene.add(facadeBounce.target);

    function addSpot(position, targetPosition, intensity, angle = 0.38) {
      const light = new THREE.SpotLight(0xffd7a3, intensity, 16, angle, 0.7, 1.3);
      light.position.copy(position);
      light.castShadow = true;
      light.shadow.mapSize.set(1024, 1024);
      light.shadow.bias = -0.00012;
      light.shadow.normalBias = 0.02;
      light.target.position.copy(targetPosition);
      scene.add(light);
      scene.add(light.target);
    }

    addSpot(new THREE.Vector3(-2.7, 4.25, -2.9), new THREE.Vector3(-2.25, 1.2, -2.7), 1.25, 0.33);
    addSpot(new THREE.Vector3(0.35, 4.28, -0.2), new THREE.Vector3(0.4, 1.25, -0.45), 1.7, 0.37);
    addSpot(new THREE.Vector3(2.85, 4.18, 1.15), new THREE.Vector3(2.55, 1.15, 1.25), 0.98, 0.31);
    addSpot(new THREE.Vector3(-4.0, 4.18, 4.15), new THREE.Vector3(-4.25, 2.2, 4.15), 1.02, 0.3);
    addSpot(new THREE.Vector3(4.0, 4.12, 4.1), new THREE.Vector3(4.1, 2.2, 4.05), 1.08, 0.31);
  }

  const openingCenterX = (plan.openingLeftX + plan.openingRightX) / 2;
  const layoutVersion = 9;
  const layoutStorageKey = "pyrizhky-layout-v1";
  const designSelectionStorageKey = "pyrizhky-design-selection-v1";
  const importedDesignId = "imported";
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const pointerDown = new THREE.Vector2();
  const localMeasureBox = new THREE.Box3();
  const localMeasureSize = new THREE.Vector3();
  const floorCenterX = (plan.leftX + plan.rightX) / 2;
  const floorCenterZ = (plan.backZ + plan.hallFrontZ) / 2;
  const roomBounds = {
    minX: plan.leftX,
    maxX: plan.rightX,
    minY: -2,
    maxY: 8,
    minZ: plan.backZ,
    maxZ: plan.hallFrontZ,
  };
  const hallBounds = {
    minX: plan.leftX + 0.55,
    maxX: plan.rightX - 0.55,
    minY: -2,
    maxY: 8,
    minZ: plan.hallSplitZ + 0.45,
    maxZ: plan.hallFrontZ - 0.65,
  };
  const kitchenBounds = {
    minX: plan.leftX + 0.55,
    maxX: plan.rightX - 0.55,
    minY: -2,
    maxY: 8,
    minZ: plan.backZ + 0.55,
    maxZ: plan.hallSplitZ - 0.55,
  };
  const fixtureBounds = {
    minX: plan.leftX + 0.08,
    maxX: plan.rightX - 0.08,
    minY: 0.18,
    maxY: 2.25,
    minZ: plan.backZ + 0.08,
    maxZ: plan.hallFrontZ - 0.08,
  };

  let editorMode = "translate";
  let layoutIdCounter = 0;
  let selectedLayoutItemId = null;
  let selectionHelper = null;
  let transformDragActive = false;
  const dimensionInputs = [sizeXInput, sizeYInput, sizeZInput];
  const dimensionLabels = ["L", "H", "W"];

  const defaultMenuSets = [
    {
      title: "Menu",
      items: [
        { label: "Meat pie", price: "79" },
        { label: "Potato pie", price: "65" },
        { label: "Cabbage pie", price: "62" },
        { label: "Uzvar", price: "48" },
      ],
    },
    {
      title: "Season",
      items: [
        { label: "Cheese pie", price: "92" },
        { label: "Berry tart", price: "89" },
        { label: "Soup", price: "95" },
        { label: "Filter coffee", price: "55" },
      ],
    },
    {
      title: "Breakfast",
      items: [
        { label: "Syrnyky", price: "118" },
        { label: "Omelet", price: "96" },
        { label: "Latte", price: "68" },
        { label: "Cocoa", price: "62" },
      ],
    },
    {
      title: "Coffee",
      items: [
        { label: "Cookie", price: "38" },
        { label: "Croissant", price: "69" },
        { label: "Espresso", price: "48" },
        { label: "Flat white", price: "72" },
      ],
    },
  ];

  function getLayoutMaterial(materialId = "plaster") {
    switch (materialId) {
      case "plaster":
        return materials.plaster;
      case "wood":
        return materials.wood;
      case "darkWood":
        return materials.darkWood;
      case "steel":
        return materials.steel;
      case "blackMetal":
        return materials.blackMetal;
      case "glass":
        return materials.glass;
      case "paper":
        return materials.paper;
      case "fabric":
        return materials.fabric;
      case "kitchenGlow":
        return new THREE.MeshStandardMaterial({
          color: 0xffe8bf,
          emissive: 0xffcf88,
          emissiveIntensity: 1.4,
          roughness: 0.2,
        });
      default:
        return materials.plaster;
    }
  }

  function createWallAssembly(options = {}) {
    const length = options.length ?? 2.4;
    const height = options.height ?? 3.0;
    const thickness = options.thickness ?? plan.wallThickness;
    const baseY = options.baseY ?? 0;
    const group = new THREE.Group();
    const wall = createBox(length, height, thickness, getLayoutMaterial(options.materialId ?? "plaster"));
    wall.castShadow = false;
    wall.position.y = baseY + height / 2;
    group.add(wall);

    if (options.baseboard !== false) {
      const baseboardHeight = options.baseboardHeight ?? 0.16;
      const baseboardDepth = options.baseboardDepth ?? 0.08;
      const baseboard = createBox(
        length,
        baseboardHeight,
        baseboardDepth,
        getLayoutMaterial(options.baseboardMaterialId ?? "darkWood")
      );
      baseboard.position.y = baseY + baseboardHeight / 2;
      group.add(baseboard);
    }

    return group;
  }

  function createBoxFixture(options = {}) {
    const width = options.width ?? 1;
    const height = options.height ?? 1;
    const depth = options.depth ?? 0.1;
    const baseY = options.baseY ?? 0;
    const box = createBox(width, height, depth, getLayoutMaterial(options.materialId ?? "wood"));
    if ((options.materialId ?? "wood") === "plaster") {
      box.castShadow = false;
    }
    box.position.y = baseY + height / 2;
    return box;
  }

  function createFloorAssembly() {
    const group = new THREE.Group();
    const floorThickness = 0.06;
    const floorCenterX = (plan.leftX + plan.rightX) / 2;
    const floorCenterZ = (plan.backZ + plan.hallFrontZ) / 2;
    const floorWidth = plan.rightX - plan.leftX;
    const floorDepth = plan.hallFrontZ - plan.backZ;

    const plate = createBox(floorWidth, floorThickness, floorDepth, materials.floor);
    plate.position.y = floorThickness / 2;
    group.add(plate);

    const kitchenShape = new THREE.Shape();
    kitchenShape.moveTo(plan.leftX + 0.1 - floorCenterX, plan.backZ + 0.12 - floorCenterZ);
    kitchenShape.lineTo(plan.rightX - 0.1 - floorCenterX, plan.backZ + 0.12 - floorCenterZ);
    kitchenShape.lineTo(plan.rightX - 0.1 - floorCenterX, plan.hallSplitZ - 0.02 - floorCenterZ);
    kitchenShape.lineTo(plan.leftX + 0.1 - floorCenterX, plan.hallSplitZ - 0.02 - floorCenterZ);
    kitchenShape.closePath();

    const kitchenPatch = new THREE.Mesh(
      new THREE.ShapeGeometry(kitchenShape),
      new THREE.MeshBasicMaterial({
        color: 0xc7b29f,
        transparent: true,
        opacity: 0.16,
      })
    );
    kitchenPatch.rotation.x = -Math.PI / 2;
    kitchenPatch.position.y = floorThickness + 0.001;
    group.add(kitchenPatch);

    const serviceShape = new THREE.Shape();
    serviceShape.moveTo(plan.serviceLeftX - floorCenterX, plan.serviceAnnexBackZ - floorCenterZ);
    serviceShape.lineTo(plan.serviceAnnexRightX - floorCenterX, plan.serviceAnnexBackZ - floorCenterZ);
    serviceShape.lineTo(plan.serviceAnnexRightX - floorCenterX, plan.hallSplitZ - floorCenterZ);
    serviceShape.lineTo(plan.serviceRightX - floorCenterX, plan.hallSplitZ - floorCenterZ);
    serviceShape.lineTo(plan.serviceRightX - floorCenterX, plan.serviceFrontZ - floorCenterZ);
    serviceShape.lineTo(plan.serviceLeftX - floorCenterX, plan.serviceFrontZ - floorCenterZ);
    serviceShape.closePath();

    const servicePatch = new THREE.Mesh(
      new THREE.ShapeGeometry(serviceShape),
      new THREE.MeshBasicMaterial({
        color: 0xbba48f,
        transparent: true,
        opacity: 0.18,
      })
    );
    servicePatch.rotation.x = -Math.PI / 2;
    servicePatch.position.y = floorThickness + 0.002;
    group.add(servicePatch);

    const sunlightPatch = new THREE.Mesh(
      new THREE.PlaneGeometry(5.8, 4.6),
      new THREE.MeshBasicMaterial({
        color: 0xfff2d3,
        transparent: true,
        opacity: 0.14,
      })
    );
    sunlightPatch.rotation.x = -Math.PI / 2;
    sunlightPatch.position.set(-0.6 - floorCenterX, floorThickness + 0.003, 4.7 - floorCenterZ);
    group.add(sunlightPatch);

    const floorShadow = new THREE.Mesh(
      new THREE.CircleGeometry(3.8, 48),
      new THREE.MeshBasicMaterial({
        color: 0x9c7a56,
        transparent: true,
        opacity: 0.08,
      })
    );
    floorShadow.rotation.x = -Math.PI / 2;
    floorShadow.scale.set(1.25, 1.25, 1.25);
    floorShadow.position.set(-0.1 - floorCenterX, floorThickness + 0.004, 3.35 - floorCenterZ);
    group.add(floorShadow);

    return group;
  }

  function createRaisedSignFixture(options = {}) {
    const group = new THREE.Group();
    const sign = createBrandSign();
    sign.position.y = options.baseY ?? 3.02;
    group.add(sign);
    return group;
  }

  function createFacadeWindowUnit(options = {}) {
    const width = options.width ?? 1.35;
    const height = options.height ?? 2.55;
    const depth = options.depth ?? 0.12;
    const frameThickness = options.frameThickness ?? 0.08;
    const sillHeight = options.sillHeight ?? 0.12;
    const group = new THREE.Group();

    const leftFrame = createBox(frameThickness, height, depth, materials.blackMetal);
    leftFrame.position.set(-width / 2 + frameThickness / 2, height / 2, 0);
    group.add(leftFrame);

    const rightFrame = createBox(frameThickness, height, depth, materials.blackMetal);
    rightFrame.position.set(width / 2 - frameThickness / 2, height / 2, 0);
    group.add(rightFrame);

    const topFrame = createBox(width, frameThickness, depth, materials.blackMetal);
    topFrame.position.set(0, height - frameThickness / 2, 0);
    group.add(topFrame);

    const bottomFrame = createBox(width, frameThickness, depth, materials.blackMetal);
    bottomFrame.position.set(0, frameThickness / 2, 0);
    group.add(bottomFrame);

    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(width - frameThickness * 1.8, height - frameThickness * 1.8, depth * 0.42),
      materials.glass
    );
    glass.position.set(0, height / 2, 0);
    group.add(glass);

    const sill = createBox(width + 0.08, sillHeight, depth + 0.08, materials.darkWood);
    sill.position.set(0, sillHeight / 2 - 0.01, 0);
    group.add(sill);

    return group;
  }

  function createFacadeDoorUnit(options = {}) {
    const width = options.width ?? 1.76;
    const height = options.height ?? 2.85;
    const depth = options.depth ?? 0.12;
    const frameThickness = options.frameThickness ?? 0.08;
    const transomHeight = options.transomHeight ?? 0.52;
    const sideLiteWidth = options.sideLiteWidth ?? 0.58;
    const group = new THREE.Group();

    const leftFrame = createBox(frameThickness, height, depth, materials.blackMetal);
    leftFrame.position.set(-width / 2 + frameThickness / 2, height / 2, 0);
    group.add(leftFrame);

    const rightFrame = createBox(frameThickness, height, depth, materials.blackMetal);
    rightFrame.position.set(width / 2 - frameThickness / 2, height / 2, 0);
    group.add(rightFrame);

    const topFrame = createBox(width, frameThickness, depth, materials.blackMetal);
    topFrame.position.set(0, height - frameThickness / 2, 0);
    group.add(topFrame);

    const bottomFrame = createBox(width, frameThickness, depth, materials.blackMetal);
    bottomFrame.position.set(0, frameThickness / 2, 0);
    group.add(bottomFrame);

    const transomBeam = createBox(width, frameThickness, depth, materials.blackMetal);
    transomBeam.position.set(0, height - transomHeight, 0);
    group.add(transomBeam);

    const clearWidth = width - frameThickness * 2;
    const doorWidth = clearWidth - sideLiteWidth;
    const mullionX = -clearWidth / 2 + doorWidth;
    const mullion = createBox(frameThickness, height - transomHeight, depth, materials.blackMetal);
    mullion.position.set(mullionX, (height - transomHeight) / 2, 0);
    group.add(mullion);

    const doorGlass = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth - frameThickness * 1.4, height - transomHeight - frameThickness * 1.8, depth * 0.42),
      materials.glass
    );
    doorGlass.position.set((-clearWidth / 2 + doorWidth / 2), (height - transomHeight) / 2, 0);
    group.add(doorGlass);

    const sideGlass = new THREE.Mesh(
      new THREE.BoxGeometry(sideLiteWidth - frameThickness * 1.4, height - transomHeight - frameThickness * 1.8, depth * 0.42),
      materials.glass
    );
    sideGlass.position.set((clearWidth / 2 - sideLiteWidth / 2), (height - transomHeight) / 2, 0);
    group.add(sideGlass);

    const transomGlass = new THREE.Mesh(
      new THREE.BoxGeometry(width - frameThickness * 1.8, transomHeight - frameThickness * 1.8, depth * 0.42),
      materials.glass
    );
    transomGlass.position.set(0, height - transomHeight / 2, 0);
    group.add(transomGlass);

    const handle = createBox(0.03, 0.42, 0.03, materials.blackMetal);
    handle.position.set(mullionX - doorWidth * 0.18, (height - transomHeight) * 0.48, depth * 0.32);
    group.add(handle);

    const threshold = createBox(width + 0.06, 0.04, depth + 0.08, materials.darkWood);
    threshold.position.set(0, 0.02, 0);
    group.add(threshold);

    return group;
  }

  function createWindowPlanter(options = {}) {
    const width = options.width ?? 1.52;
    const height = options.height ?? 0.42;
    const depth = options.depth ?? 0.34;
    const group = new THREE.Group();

    const shellThickness = 0.026;
    const visibleDepth = Math.max(0.24, depth * 0.78);
    const frontDepth = visibleDepth / 2 - shellThickness / 2;
    const innerWidth = width - shellThickness * 2;
    const innerDepth = visibleDepth - shellThickness * 2;

    const frontLeft = createBox(width * 0.5 - 0.01, height, shellThickness, materials.lightWood);
    frontLeft.position.set(-width * 0.25 + 0.005, height / 2, frontDepth);
    group.add(frontLeft);

    const frontRight = createBox(width * 0.5 - 0.01, height, shellThickness, materials.lightWood);
    frontRight.position.set(width * 0.25 - 0.005, height / 2, frontDepth);
    group.add(frontRight);

    const seam = createBox(0.012, height, shellThickness + 0.006, materials.lightWood);
    seam.position.set(0, height / 2, frontDepth);
    group.add(seam);

    const back = createBox(width, height, shellThickness, materials.lightWood);
    back.position.set(0, height / 2, -frontDepth);
    group.add(back);

    const left = createBox(shellThickness, height, visibleDepth - shellThickness * 2, materials.lightWood);
    left.position.set(-width / 2 + shellThickness / 2, height / 2, 0);
    group.add(left);

    const right = createBox(shellThickness, height, visibleDepth - shellThickness * 2, materials.lightWood);
    right.position.set(width / 2 - shellThickness / 2, height / 2, 0);
    group.add(right);

    const bottom = createBox(innerWidth, shellThickness, innerDepth, materials.lightWood);
    bottom.position.set(0, shellThickness / 2, 0);
    group.add(bottom);

    const fill = createBox(innerWidth - 0.01, 0.08, innerDepth - 0.01, materials.soil);
    fill.position.set(0, height - 0.055, 0);
    group.add(fill);

    const rim = createBox(width + 0.012, 0.016, visibleDepth + 0.01, materials.lightWood);
    rim.position.set(0, height + 0.004, 0);
    group.add(rim);

    const stemBandCount = 42;
    for (let index = 0; index < stemBandCount; index += 1) {
      const stem = createCylinder(0.004, 0.006, 0.28 + (index % 5) * 0.04, 6, materials.dryGrassStem);
      const x = -innerWidth / 2 + 0.06 + (index / (stemBandCount - 1)) * (innerWidth - 0.12);
      const z = ((index % 6) - 2.5) * 0.022;
      stem.position.set(x, height + stem.geometry.parameters.height / 2 - 0.05, z);
      stem.rotation.z = -0.12 + ((index % 7) - 3) * 0.018;
      group.add(stem);
    }

    const wheatTuftXs = [-0.52, -0.34, -0.17, 0.03, 0.21, 0.39, 0.56];
    wheatTuftXs.forEach((xOffset, tuftIndex) => {
      const tuft = new THREE.Group();
      tuft.position.set(xOffset * (width / 1.52), height - 0.02, ((tuftIndex % 2) - 0.5) * 0.03);
      for (let stemIndex = 0; stemIndex < 10; stemIndex += 1) {
        const stemHeight = 0.26 + (stemIndex % 4) * 0.035;
        const stem = createCylinder(0.003, 0.0045, stemHeight, 6, materials.dryGrassStem);
        stem.position.set((stemIndex - 4.5) * 0.01, stemHeight / 2, (stemIndex % 3 - 1) * 0.01);
        stem.rotation.z = -0.18 + stemIndex * 0.038;
        tuft.add(stem);

        const seed = createBox(0.02, 0.11, 0.012, materials.dryGrassDark);
        seed.position.set((stemIndex - 4.5) * 0.011, stemHeight * 0.85, (stemIndex % 3 - 1) * 0.012);
        seed.rotation.z = 0.28;
        tuft.add(seed);
      }
      group.add(tuft);
    });

    const pampasSpecs = [
      { x: -0.54, y: 0.62, scale: 0.95, rot: -0.22, material: materials.pampasLight },
      { x: -0.18, y: 0.36, scale: 0.58, rot: 0.16, material: materials.pampasWarm },
      { x: 0.02, y: 0.76, scale: 1.02, rot: -0.08, material: materials.pampasWarm },
      { x: 0.18, y: 0.74, scale: 0.98, rot: 0.08, material: materials.pampasLight },
      { x: 0.34, y: 0.68, scale: 0.86, rot: -0.12, material: materials.pampasWarm },
      { x: 0.56, y: 0.82, scale: 1.04, rot: 0.12, material: materials.pampasLight },
    ];

    pampasSpecs.forEach((spec, index) => {
      const stemHeight = spec.y;
      const stem = createCylinder(0.004, 0.006, stemHeight, 8, materials.dryGrassStem);
      stem.position.set(spec.x * (width / 1.52), height + stemHeight / 2 - 0.04, ((index % 3) - 1) * 0.018);
      stem.rotation.z = spec.rot * 0.6;
      group.add(stem);

      const plumeGroup = new THREE.Group();
      plumeGroup.position.set(spec.x * (width / 1.52), height + stemHeight - 0.02, ((index % 3) - 1) * 0.012);
      plumeGroup.rotation.z = spec.rot;
      plumeGroup.scale.set(spec.scale, spec.scale, spec.scale);

      [0, Math.PI / 3, -Math.PI / 3].forEach((rotationY) => {
        const plume = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.62), spec.material);
        plume.position.y = 0.26;
        plume.rotation.y = rotationY;
        plume.castShadow = true;
        plume.receiveShadow = true;
        plumeGroup.add(plume);
      });

      const secondary = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.34), spec.material);
      secondary.position.set(0.035, 0.08, 0);
      secondary.rotation.y = Math.PI / 4;
      secondary.rotation.z = 0.24;
      secondary.castShadow = true;
      plumeGroup.add(secondary);

      group.add(plumeGroup);
    });

    return group;
  }

  function getSegmentRotationY(x1, z1, x2, z2) {
    return -Math.atan2(z2 - z1, x2 - x1);
  }

  function createWallSpecification(templateId, x1, z1, x2, z2, options = {}) {
    return {
      templateId,
      position: [(x1 + x2) / 2, 0, (z1 + z2) / 2],
      rotation: [0, getSegmentRotationY(x1, z1, x2, z2), 0],
      options: {
        length: Number(Math.hypot(x2 - x1, z2 - z1).toFixed(4)),
        height: options.height,
        thickness: options.thickness,
        materialId: options.materialId,
        baseboard: options.baseboard,
        baseboardHeight: options.baseboardHeight,
        baseboardDepth: options.baseboardDepth,
        baseboardMaterialId: options.baseboardMaterialId,
      },
    };
  }

  function createBoxFixtureSpecification(x, z, width, height, depth, options = {}) {
    return {
      templateId: options.templateId ?? "boxFixture",
      position: [x, 0, z],
      rotation: [0, options.rotationY ?? 0, 0],
      options: {
        width,
        height,
        depth,
        baseY: options.baseY ?? 0,
        materialId: options.materialId ?? "wood",
      },
    };
  }

  const layoutTemplates = {
    floorSurface: {
      label: "Floor",
      placement: "floor",
      structural: true,
      catalog: false,
      translateAxes: "xyz",
      rotateAxes: "y",
      bounds: roomBounds,
      defaultPosition: [floorCenterX, 0, floorCenterZ],
      defaultRotation: [0, 0, 0],
      build: () => createFloorAssembly(),
    },
    facadeWindow: {
      label: "Facade Window",
      placement: "floor",
      structural: true,
      translateAxes: "xz",
      rotateAxes: "y",
      bounds: roomBounds,
      defaultPosition: [-2.78, 0, plan.hallFrontZ + 0.06],
      defaultRotation: [0, 0, 0],
      defaultOptions: {
        width: 1.35,
        height: 2.55,
        depth: 0.12,
        frameThickness: 0.08,
      },
      build: (options) => createFacadeWindowUnit(options),
    },
    facadeDoor: {
      label: "Facade Door",
      placement: "floor",
      structural: true,
      translateAxes: "xz",
      rotateAxes: "y",
      bounds: roomBounds,
      defaultPosition: [0, 0, plan.hallFrontZ + 0.08],
      defaultRotation: [0, 0, 0],
      defaultOptions: {
        width: 1.76,
        height: 2.85,
        depth: 0.12,
        frameThickness: 0.08,
        transomHeight: 0.52,
        sideLiteWidth: 0.58,
      },
      build: (options) => createFacadeDoorUnit(options),
    },
    windowPlanter: {
      label: "Window Planter",
      placement: "floor",
      translateAxes: "xz",
      rotateAxes: "y",
      bounds: roomBounds,
      defaultPosition: [-2.78, 1.15, plan.hallFrontZ + 0.02],
      defaultRotation: [0, 0, 0],
      defaultOptions: {
        width: 1.52,
        height: 0.42,
        depth: 0.34,
      },
      build: (options) => createWindowPlanter(options),
    },
    wall: {
      label: "Wall",
      placement: "floor",
      structural: true,
      translateAxes: "xz",
      rotateAxes: "y",
      bounds: roomBounds,
      defaultPosition: [0, 0, 0],
      defaultRotation: [0, 0, 0],
      defaultOptions: {
        length: 2.4,
        height: 3.0,
        thickness: plan.wallThickness,
        materialId: "plaster",
        baseboard: true,
        baseboardMaterialId: "darkWood",
        baseboardHeight: 0.16,
        baseboardDepth: 0.08,
      },
      build: (options) => createWallAssembly(options),
    },
    lowWall: {
      label: "Low Wall",
      placement: "floor",
      structural: true,
      translateAxes: "xz",
      rotateAxes: "y",
      bounds: roomBounds,
      defaultPosition: [0, 0, 0],
      defaultRotation: [0, 0, 0],
      defaultOptions: {
        length: 1.8,
        height: 1.15,
        thickness: plan.wallThickness,
        materialId: "plaster",
        baseboard: true,
        baseboardMaterialId: "darkWood",
        baseboardHeight: 0.16,
        baseboardDepth: 0.08,
      },
      build: (options) => createWallAssembly(options),
    },
    boxFixture: {
      label: "Box Fixture",
      placement: "floor",
      structural: true,
      catalog: false,
      translateAxes: "xz",
      rotateAxes: "y",
      bounds: roomBounds,
      defaultPosition: [0, 0, 0],
      defaultRotation: [0, 0, 0],
      defaultOptions: {
        width: 1,
        height: 1,
        depth: 0.1,
        baseY: 0,
        materialId: "wood",
      },
      build: (options) => createBoxFixture(options),
    },
    raisedSign: {
      label: "Brand Sign",
      placement: "floor",
      structural: true,
      translateAxes: "xz",
      rotateAxes: "y",
      bounds: roomBounds,
      defaultPosition: [openingCenterX, 0, plan.hallSplitZ + 0.02],
      defaultRotation: [0, 0, 0],
      defaultOptions: {
        baseY: 3.02,
      },
      build: (options) => createRaisedSignFixture(options),
    },
    marmit: {
      label: "Marmit",
      placement: "floor",
      translateAxes: "xz",
      rotateAxes: "y",
      bounds: hallBounds,
      defaultPosition: [openingCenterX, 0, plan.hallSplitZ + 0.04],
      defaultRotation: [0, 0, 0],
      defaultScale: [0.74, 1, 0.92],
      build: () => createDisplayWarmer(),
    },
    table4: {
      label: "Table 4",
      placement: "floor",
      translateAxes: "xz",
      rotateAxes: "y",
      bounds: hallBounds,
      defaultPosition: [2.4, 0, 3.15],
      defaultRotation: [0, 0, 0],
      build: () => createTableSet(new THREE.Vector3(), true),
    },
    table3: {
      label: "Table 3",
      placement: "floor",
      translateAxes: "xz",
      rotateAxes: "y",
      bounds: hallBounds,
      defaultPosition: [2.4, 0, 5.25],
      defaultRotation: [0, 0, 0],
      build: () => createTableSet(new THREE.Vector3(), false),
    },
    bench: {
      label: "Bench",
      placement: "floor",
      translateAxes: "xz",
      rotateAxes: "y",
      bounds: hallBounds,
      defaultPosition: [4.02, 0, 4.2],
      defaultRotation: [0, Math.PI, 0],
      build: () => createBench(3.1),
    },
    mirror: {
      label: "Mirror",
      placement: "floor",
      translateAxes: "xz",
      rotateAxes: "y",
      bounds: hallBounds,
      defaultPosition: [-3.9, 1.44, 6.0],
      defaultRotation: [0, Math.PI * 0.88, 0.03],
      build: () => createArchMirror(),
    },
    counterWide: {
      label: "Counter Wide",
      placement: "floor",
      translateAxes: "xz",
      rotateAxes: "y",
      bounds: kitchenBounds,
      defaultPosition: [-1.2, 0, -3.15],
      defaultRotation: [0, 0, 0],
      build: () => createPrepCounter(2.8, 0.82, true),
    },
    counterSide: {
      label: "Counter Side",
      placement: "floor",
      translateAxes: "xz",
      rotateAxes: "y",
      bounds: kitchenBounds,
      defaultPosition: [plan.leftX + 0.4, 0, -2.05],
      defaultRotation: [0, Math.PI / 2, 0],
      build: () => createPrepCounter(2.2, 0.72, false),
    },
    counterIsland: {
      label: "Counter Island",
      placement: "floor",
      translateAxes: "xz",
      rotateAxes: "y",
      bounds: kitchenBounds,
      defaultPosition: [-0.15, 0, -1.65],
      defaultRotation: [0, Math.PI / 2, 0],
      build: () => createPrepCounter(1.9, 0.82, false),
    },
    kitchenSink: {
      label: "Kitchen Sink",
      placement: "floor",
      translateAxes: "xz",
      rotateAxes: "y",
      bounds: kitchenBounds,
      defaultPosition: [3.18, 0, -2.55],
      defaultRotation: [0, -Math.PI / 2, 0],
      defaultOptions: {
        width: 1.45,
        depth: 0.72,
      },
      build: (options) => createKitchenSinkUnit(options),
    },
    pastryLine: {
      label: "Pastry Line",
      placement: "floor",
      translateAxes: "xz",
      rotateAxes: "y",
      bounds: kitchenBounds,
      defaultPosition: [1.28, 0, -3.55],
      defaultRotation: [0, 0, 0],
      defaultOptions: {
        width: 2.95,
        depth: 0.84,
      },
      build: (options) => createPastryEquipmentLine(options),
    },
    cloudChandelier: {
      label: "Mesh Chandelier",
      placement: "ceiling",
      translateAxes: "xz",
      rotateAxes: "y",
      bounds: hallBounds,
      defaultPosition: [0.42, 3.32, 3.82],
      defaultRotation: [0, 0, 0],
      defaultOptions: {
        width: 2.8,
        height: 0.64,
        depth: 1.02,
      },
      build: (options) => createCloudChandelier(options),
    },
    pendant: {
      label: "Pendant",
      placement: "ceiling",
      translateAxes: "xz",
      rotateAxes: "y",
      bounds: hallBounds,
      defaultPosition: [2.4, 3.55, 3.15],
      defaultRotation: [0, 0, 0],
      build: () => createPendantLamp(),
    },
    menuScroll: {
      label: "Menu Scroll",
      placement: "free",
      translateAxes: "xyz",
      rotateAxes: "xyz",
      bounds: {
        minX: plan.leftX + 0.1,
        maxX: plan.rightX - 0.1,
        minY: 0.65,
        maxY: 4.1,
        minZ: plan.backZ + 0.1,
        maxZ: plan.hallFrontZ - 0.1,
      },
      defaultPosition: [plan.leftX + 0.08, 2.18, 2.45],
      defaultRotation: [0, Math.PI / 2, 0],
      defaultOptions: defaultMenuSets[0],
      build: (options) =>
        createMenuScroll(options?.title ?? "Menu", options?.items ?? defaultMenuSets[0].items),
    },
    sconce: {
      label: "Sconce",
      placement: "free",
      translateAxes: "xyz",
      rotateAxes: "xyz",
      bounds: {
        minX: plan.leftX + 0.1,
        maxX: plan.rightX - 0.1,
        minY: 1.4,
        maxY: 4.3,
        minZ: plan.backZ + 0.1,
        maxZ: plan.hallFrontZ - 0.1,
      },
      defaultPosition: [plan.leftX + 0.16, 3.42, 2.45],
      defaultRotation: [0, Math.PI / 2, 0],
      build: () => createSconce(),
    },
    outletSingle: {
      label: "Single Outlet",
      placement: "free",
      translateAxes: "xyz",
      rotateAxes: "xyz",
      bounds: fixtureBounds,
      defaultPosition: [plan.leftX + 0.09, 0.34, 5.3],
      defaultRotation: [0, Math.PI / 2, 0],
      defaultOptions: {
        width: 0.092,
        height: 0.092,
        depth: 0.022,
      },
      build: (options) => createPowerOutlet("single", options),
    },
    outletDouble: {
      label: "Double Outlet",
      placement: "free",
      translateAxes: "xyz",
      rotateAxes: "xyz",
      bounds: fixtureBounds,
      defaultPosition: [plan.rightX - 0.09, 0.34, 4.8],
      defaultRotation: [0, -Math.PI / 2, 0],
      defaultOptions: {
        width: 0.16,
        height: 0.086,
        depth: 0.022,
      },
      build: (options) => createPowerOutlet("double", options),
    },
    tagline: {
      label: "Tagline",
      placement: "free",
      translateAxes: "xyz",
      rotateAxes: "xyz",
      bounds: {
        minX: plan.leftX + 0.1,
        maxX: plan.rightX - 0.1,
        minY: 0.9,
        maxY: 3.4,
        minZ: plan.backZ + 0.1,
        maxZ: plan.hallFrontZ - 0.1,
      },
      defaultPosition: [plan.leftX + 0.08, 1.35, 5.4],
      defaultRotation: [0, Math.PI / 2, 0],
      build: () => createTaglinePanel(),
    },
  };

  const layoutItems = new Map();

  function cloneData(value) {
    if (value == null) {
      return undefined;
    }
    return JSON.parse(JSON.stringify(value));
  }

  function measureLocalObjectSize(object) {
    localMeasureBox.makeEmpty();
    object.updateMatrixWorld(true);
    localMeasureBox.setFromObject(object);
    localMeasureBox.getSize(localMeasureSize);
    return localMeasureSize.clone();
  }

  function getItemBaseSize(item) {
    return item?.baseSize ?? [0, 0, 0];
  }

  function getItemDimensions(item) {
    const baseSize = getItemBaseSize(item);
    return [
      Math.abs(baseSize[0] * item.wrapper.scale.x),
      Math.abs(baseSize[1] * item.wrapper.scale.y),
      Math.abs(baseSize[2] * item.wrapper.scale.z),
    ];
  }

  function updateDimensionInputs() {
    const selected = getSelectedLayoutItem();
    if (!selected) {
      dimensionInputs.forEach((input) => {
        input.value = "";
        input.disabled = true;
      });
      return;
    }

    const dimensions = getItemDimensions(selected);
    const baseSize = getItemBaseSize(selected);
    dimensionInputs.forEach((input, index) => {
      const axisSize = baseSize[index] ?? 0;
      if (axisSize <= 0.0001) {
        input.value = "";
        input.disabled = true;
        return;
      }
      input.disabled = false;
      input.value = dimensions[index].toFixed(2);
    });
  }

  function applyDimensionChange(axisIndex, rawValue) {
    const selected = getSelectedLayoutItem();
    if (!selected) {
      return;
    }

    const baseSize = getItemBaseSize(selected);
    const axisBaseSize = baseSize[axisIndex] ?? 0;
    if (axisBaseSize <= 0.0001) {
      updateDimensionInputs();
      return;
    }

    const nextSize = Number.parseFloat(rawValue);
    if (!Number.isFinite(nextSize) || nextSize <= 0.01) {
      updateDimensionInputs();
      return;
    }

    const nextScale = nextSize / axisBaseSize;
    if (!Number.isFinite(nextScale) || nextScale <= 0) {
      updateDimensionInputs();
      return;
    }

    if (axisIndex === 0) {
      selected.wrapper.scale.x = nextScale;
    } else if (axisIndex === 1) {
      selected.wrapper.scale.y = nextScale;
    } else {
      selected.wrapper.scale.z = nextScale;
    }

    applyLayoutConstraints(selected);
    refreshSelectionHelper();
    updateSelectionText();
    updateDimensionInputs();
    persistLayoutToStorage();
    setStatus(`${selected.label} resized.`);
  }

  function setButtonActive(button, isActive) {
    button.classList.toggle("hud__button--active", isActive);
  }

  function getSelectedLayoutItem() {
    return selectedLayoutItemId ? layoutItems.get(selectedLayoutItemId) ?? null : null;
  }

  function updateSelectionText() {
    const selected = getSelectedLayoutItem();
    if (!selected) {
      selectionNode.textContent = "No selection";
      return;
    }

    const { x, y, z } = selected.wrapper.position;
    const dimensions = getItemDimensions(selected);
    selectionNode.textContent = `${selected.label} | x ${x.toFixed(2)} y ${y.toFixed(2)} z ${z.toFixed(2)} | ${dimensionLabels[0]} ${dimensions[0].toFixed(2)} ${dimensionLabels[1]} ${dimensions[1].toFixed(2)} ${dimensionLabels[2]} ${dimensions[2].toFixed(2)}`;
  }

  function syncEditorButtons() {
    const hasSelection = Boolean(getSelectedLayoutItem());
    rotateQuarterButton.disabled = !hasSelection;
    duplicateItemButton.disabled = !hasSelection;
    deleteItemButton.disabled = !hasSelection;
    moveModeButton.disabled = !hasSelection;
    rotateModeButton.disabled = !hasSelection;
    setButtonActive(moveModeButton, hasSelection && editorMode === "translate");
    setButtonActive(rotateModeButton, hasSelection && editorMode === "rotate");
  }

  function applyLayoutConstraints(item) {
    const template = item.template;
    const position = item.wrapper.position;
    const rotation = item.wrapper.rotation;
    const defaultRotation = template.defaultRotation ?? [0, 0, 0];
    const bounds = template.bounds ?? null;

    if (template.placement === "floor" || template.placement === "ceiling") {
      rotation.x = defaultRotation[0];
      rotation.z = defaultRotation[2];
    }

    if (bounds) {
      if (typeof bounds.minX === "number") {
        position.x = THREE.MathUtils.clamp(position.x, bounds.minX, bounds.maxX);
      }
      if (typeof bounds.minY === "number") {
        position.y = THREE.MathUtils.clamp(position.y, bounds.minY, bounds.maxY);
      }
      if (typeof bounds.minZ === "number") {
        position.z = THREE.MathUtils.clamp(position.z, bounds.minZ, bounds.maxZ);
      }
    }
  }

  function updateTransformHandles() {
    const selected = getSelectedLayoutItem();
    if (!selected) {
      transformControls.detach();
      transformControls.visible = false;
      return;
    }

    let axes =
      editorMode === "translate"
        ? selected.template.translateAxes ?? "xz"
        : selected.template.rotateAxes ?? "y";

    if (
      editorMode === "translate" &&
      selected.template.allowVertical !== false &&
      !axes.includes("y")
    ) {
      axes += "y";
    }

    transformControls.setMode(editorMode);
    transformControls.setSpace(editorMode === "translate" ? "world" : "local");
    transformControls.showX = axes.includes("x");
    transformControls.showY = axes.includes("y");
    transformControls.showZ = axes.includes("z");
    transformControls.attach(selected.wrapper);
    transformControls.visible = true;
  }

  function removeSelectionHelper() {
    if (selectionHelper) {
      scene.remove(selectionHelper);
      selectionHelper = null;
    }
  }

  function refreshSelectionHelper() {
    removeSelectionHelper();
    const selected = getSelectedLayoutItem();
    if (!selected) {
      return;
    }

    selectionHelper = new THREE.BoxHelper(selected.wrapper, 0x97734b);
    selectionHelper.material.depthTest = false;
    scene.add(selectionHelper);
  }

  function selectLayoutItem(id) {
    selectedLayoutItemId = id;
    updateTransformHandles();
    refreshSelectionHelper();
    updateSelectionText();
    updateDimensionInputs();
    syncEditorButtons();
  }

  function clearSelection() {
    selectedLayoutItemId = null;
    transformControls.detach();
    transformControls.visible = false;
    removeSelectionHelper();
    updateSelectionText();
    updateDimensionInputs();
    syncEditorButtons();
  }

  function assignPickIds(root, itemId) {
    root.userData.layoutItemId = itemId;
    root.traverse((child) => {
      child.userData.layoutItemId = itemId;
    });
  }

  function createLayoutItem(specification) {
    const template = layoutTemplates[specification.templateId];
    if (!template) {
      return null;
    }

    const itemId = `item-${layoutIdCounter++}`;
    const wrapper = new THREE.Group();
    const content = template.build(cloneData(specification.options ?? template.defaultOptions));
    wrapper.add(content);
    const baseSize = measureLocalObjectSize(wrapper);

    const position = specification.position ?? template.defaultPosition;
    const rotation = specification.rotation ?? template.defaultRotation ?? [0, 0, 0];
    const scale = specification.scale ?? template.defaultScale ?? [1, 1, 1];
    wrapper.position.set(...position);
    wrapper.rotation.set(...rotation);
    wrapper.scale.set(...scale);
    assignPickIds(wrapper, itemId);
    layoutRoot.add(wrapper);

    const item = {
      id: itemId,
      label: template.label,
      templateId: specification.templateId,
      template,
      wrapper,
      options: cloneData(specification.options ?? template.defaultOptions) ?? {},
      baseSize: baseSize.toArray(),
    };
    layoutItems.set(itemId, item);
    applyLayoutConstraints(item);
    return item;
  }

  function serializeLayoutItem(item) {
    return {
      templateId: item.templateId,
      position: [
        Number(item.wrapper.position.x.toFixed(4)),
        Number(item.wrapper.position.y.toFixed(4)),
        Number(item.wrapper.position.z.toFixed(4)),
      ],
      rotation: [
        Number(item.wrapper.rotation.x.toFixed(4)),
        Number(item.wrapper.rotation.y.toFixed(4)),
        Number(item.wrapper.rotation.z.toFixed(4)),
      ],
      scale: [
        Number(item.wrapper.scale.x.toFixed(4)),
        Number(item.wrapper.scale.y.toFixed(4)),
        Number(item.wrapper.scale.z.toFixed(4)),
      ],
      options: cloneData(item.options) ?? {},
    };
  }

  function serializeLayout() {
    return [...layoutItems.values()].map((item) => serializeLayoutItem(item));
  }

  function persistLayoutToStorage() {
    try {
      window.localStorage.setItem(
        layoutStorageKey,
        JSON.stringify({
          version: layoutVersion,
          items: serializeLayout(),
        })
      );
    } catch (error) {
      console.warn(error);
    }
  }

  function clearLayoutItems() {
    clearSelection();
    layoutItems.clear();
    layoutIdCounter = 0;
    while (layoutRoot.children.length > 0) {
      layoutRoot.remove(layoutRoot.children[0]);
    }
  }

  function getDefaultStructuralSpecs() {
    const openingWidth = plan.openingRightX - plan.openingLeftX;
    const specs = [
      {
        templateId: "floorSurface",
        position: [floorCenterX, 0, floorCenterZ],
      },
      {
        templateId: "facadeWindow",
        position: [-2.78, 0, plan.hallFrontZ + 0.06],
        options: {
          width: 1.35,
          height: 2.55,
          depth: 0.12,
          frameThickness: 0.08,
        },
      },
      {
        templateId: "facadeDoor",
        position: [0, 0, plan.hallFrontZ + 0.08],
        options: {
          width: 1.76,
          height: 2.85,
          depth: 0.12,
          frameThickness: 0.08,
          transomHeight: 0.52,
          sideLiteWidth: 0.58,
        },
      },
      createWallSpecification("wall", plan.leftX, plan.hallFrontZ, plan.leftX, plan.backZ, {
        height: plan.wallHeight,
      }),
      createWallSpecification("wall", plan.rightX, plan.backZ, plan.rightX, plan.hallFrontZ, {
        height: plan.wallHeight,
      }),
      createWallSpecification("wall", plan.leftX, plan.backZ, plan.rightX, plan.backZ, {
        height: plan.wallHeight,
      }),
      createWallSpecification("lowWall", plan.leftX, plan.hallFrontZ, plan.entryLeftX, plan.hallFrontZ, {
        height: 1.15,
      }),
      createWallSpecification(
        "lowWall",
        plan.entryRightX,
        plan.hallFrontZ,
        plan.rightX,
        plan.hallFrontZ,
        {
          height: 1.15,
        }
      ),
      createWallSpecification("wall", plan.leftX, plan.hallSplitZ, plan.openingLeftX, plan.hallSplitZ, {
        height: plan.wallHeight,
      }),
      createWallSpecification(
        "wall",
        plan.openingRightX,
        plan.hallSplitZ,
        plan.serviceLeftX,
        plan.hallSplitZ,
        {
          height: plan.wallHeight,
        }
      ),
      createWallSpecification(
        "wall",
        plan.leftDividerX,
        plan.leftDividerBackZ,
        plan.leftDividerX,
        plan.leftDividerFrontZ,
        {
          height: 3.0,
        }
      ),
      createWallSpecification(
        "wall",
        plan.serviceLeftX,
        plan.serviceAnnexBackZ,
        plan.serviceLeftX,
        plan.serviceFrontZ,
        {
          height: 3.0,
        }
      ),
      createWallSpecification(
        "wall",
        plan.serviceLeftX,
        plan.serviceFrontZ,
        plan.serviceDoorLeftX,
        plan.serviceFrontZ,
        {
          height: 3.0,
        }
      ),
      createWallSpecification(
        "wall",
        plan.serviceDoorRightX,
        plan.serviceFrontZ,
        plan.serviceRightX,
        plan.serviceFrontZ,
        {
          height: 3.0,
        }
      ),
      createWallSpecification(
        "wall",
        plan.serviceRightX,
        plan.hallSplitZ,
        plan.serviceRightX,
        plan.serviceFrontZ,
        {
          height: 3.0,
        }
      ),
      createWallSpecification(
        "wall",
        plan.serviceLeftX,
        plan.serviceAnnexBackZ,
        plan.serviceAnnexRightX,
        plan.serviceAnnexBackZ,
        {
          height: 3.0,
        }
      ),
      createWallSpecification(
        "wall",
        plan.serviceAnnexRightX,
        plan.serviceAnnexBackZ,
        plan.serviceAnnexRightX,
        plan.hallSplitZ,
        {
          height: 3.0,
        }
      ),
      createWallSpecification(
        "wall",
        plan.serviceAnnexRightX,
        plan.hallSplitZ,
        plan.serviceRightX,
        plan.hallSplitZ,
        {
          height: 3.0,
        }
      ),
      createBoxFixtureSpecification(
        openingCenterX,
        plan.hallSplitZ,
        openingWidth,
        2.4,
        plan.wallThickness,
        {
          baseY: 2.4,
          materialId: "plaster",
        }
      ),
      createBoxFixtureSpecification(
        openingCenterX,
        plan.hallSplitZ,
        openingWidth + 0.22,
        0.1,
        0.18,
        {
          baseY: 2.4,
          materialId: "darkWood",
        }
      ),
      createBoxFixtureSpecification(plan.openingLeftX, plan.hallSplitZ, 0.1, 2.35, 0.2, {
        materialId: "darkWood",
      }),
      createBoxFixtureSpecification(plan.openingRightX, plan.hallSplitZ, 0.1, 2.35, 0.2, {
        materialId: "darkWood",
      }),
      createBoxFixtureSpecification(
        plan.serviceDoorLeftX + 0.39,
        plan.serviceFrontZ + 0.02,
        0.78,
        2.05,
        0.04,
        {
          materialId: "wood",
          rotationY: Math.PI * 0.18,
        }
      ),
      createBoxFixtureSpecification(plan.entryLeftX, plan.hallFrontZ + 0.02, 0.22, 2.6, 0.22, {
        materialId: "darkWood",
      }),
      createBoxFixtureSpecification(plan.entryRightX, plan.hallFrontZ + 0.02, 0.22, 2.6, 0.22, {
        materialId: "darkWood",
      }),
      createBoxFixtureSpecification(0, plan.hallFrontZ + 0.04, 2.1, 0.1, 0.28, {
        materialId: "darkWood",
      }),
      createBoxFixtureSpecification(openingCenterX, plan.hallSplitZ + 0.04, 4.9, 0.16, 0.28, {
        baseY: 2.2,
        materialId: "wood",
      }),
      {
        templateId: "raisedSign",
        position: [openingCenterX, 0, plan.hallSplitZ + 0.02],
        options: {
          baseY: 3.02,
        },
      },
      createBoxFixtureSpecification(-2.05, -2.05, 2.25, 0.08, 0.26, {
        baseY: 2.11,
        materialId: "darkWood",
      }),
      createBoxFixtureSpecification(-2.95, -2.05, 0.06, 0.72, 0.06, {
        baseY: 1.42,
        materialId: "blackMetal",
      }),
      createBoxFixtureSpecification(-1.15, -2.05, 0.06, 0.72, 0.06, {
        baseY: 1.42,
        materialId: "blackMetal",
      }),
      createBoxFixtureSpecification(-1.35, -1.4, 1.8, 0.04, 0.04, {
        baseY: 2.6,
        materialId: "blackMetal",
      }),
      createBoxFixtureSpecification(-1.95, -1.4, 0.03, 0.24, 0.03, {
        baseY: 2.36,
        materialId: "blackMetal",
      }),
      createBoxFixtureSpecification(-1.35, -1.4, 0.03, 0.24, 0.03, {
        baseY: 2.36,
        materialId: "blackMetal",
      }),
      createBoxFixtureSpecification(-0.75, -1.4, 0.03, 0.24, 0.03, {
        baseY: 2.36,
        materialId: "blackMetal",
      }),
      createBoxFixtureSpecification(openingCenterX, -1.55, 2.2, 0.08, 0.16, {
        baseY: 3.66,
        materialId: "kitchenGlow",
      }),
      createBoxFixtureSpecification(
        plan.serviceLeftX + 0.02,
        (plan.serviceFrontZ + plan.serviceAnnexBackZ) / 2,
        0.22,
        2.0,
        plan.serviceFrontZ - plan.serviceAnnexBackZ + 0.16,
        {
          baseY: 0.4,
          materialId: "darkWood",
        }
      ),
      createBoxFixtureSpecification(plan.leftX + 0.02, 2.9, 0.16, 1.0, 5.1, {
        baseY: 3.22,
        materialId: "wood",
      }),
    ];

    return specs;
  }

  function getDefaultFurnishingSpecs() {
    return [
      {
        templateId: "marmit",
        position: [openingCenterX, 0, plan.hallSplitZ + 0.04],
        scale: [0.74, 1, 0.92],
      },
      {
        templateId: "menuScroll",
        position: [plan.leftX + 0.08, 2.18, 2.45],
        rotation: [0, Math.PI / 2, 0],
        options: defaultMenuSets[0],
      },
      {
        templateId: "menuScroll",
        position: [plan.leftX + 0.08, 2.18, 4.6],
        rotation: [0, Math.PI / 2, 0],
        options: defaultMenuSets[1],
      },
      {
        templateId: "menuScroll",
        position: [plan.rightX - 0.08, 2.18, 3.0],
        rotation: [0, -Math.PI / 2, 0],
        options: defaultMenuSets[2],
      },
      {
        templateId: "menuScroll",
        position: [0.95, 2.18, 6.2],
        rotation: [0, Math.PI, 0],
        options: defaultMenuSets[3],
      },
      {
        templateId: "sconce",
        position: [plan.leftX + 0.16, 3.42, 2.45],
        rotation: [0, Math.PI / 2, 0],
      },
      {
        templateId: "sconce",
        position: [plan.leftX + 0.16, 3.42, 4.6],
        rotation: [0, Math.PI / 2, 0],
      },
      {
        templateId: "sconce",
        position: [plan.rightX - 0.16, 3.42, 3.0],
        rotation: [0, -Math.PI / 2, 0],
      },
      {
        templateId: "sconce",
        position: [0.95, 3.42, 6.1],
        rotation: [0, Math.PI, 0],
      },
      {
        templateId: "windowPlanter",
        position: [-2.78, 1.15, plan.hallFrontZ + 0.02],
        rotation: [0, 0, 0],
        options: {
          width: 1.52,
          height: 0.42,
          depth: 0.34,
        },
      },
      {
        templateId: "tagline",
        position: [plan.leftX + 0.08, 1.35, 5.4],
        rotation: [0, Math.PI / 2, 0],
      },
      {
        templateId: "bench",
        position: [4.02, 0, 4.2],
        rotation: [0, Math.PI, 0],
      },
      {
        templateId: "table4",
        position: [2.4, 0, 3.15],
        rotation: [0, 0, 0],
      },
      {
        templateId: "table3",
        position: [2.4, 0, 5.25],
        rotation: [0, 0, 0],
      },
      {
        templateId: "table4",
        position: [-0.95, 0, 3.75],
        rotation: [0, Math.PI / 2, 0],
      },
      {
        templateId: "table3",
        position: [-2.45, 0, 5.15],
        rotation: [0, Math.PI / 2, 0],
      },
      {
        templateId: "mirror",
        position: [-3.9, 1.44, 6.0],
        rotation: [0, Math.PI * 0.88, 0.03],
      },
      {
        templateId: "counterWide",
        position: [-1.2, 0, -3.15],
      },
      {
        templateId: "counterSide",
        position: [plan.leftX + 0.4, 0, -2.05],
        rotation: [0, Math.PI / 2, 0],
      },
      {
        templateId: "counterIsland",
        position: [-0.15, 0, -1.65],
        rotation: [0, Math.PI / 2, 0],
      },
      {
        templateId: "kitchenSink",
        position: [3.18, 0, -2.55],
        rotation: [0, -Math.PI / 2, 0],
      },
      {
        templateId: "pastryLine",
        position: [1.28, 0, -3.55],
        rotation: [0, 0, 0],
      },
      {
        templateId: "pendant",
        position: [2.4, 3.55, 3.15],
      },
      {
        templateId: "pendant",
        position: [2.4, 3.55, 5.25],
      },
      {
        templateId: "pendant",
        position: [-0.95, 3.55, 3.75],
      },
      {
        templateId: "pendant",
        position: [-2.45, 3.55, 5.15],
      },
    ];
  }

  function getDefaultLayoutSpecs() {
    return [...getDefaultStructuralSpecs(), ...getDefaultFurnishingSpecs()];
  }

  function getNthSpecByTemplate(specs, templateId, occurrence = 0) {
    let currentIndex = 0;
    for (const spec of specs) {
      if (spec.templateId !== templateId) {
        continue;
      }
      if (currentIndex === occurrence) {
        return spec;
      }
      currentIndex += 1;
    }
    return null;
  }

  function setSpecTransform(spec, position, rotation = null, scale = null) {
    if (!spec) {
      return;
    }
    spec.position = [...position];
    if (rotation) {
      spec.rotation = [...rotation];
    }
    if (scale) {
      spec.scale = [...scale];
    }
  }

  function createLoungeDesignSpecs() {
    const furnishing = cloneData(getDefaultFurnishingSpecs()) ?? [];

    setSpecTransform(getNthSpecByTemplate(furnishing, "bench"), [4.02, 0, 5.05], [0, Math.PI, 0]);
    setSpecTransform(getNthSpecByTemplate(furnishing, "table4"), [1.95, 0, 3.45], [0, 0, 0]);
    setSpecTransform(getNthSpecByTemplate(furnishing, "table3"), [2.1, 0, 5.55], [0, 0, 0]);
    setSpecTransform(getNthSpecByTemplate(furnishing, "table4", 1), [-1.75, 0, 3.35], [0, Math.PI / 2, 0]);
    setSpecTransform(getNthSpecByTemplate(furnishing, "table3", 1), [-2.95, 0, 5.25], [0, Math.PI / 2, 0]);

    setSpecTransform(getNthSpecByTemplate(furnishing, "pendant"), [1.95, 3.55, 3.45]);
    setSpecTransform(getNthSpecByTemplate(furnishing, "pendant", 1), [2.1, 3.55, 5.55]);
    setSpecTransform(getNthSpecByTemplate(furnishing, "pendant", 2), [-1.75, 3.55, 3.35]);
    setSpecTransform(getNthSpecByTemplate(furnishing, "pendant", 3), [-2.95, 3.55, 5.25]);

    return [...getDefaultStructuralSpecs(), ...furnishing];
  }

  function createFamilyDesignSpecs() {
    const furnishing = cloneData(getDefaultFurnishingSpecs()) ?? [];

    setSpecTransform(getNthSpecByTemplate(furnishing, "bench"), [4.02, 0, 4.85], [0, Math.PI, 0]);
    setSpecTransform(getNthSpecByTemplate(furnishing, "table4"), [1.55, 0, 3.4], [0, 0, 0]);
    setSpecTransform(getNthSpecByTemplate(furnishing, "table3"), [1.55, 0, 5.3], [0, 0, 0]);
    setSpecTransform(getNthSpecByTemplate(furnishing, "table4", 1), [-1.55, 0, 3.4], [0, 0, 0]);
    setSpecTransform(getNthSpecByTemplate(furnishing, "table3", 1), [-1.55, 0, 5.3], [0, 0, 0]);

    setSpecTransform(getNthSpecByTemplate(furnishing, "pendant"), [1.55, 3.55, 3.4]);
    setSpecTransform(getNthSpecByTemplate(furnishing, "pendant", 1), [1.55, 3.55, 5.3]);
    setSpecTransform(getNthSpecByTemplate(furnishing, "pendant", 2), [-1.55, 3.55, 3.4]);
    setSpecTransform(getNthSpecByTemplate(furnishing, "pendant", 3), [-1.55, 3.55, 5.3]);

    return [...getDefaultStructuralSpecs(), ...furnishing];
  }

  const designPresets = [
    {
      id: "signature",
      label: "Signature",
      view: "entrance",
      createLayout: () => getDefaultLayoutSpecs(),
    },
    {
      id: "lounge",
      label: "Lounge",
      view: "marmit",
      createLayout: () => createLoungeDesignSpecs(),
    },
    {
      id: "family",
      label: "Family",
      view: "plan",
      createLayout: () => createFamilyDesignSpecs(),
    },
  ];

  function getDesignPreset(designId) {
    return designPresets.find((preset) => preset.id === designId) ?? designPresets[0];
  }

  function persistSelectedDesign(designId) {
    try {
      window.localStorage.setItem(designSelectionStorageKey, designId);
    } catch (error) {
      console.warn(error);
    }
  }

  function getStoredDesignSelection() {
    try {
      const stored = window.localStorage.getItem(designSelectionStorageKey);
      if (stored === importedDesignId) {
        return stored;
      }
      return designPresets.some((preset) => preset.id === stored) ? stored : designPresets[0].id;
    } catch (error) {
      console.warn(error);
      return designPresets[0].id;
    }
  }

  function syncDesignSelection(designId) {
    if (!designSelect) {
      return;
    }
    designSelect.value = designId;
  }

  function populateDesignCatalog() {
    designPresets.forEach((preset) => {
      const option = document.createElement("option");
      option.value = preset.id;
      option.textContent = preset.label;
      designSelect.appendChild(option);
    });

    const importedOption = document.createElement("option");
    importedOption.value = importedDesignId;
    importedOption.textContent = "Imported JSON";
    designSelect.appendChild(importedOption);
  }

  function loadSelectedDesignPreset() {
    const selectedDesignId = designSelect.value;
    if (selectedDesignId === importedDesignId) {
      designFileInput.click();
      return;
    }

    const preset = getDesignPreset(selectedDesignId);
    applyLayout(preset.createLayout(), true);
    persistSelectedDesign(preset.id);
    syncDesignSelection(preset.id);
    if (preset.view) {
      applyViewPreset(preset.view);
    }
    setStatus(`${preset.label} design loaded.`);
  }

  function getDefaultSconceSpecs() {
    return getDefaultFurnishingSpecs().filter((item) => item.templateId === "sconce");
  }

  function getDefaultFloorSpecs() {
    return getDefaultStructuralSpecs().filter((item) => item.templateId === "floorSurface");
  }

  function getDefaultFacadeGlazingSpecs() {
    return getDefaultStructuralSpecs().filter(
      (item) => item.templateId === "facadeWindow" || item.templateId === "facadeDoor"
    );
  }

  function getDefaultPlanterSpecs() {
    return getDefaultFurnishingSpecs().filter((item) => item.templateId === "windowPlanter");
  }

  function getDefaultKitchenEquipmentSpecs() {
    return getDefaultFurnishingSpecs().filter(
      (item) => item.templateId === "kitchenSink" || item.templateId === "pastryLine"
    );
  }

  function isDeprecatedBlackFixture(item) {
    if (item?.templateId !== "boxFixture") {
      return false;
    }

    const options = item.options ?? {};
    const width = options.width ?? 0;
    const height = options.height ?? 0;
    const depth = options.depth ?? 0;
    const baseY = options.baseY ?? 0;
    const materialId = options.materialId ?? "";

    if (materialId !== "darkWood") {
      return false;
    }

    const isCeilingSlat =
      Math.abs(height - 0.12) < 0.0001 &&
      Math.abs(depth - 0.16) < 0.0001 &&
      Math.abs(baseY - 4.62) < 0.0001 &&
      (Math.abs(width - 8.95) < 0.0001 || Math.abs(width - 7.2) < 0.0001);

    const isRightBeam =
      Math.abs(width - 0.24) < 0.0001 &&
      Math.abs(height - 0.22) < 0.0001 &&
      Math.abs(depth - (plan.hallFrontZ - plan.backZ + 0.12)) < 0.0001 &&
      Math.abs(baseY - 4.45) < 0.0001;

    return isCeilingSlat || isRightBeam;
  }

  function sanitizeLayoutItems(items) {
    if (!Array.isArray(items)) {
      return [];
    }
    return items.filter((item) => !isDeprecatedBlackFixture(item));
  }

  function restoreMissingSconces(items, version = 0) {
    if (version >= 5 || items.some((item) => item.templateId === "sconce")) {
      return items;
    }
    return [...items, ...getDefaultSconceSpecs()];
  }

  function restoreMissingFloor(items, version = 0) {
    if (version >= 6 || items.some((item) => item.templateId === "floorSurface")) {
      return items;
    }
    return [...items, ...getDefaultFloorSpecs()];
  }

  function restoreMissingFacadeGlazing(items, version = 0) {
    const hasWindow = items.some((item) => item.templateId === "facadeWindow");
    const hasDoor = items.some((item) => item.templateId === "facadeDoor");
    if (version >= 7 || (hasWindow && hasDoor)) {
      return items;
    }
    return [...items, ...getDefaultFacadeGlazingSpecs().filter((item) => {
      if (item.templateId === "facadeWindow") {
        return !hasWindow;
      }
      if (item.templateId === "facadeDoor") {
        return !hasDoor;
      }
      return false;
    })];
  }

  function restoreMissingPlanters(items, version = 0) {
    if (version >= 8 || items.some((item) => item.templateId === "windowPlanter")) {
      return items;
    }
    return [...items, ...getDefaultPlanterSpecs()];
  }

  function restoreMissingKitchenEquipment(items, version = 0) {
    const hasSink = items.some((item) => item.templateId === "kitchenSink");
    const hasPastryLine = items.some((item) => item.templateId === "pastryLine");
    if (version >= 9 || (hasSink && hasPastryLine)) {
      return items;
    }
    return [
      ...items,
      ...getDefaultKitchenEquipmentSpecs().filter((item) => {
        if (item.templateId === "kitchenSink") {
          return !hasSink;
        }
        if (item.templateId === "pastryLine") {
          return !hasPastryLine;
        }
        return false;
      }),
    ];
  }

  function normalizeLayoutItems(items, version = 0) {
    const sanitizedItems = sanitizeLayoutItems(items);
    const structuralItems =
      version >= layoutVersion || sanitizedItems.some((item) => layoutTemplates[item.templateId]?.structural)
        ? sanitizedItems
        : [...getDefaultStructuralSpecs(), ...sanitizedItems];
    const completedItems = restoreMissingKitchenEquipment(
      restoreMissingPlanters(
        restoreMissingFacadeGlazing(
          restoreMissingFloor(restoreMissingSconces(structuralItems, version), version),
          version
        ),
        version
      ),
      version
    );
    if (version >= layoutVersion || completedItems.some((item) => layoutTemplates[item.templateId]?.structural)) {
      return completedItems;
    }
    return [...getDefaultStructuralSpecs(), ...completedItems];
  }

  function applyLayout(layoutSpecs, persist = true) {
    clearLayoutItems();
    layoutSpecs.forEach((specification) => {
      createLayoutItem(specification);
    });
    if (persist) {
      persistLayoutToStorage();
    }
    updateSelectionText();
    syncEditorButtons();
  }

  function loadLayoutFromStorage() {
    try {
      const raw = window.localStorage.getItem(layoutStorageKey);
      if (!raw) {
        return false;
      }
      const parsed = JSON.parse(raw);
      if (!parsed?.items || !Array.isArray(parsed.items)) {
        return false;
      }
      applyLayout(normalizeLayoutItems(parsed.items, parsed.version ?? 0), false);
      setStatus("Design restored.");
      return true;
    } catch (error) {
      console.warn(error);
      return false;
    }
  }

  function setEditorMode(mode) {
    editorMode = mode;
    updateTransformHandles();
    syncEditorButtons();
  }

  function populateCatalog() {
    const catalogOrder = [
      "wall",
      "lowWall",
      "facadeWindow",
      "facadeDoor",
      "raisedSign",
      "marmit",
      "table4",
      "table3",
      "bench",
      "mirror",
      "counterWide",
      "counterSide",
      "counterIsland",
      "kitchenSink",
      "pastryLine",
      "windowPlanter",
      "cloudChandelier",
      "pendant",
      "menuScroll",
      "sconce",
      "outletSingle",
      "outletDouble",
      "tagline",
    ];
    catalogOrder.forEach((templateId) => {
      if (layoutTemplates[templateId]?.catalog === false) {
        return;
      }
      const option = document.createElement("option");
      option.value = templateId;
      option.textContent = layoutTemplates[templateId].label;
      catalogSelect.appendChild(option);
    });
  }

  function offsetPosition(position, count) {
    const next = [...position];
    next[0] += (count % 3) * 0.4;
    next[2] += Math.floor(count / 3) * 0.35;
    return next;
  }

  function addItemFromCatalog() {
    const templateId = catalogSelect.value;
    const template = layoutTemplates[templateId];
    if (!template) {
      return;
    }

    const sameTypeCount = [...layoutItems.values()].filter((item) => item.templateId === templateId).length;
    const selected = getSelectedLayoutItem();
    const position =
      selected && selected.templateId === templateId
        ? [
            selected.wrapper.position.x + 0.45,
            selected.wrapper.position.y,
            selected.wrapper.position.z + 0.35,
          ]
        : offsetPosition(template.defaultPosition, sameTypeCount);
    const created = createLayoutItem({
      templateId,
      position,
      rotation: cloneData(template.defaultRotation),
      scale: cloneData(template.defaultScale),
      options: cloneData(template.defaultOptions),
    });

    if (created) {
      persistLayoutToStorage();
      selectLayoutItem(created.id);
      setStatus(`${created.label} added.`);
    }
  }

  function duplicateSelectedItem() {
    const selected = getSelectedLayoutItem();
    if (!selected) {
      return;
    }

    const duplicated = createLayoutItem({
      ...serializeLayoutItem(selected),
      position: [
        selected.wrapper.position.x + 0.45,
        selected.wrapper.position.y,
        selected.wrapper.position.z + 0.35,
      ],
    });
    if (duplicated) {
      persistLayoutToStorage();
      selectLayoutItem(duplicated.id);
      setStatus(`${duplicated.label} duplicated.`);
    }
  }

  function rotateSelectedQuarterTurn() {
    const selected = getSelectedLayoutItem();
    if (!selected) {
      return;
    }

    selected.wrapper.rotation.y += Math.PI / 2;
    applyLayoutConstraints(selected);
    refreshSelectionHelper();
    updateSelectionText();
    persistLayoutToStorage();
    setStatus(`${selected.label} rotated 90deg.`);
  }

  function deleteSelectedItem() {
    const selected = getSelectedLayoutItem();
    if (!selected) {
      return;
    }

    layoutRoot.remove(selected.wrapper);
    layoutItems.delete(selected.id);
    clearSelection();
    persistLayoutToStorage();
    setStatus(`${selected.label} removed.`);
  }

  function saveLayoutFile() {
    downloadBlob(
      "pyrizhky-layout.json",
      new Blob(
        [
          JSON.stringify(
            {
              version: layoutVersion,
              items: serializeLayout(),
            },
            null,
            2
          ),
        ],
        { type: "application/json;charset=utf-8" }
      )
    );
    setStatus("Layout file saved.");
  }

  function loadLayoutFile(file) {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed?.items || !Array.isArray(parsed.items)) {
          throw new Error("Invalid layout file.");
        }
        applyLayout(normalizeLayoutItems(parsed.items, parsed.version ?? 0), true);
        persistSelectedDesign(importedDesignId);
        syncDesignSelection(importedDesignId);
        setStatus("Design file loaded.");
      } catch (error) {
        console.error(error);
        setStatus("Design file failed.", "error");
      }
    };
    reader.readAsText(file);
  }

  function resetLayout() {
    window.localStorage.removeItem(layoutStorageKey);
    persistSelectedDesign(designPresets[0].id);
    applyLayout(getDefaultLayoutSpecs(), true);
    syncDesignSelection(designPresets[0].id);
    setStatus("Design reset.");
  }

  function findLayoutItemId(object) {
    let current = object;
    while (current && current !== scene) {
      if (current.userData?.layoutItemId) {
        return current.userData.layoutItemId;
      }
      current = current.parent;
    }
    return null;
  }

  function pickLayoutItem(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const intersections = raycaster.intersectObjects(layoutRoot.children, true);
    const picked = intersections.find((hit) => findLayoutItemId(hit.object));
    if (!picked) {
      clearSelection();
      return;
    }

    selectLayoutItem(findLayoutItemId(picked.object));
  }

  function addCafe() {
    addRoom();

    if (loadLayoutFromStorage()) {
      return;
    }
    const initialDesignId = getStoredDesignSelection();
    const initialPreset = getDesignPreset(initialDesignId);
    applyLayout(initialPreset.createLayout(), true);
    persistSelectedDesign(initialPreset.id);
  }

  addAtmosphere();
  addLighting();
  addCafe();
  const viewPresets = {
    entrance: {
      position: [0.4, 7.4, 16.8],
      target: [0.0, 1.55, 2.65],
    },
    marmit: {
      position: [0.35, 3.25, 9.0],
      target: [0.1, 1.55, 1.45],
    },
    kitchen: {
      position: [-3.55, 2.95, -4.9],
      target: [-0.85, 1.55, -1.35],
    },
    plan: {
      position: [0.1, 15.6, 6.0],
      target: [0.0, 0.0, 1.8],
    },
  };

  function setStatus(message, tone = "") {
    statusNode.textContent = message;
    if (tone) {
      statusNode.dataset.tone = tone;
    } else {
      delete statusNode.dataset.tone;
    }
  }

  function withEditorOverlaysHidden(run) {
    const helperParent = selectionHelper?.parent ?? null;
    const gizmoParent = transformControls.parent ?? null;
    const gizmoWasVisible = transformControls.visible;

    if (selectionHelper && helperParent) {
      helperParent.remove(selectionHelper);
    }
    if (gizmoParent) {
      gizmoParent.remove(transformControls);
    }

    const restore = () => {
      if (gizmoParent && !transformControls.parent) {
        gizmoParent.add(transformControls);
      }
      if (selectionHelper && helperParent && !selectionHelper.parent) {
        helperParent.add(selectionHelper);
      }
      transformControls.visible = gizmoWasVisible;
    };

    return Promise.resolve()
      .then(run)
      .finally(restore);
  }

  function setExportButtonsDisabled(disabled) {
    exportGlbButton.disabled = disabled;
    exportObjButton.disabled = disabled;
  }

  function markActiveView(viewName) {
    viewButtons.forEach((button) => {
      button.classList.toggle("hud__button--active", button.dataset.view === viewName);
    });
  }

  function applyViewPreset(viewName) {
    const preset = viewPresets[viewName];
    if (!preset) {
      return;
    }

    camera.position.set(...preset.position);
    controls.target.set(...preset.target);
    controls.update();
    markActiveView(viewName);
  }

  function downloadBlob(filename, blob) {
    const link = document.createElement("a");
    const objectUrl = URL.createObjectURL(blob);
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  function exportGlb() {
    return withEditorOverlaysHidden(
      () =>
        new Promise((resolve, reject) => {
          const exporter = new GLTFExporter();
          exporter.parse(
            scene,
            (result) => {
              if (!(result instanceof ArrayBuffer)) {
                reject(new Error("GLB exporter returned unexpected payload."));
                return;
              }
              downloadBlob(
                "pyrizhky-ua-interior.glb",
                new Blob([result], { type: "model/gltf-binary" })
              );
              resolve();
            },
            (error) => reject(error),
            {
              binary: true,
              onlyVisible: true,
              maxTextureSize: 2048,
            }
          );
        })
    );
  }

  function exportObj() {
    return withEditorOverlaysHidden(
      () =>
        new Promise((resolve, reject) => {
          try {
            const exporter = new OBJExporter();
            const result = exporter.parse(scene);
            downloadBlob(
              "pyrizhky-ua-interior.obj",
              new Blob([result], { type: "text/plain;charset=utf-8" })
            );
            resolve();
          } catch (error) {
            reject(error);
          }
        })
    );
  }

  async function handleExport(format) {
    const label = format.toUpperCase();
    setExportButtonsDisabled(true);
    setStatus(`Exporting ${label}...`);

    try {
      if (format === "glb") {
        await exportGlb();
      } else {
        await exportObj();
      }
      setStatus(`${label} saved.`);
    } catch (error) {
      console.error(error);
      setStatus(`${label} export failed.`, "error");
    } finally {
      setExportButtonsDisabled(false);
    }
  }

  if (constructorEnabled) {
    transformControls.addEventListener("dragging-changed", (event) => {
      transformDragActive = event.value;
      controls.enabled = !event.value;
      if (!event.value) {
        const selected = getSelectedLayoutItem();
        if (selected) {
          applyLayoutConstraints(selected);
          refreshSelectionHelper();
          updateSelectionText();
          persistLayoutToStorage();
        }
      }
    });

    transformControls.addEventListener("objectChange", () => {
      const selected = getSelectedLayoutItem();
      if (!selected) {
        return;
      }
      applyLayoutConstraints(selected);
      updateSelectionText();
      if (selectionHelper) {
        selectionHelper.update();
      }
    });

    renderer.domElement.addEventListener("pointerdown", (event) => {
      pointerDown.set(event.clientX, event.clientY);
    });

    renderer.domElement.addEventListener("pointerup", (event) => {
      if (event.button !== 0 || transformDragActive) {
        return;
      }
      if (Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 5) {
        return;
      }
      pickLayoutItem(event);
    });
  }

  viewButtons.forEach((button) => {
    button.addEventListener("click", () => applyViewPreset(button.dataset.view));
  });
  exportGlbButton.addEventListener("click", () => handleExport("glb"));
  exportObjButton.addEventListener("click", () => handleExport("obj"));
  loadDesignButton.addEventListener("click", loadSelectedDesignPreset);
  importDesignButton.addEventListener("click", () => designFileInput.click());
  designFileInput.addEventListener("change", () => {
    loadLayoutFile(designFileInput.files?.[0]);
    designFileInput.value = "";
  });
  if (constructorEnabled) {
    addItemButton.addEventListener("click", addItemFromCatalog);
    moveModeButton.addEventListener("click", () => setEditorMode("translate"));
    rotateModeButton.addEventListener("click", () => setEditorMode("rotate"));
    rotateQuarterButton.addEventListener("click", rotateSelectedQuarterTurn);
    duplicateItemButton.addEventListener("click", duplicateSelectedItem);
    deleteItemButton.addEventListener("click", deleteSelectedItem);
    saveLayoutButton.addEventListener("click", saveLayoutFile);
    loadLayoutButton.addEventListener("click", () => layoutFileInput.click());
    resetLayoutButton.addEventListener("click", resetLayout);
    layoutFileInput.addEventListener("change", () => {
      loadLayoutFile(layoutFileInput.files?.[0]);
      layoutFileInput.value = "";
    });
    dimensionInputs.forEach((input, index) => {
      input.addEventListener("change", () => applyDimensionChange(index, input.value));
      input.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") {
          return;
        }
        event.preventDefault();
        applyDimensionChange(index, input.value);
        input.blur();
      });
    });
    populateCatalog();
    catalogSelect.value = "wall";
    syncEditorButtons();
    updateDimensionInputs();
  }
  populateDesignCatalog();
  syncDesignSelection(getStoredDesignSelection());

  applyViewPreset("entrance");

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  window.addEventListener("resize", onResize);

  const clock = new THREE.Clock();
  let sceneReady = false;

  function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    scene.traverse((object) => {
      if (object.geometry && object.geometry.type === "SphereGeometry" && object.material === materials.warmBulb) {
        object.material.emissiveIntensity = 1.4 + Math.sin(time * 2.2) * 0.05;
      }
    });
    if (selectionHelper) {
      selectionHelper.update();
    }
    controls.update();
    renderer.render(scene, camera);

    if (!sceneReady) {
      sceneReady = true;
      window.__sceneReady = true;
      window.__interiorDebug = {
        scene,
        camera,
        controls,
        transformControls,
        renderer,
        applyViewPreset,
        exportGlb,
        exportObj,
      };
      if (constructorEnabled) {
        Object.assign(window.__interiorDebug, {
          serializeLayout,
          applyLayout,
          selectLayoutItem,
        });
      }
      setStatus("Ready.");
    }
  }

  animate();
})();
