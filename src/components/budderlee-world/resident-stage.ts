// Browser-only turntable for one 3D resident at a time. Imported lazily by
// residents-3d.tsx so three.js stays out of every other page's bundle.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

export type ResidentStage = {
  show(url: string): Promise<void>;
  preload(url: string): void;
  setSpinning(on: boolean): void;
  dispose(): void;
};

// Every resident stands this tall in scene units, whatever the model's own scale.
const FIGURE_HEIGHT = 1.9;

export function createResidentStage(canvas: HTMLCanvasElement, reducedMotion: boolean): ResidentStage {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = environment;
  scene.environmentIntensity = 0.55;
  scene.add(new THREE.HemisphereLight(0xfff4dc, 0x8a7a55, 0.9));
  const sun = new THREE.DirectionalLight(0xffe9c8, 1.6);
  sun.position.set(2.5, 5, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: 0.5, far: 20 });
  sun.shadow.radius = 6;
  scene.add(sun);

  const ground = new THREE.Mesh(new THREE.CircleGeometry(1.4, 64), new THREE.ShadowMaterial({ opacity: 0.16 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
  camera.position.set(0.9, 1.25, 4.2);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, FIGURE_HEIGHT / 2, 0);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 1.6;
  controls.maxDistance = 7;
  controls.maxPolarAngle = Math.PI * 0.55;
  controls.autoRotate = !reducedMotion;
  controls.autoRotateSpeed = 1.2;

  const holder = new THREE.Group();
  scene.add(holder);

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const cache = new Map<string, Promise<THREE.Object3D>>();
  const load = (url: string) => {
    if (!cache.has(url)) {
      cache.set(
        url,
        loader.loadAsync(url).then((gltf) => {
          // The models face +X; turn them to face the camera, stand them on
          // the ground and scale every resident to the same height.
          const inner = gltf.scene;
          inner.rotation.y = -Math.PI / 2;
          const figure = new THREE.Group();
          figure.add(inner);
          const box = new THREE.Box3().setFromObject(figure);
          const centre = box.getCenter(new THREE.Vector3());
          inner.position.set(-centre.x, -box.min.y, -centre.z);
          figure.scale.setScalar(FIGURE_HEIGHT / (box.max.y - box.min.y));
          figure.traverse((o) => {
            if ((o as THREE.Mesh).isMesh) {
              o.castShadow = true;
              o.receiveShadow = true;
            }
          });
          return figure;
        }),
      );
    }
    return cache.get(url)!;
  };

  let latest = "";
  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
  });

  return {
    async show(url) {
      latest = url;
      const figure = await load(url);
      if (latest !== url) return; // the visitor has already moved on
      holder.clear();
      holder.add(figure);
    },
    preload(url) {
      load(url).catch(() => {});
    },
    setSpinning(on) {
      controls.autoRotate = on;
    },
    dispose() {
      renderer.setAnimationLoop(null);
      observer.disconnect();
      controls.dispose();
      Promise.allSettled([...cache.values()]).then((results) => {
        for (const r of results) {
          if (r.status !== "fulfilled") continue;
          r.value.traverse((o) => {
            const mesh = o as THREE.Mesh;
            if (!mesh.isMesh) return;
            mesh.geometry.dispose();
            for (const m of [mesh.material].flat()) {
              for (const v of Object.values(m)) if (v instanceof THREE.Texture) v.dispose();
              m.dispose();
            }
          });
        }
      });
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
