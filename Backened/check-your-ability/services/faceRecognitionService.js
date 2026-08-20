import path from "path";
import { fileURLToPath } from "url";
// Use the WASM build already included in this project. The default Node build
// requires the optional native @tensorflow/tfjs-node package.
import * as faceapi from "@vladmandic/face-api/dist/face-api.node-wasm.js";
import { Canvas, Image, ImageData, createCanvas, loadImage } from "canvas";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODEL_PATH = path.resolve(__dirname, "../../node_modules/@vladmandic/face-api/model");
let modelsPromise;

const ensureModels = async () => {
  if (!modelsPromise) {
    faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
    modelsPromise = (async () => {
      await faceapi.tf.setBackend("wasm");
      await faceapi.tf.ready();
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_PATH),
        faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH),
        faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH),
      ]);
    })();
  }
  return modelsPromise;
};

const dataUrlToBuffer = (dataUrl) => {
  if (typeof dataUrl !== "string") throw new Error("Camera feed is unavailable. Please keep your camera enabled and visible.");
  const payload = dataUrl.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
  if (!payload || payload === dataUrl) throw new Error("Invalid webcam image format.");
  return Buffer.from(payload, "base64");
};

const imageQuality = async (image) => {
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, image.width, image.height).data;
  let brightness = 0;
  let sharpness = 0;
  const width = image.width;
  for (let y = 1; y < image.height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      const index = (y * width + x) * 4;
      const grey = (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3;
      const right = (pixels[index + 4] + pixels[index + 5] + pixels[index + 6]) / 3;
      const below = (pixels[index + width * 4] + pixels[index + width * 4 + 1] + pixels[index + width * 4 + 2]) / 3;
      brightness += grey;
      sharpness += Math.abs(grey - right) + Math.abs(grey - below);
    }
  }
  const samples = Math.max(1, ((image.height - 2) / 2) * ((width - 2) / 2));
  return { brightness: brightness / samples, sharpness: sharpness / samples };
};

const poseFromLandmarks = (landmarks) => {
  const points = landmarks.positions;
  const nose = points[30];
  const leftEye = points[36];
  const rightEye = points[45];
  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
  const eyeCenterY = (leftEye.y + rightEye.y) / 2;
  const eyeDistance = Math.max(1, Math.abs(rightEye.x - leftEye.x));
  const horizontal = (nose.x - eyeCenterX) / eyeDistance;
  const vertical = (nose.y - eyeCenterY) / eyeDistance;
  if (horizontal > 0.16) return "left";
  if (horizontal < -0.16) return "right";
  if (vertical < 0.48) return "up";
  if (vertical > 0.76) return "down";
  return "front";
};

const eyesClosedFromLandmarks = (landmarks) => {
  const points = landmarks.positions;
  const openness = (eye) => (Math.abs(points[eye[1]].y - points[eye[5]].y) + Math.abs(points[eye[2]].y - points[eye[4]].y)) / (2 * Math.max(1, Math.abs(points[eye[0]].x - points[eye[3]].x)));
  return (openness([36, 37, 38, 39, 40, 41]) + openness([42, 43, 44, 45, 46, 47])) / 2 < 0.18;
};

export const analyzeFaceFrame = async (frame) => {
  await ensureModels();
  const image = await loadImage(dataUrlToBuffer(frame));
  if (image.width < 240 || image.height < 180) throw new Error("Use a clearer, higher-resolution camera frame.");
  const quality = await imageQuality(image);
  if (quality.brightness < 35) throw new Error("The image is too dark. Improve your lighting.");
  // Webcam compression and low-light cameras naturally reduce edge contrast;
  // keep this guard conservative so valid live candidates are not rejected.
  if (quality.sharpness < 2) throw new Error("The image is too blurry. Hold still and try again.");

  const detections = await faceapi
    .detectAllFaces(image, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.55 }))
    .withFaceLandmarks()
    .withFaceDescriptors();
  if (detections.length === 0) throw new Error("No face detected. Center your face in the camera.");
  if (detections.length > 1) throw new Error("Multiple faces detected. Ensure only you are visible.");

  const detection = detections[0];
  const area = detection.detection.box.width * detection.detection.box.height;
  if (area < image.width * image.height * 0.08) throw new Error("Move closer to the camera so your face is clearly visible.");
  return { embedding: Array.from(detection.descriptor), pose: poseFromLandmarks(detection.landmarks), eyesClosed: eyesClosedFromLandmarks(detection.landmarks), quality };
};

export const averageEmbeddings = (embeddings) => {
  const sum = embeddings.reduce((total, embedding) => total.map((value, index) => value + embedding[index]));
  const mean = sum.map((value) => value / embeddings.length);
  const magnitude = Math.sqrt(mean.reduce((total, value) => total + value * value, 0));
  return mean.map((value) => value / magnitude);
};

export const faceDistance = (first, second) => Math.sqrt(first.reduce((sum, value, index) => sum + (value - second[index]) ** 2, 0));
