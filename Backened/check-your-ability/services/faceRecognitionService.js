import path from "path";
import { fileURLToPath } from "url";
import * as faceapi from "@vladmandic/face-api/dist/face-api.node-wasm.js";
import { Canvas, Image, ImageData, createCanvas, loadImage } from "canvas";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODEL_PATH = path.resolve(__dirname, "../../node_modules/@vladmandic/face-api/model");

let modelsPromise = null;
let isModelsLoaded = false;

/**
 * Preload and cache face-api models into memory at server boot.
 */
export const preloadFaceModels = async () => {
  if (isModelsLoaded) return true;
  if (!modelsPromise) {
    const startTime = Date.now();
    console.log("⏳ [FaceAPI] Loading face detection models into memory...");
    faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

    modelsPromise = (async () => {
      await faceapi.tf.setBackend("wasm");
      await faceapi.tf.ready();
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_PATH),
        faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH),
        faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH),
      ]);
      isModelsLoaded = true;
      console.log(`✅ [FaceAPI] Face models loaded & ready for interviews (${Date.now() - startTime}ms)`);
    })();
  }
  return modelsPromise;
};

const ensureModels = preloadFaceModels;

const dataUrlToBuffer = (dataUrl) => {
  if (typeof dataUrl !== "string") {
    throw new Error("Camera feed is unavailable. Keep your camera enabled.");
  }
  const payload = dataUrl.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
  if (!payload || payload === dataUrl) {
    throw new Error("Invalid webcam image format.");
  }
  return Buffer.from(payload, "base64");
};

/**
 * Fast 32x24 thumbnail image quality analysis (under 1ms).
 */
const imageQuality = (image) => {
  const sampleW = 32;
  const sampleH = 24;
  const canvas = createCanvas(sampleW, sampleH);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, sampleW, sampleH);

  const imgData = context.getImageData(0, 0, sampleW, sampleH).data;
  let totalBrightness = 0;
  let totalSharpness = 0;
  const totalPixels = sampleW * sampleH;

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const grey = (imgData[idx] * 299 + imgData[idx + 1] * 587 + imgData[idx + 2] * 114) / 1000;
    totalBrightness += grey;

    if ((i % sampleW) < sampleW - 1) {
      const rightGrey = (imgData[idx + 4] * 299 + imgData[idx + 5] * 587 + imgData[idx + 6] * 114) / 1000;
      totalSharpness += Math.abs(grey - rightGrey);
    }
  }

  return {
    brightness: totalBrightness / totalPixels,
    sharpness: totalSharpness / totalPixels,
  };
};

/**
 * RELATIVE POSE ESTIMATION FROM 68 FACIAL LANDMARKS
 * 
 * Uses normalized facial geometry relative to user's calibrated neutral baseline.
 * Eliminates false "up" classifications on straight frontal faces.
 */
const calculateRelativePose = (landmarks, baseline = null, detectionScore = 0.9) => {
  const pts = landmarks.positions;

  // 1. Key 68-point landmarks
  const noseTip = pts[30];
  const noseBridge = pts[27]; // between eyes
  const chin = pts[8];
  const leftEyeOuter = pts[36];
  const rightEyeOuter = pts[45];
  const leftCheek = pts[0]; // image left contour
  const rightCheek = pts[16]; // image right contour

  const eyeCenterY = (leftEyeOuter.y + rightEyeOuter.y) / 2;
  const eyeCenterX = (leftEyeOuter.x + rightEyeOuter.x) / 2;

  // 2. Raw Yaw (Horizontal) Ratio:
  // In mirrored canvas:
  // Turning to physical right -> nose moves to image right -> distToLeftCheek > distToRightCheek -> rawYaw > 0
  // Turning to physical left  -> nose moves to image left  -> distToLeftCheek < distToRightCheek -> rawYaw < 0
  const distToLeftCheek = Math.max(1, noseTip.x - leftCheek.x);
  const distToRightCheek = Math.max(1, rightCheek.x - noseTip.x);
  const totalCheekWidth = distToLeftCheek + distToRightCheek;
  const rawYaw = (distToLeftCheek - distToRightCheek) / totalCheekWidth;

  // 3. Raw Pitch (Vertical) Ratio:
  // Ratio of bridge-to-nose vs nose-to-chin
  const bridgeToNose = Math.max(1, noseTip.y - noseBridge.y);
  const noseToChin = Math.max(1, chin.y - noseTip.y);
  const rawPitch = bridgeToNose / noseToChin;

  // 4. Baseline Reference (Calibrated Neutral Front)
  const basePitch = baseline?.pitch ?? rawPitch;
  const baseYaw = baseline?.yaw ?? 0;

  const pitchDelta = rawPitch - basePitch;
  const yawDelta = rawYaw - baseYaw;

  let pose = "front";
  let confidence = 85;

  // 5. Pose Classification Relative to Calibrated Baseline:
  // UP: Pitch ratio drops significantly (nose moves closer to bridge, chin moves down)
  // RIGHT (mirrored): yawDelta is positive (> +0.13)
  // LEFT (mirrored): yawDelta is negative (< -0.13)
  // FRONT: near baseline (within tolerance)
  if (baseline && pitchDelta < -0.09) {
    pose = "up";
    const deltaMag = Math.min(0.20, Math.abs(pitchDelta));
    confidence = Math.min(98, Math.round(75 + (deltaMag / 0.20) * 23));
  } else if (yawDelta > 0.13) {
    pose = "right";
    const deltaMag = Math.min(0.25, Math.abs(yawDelta));
    confidence = Math.min(98, Math.round(75 + (deltaMag / 0.25) * 23));
  } else if (yawDelta < -0.13) {
    pose = "left";
    const deltaMag = Math.min(0.25, Math.abs(yawDelta));
    confidence = Math.min(98, Math.round(75 + (deltaMag / 0.25) * 23));
  } else {
    pose = "front";
    const offset = Math.abs(yawDelta) + Math.abs(pitchDelta);
    confidence = Math.min(98, Math.max(72, Math.round(95 - offset * 60)));
  }

  const finalConfidence = Math.min(99, Math.max(50, Math.round(confidence * detectionScore)));

  const diagnostics = {
    eyeCenterX: Math.round(eyeCenterX),
    eyeCenterY: Math.round(eyeCenterY),
    noseX: Math.round(noseTip.x),
    noseY: Math.round(noseTip.y),
    chinX: Math.round(chin.x),
    chinY: Math.round(chin.y),
    bridgeX: Math.round(noseBridge.x),
    bridgeY: Math.round(noseBridge.y),
    bridgeToNose: Math.round(bridgeToNose),
    noseToChin: Math.round(noseToChin),
    rawPitch: Number(rawPitch.toFixed(3)),
    rawYaw: Number(rawYaw.toFixed(3)),
    baselinePitch: baseline ? Number(basePitch.toFixed(3)) : null,
    baselineYaw: baseline ? Number(baseYaw.toFixed(3)) : null,
    pitchDelta: Number(pitchDelta.toFixed(3)),
    yawDelta: Number(yawDelta.toFixed(3)),
    detectedPose: pose,
  };

  return {
    pose,
    confidence: finalConfidence,
    rawPitch: Number(rawPitch.toFixed(3)),
    rawYaw: Number(rawYaw.toFixed(3)),
    pitchDelta: Number(pitchDelta.toFixed(3)),
    yawDelta: Number(yawDelta.toFixed(3)),
    diagnostics,
  };
};

/**
 * Continuous frame analysis endpoint handler.
 * Always returns HTTP 200 with structured JSON data.
 */
export const detectAndAnalyzeFrame = async (frame, baseline = null) => {
  await ensureModels();

  if (!frame || typeof frame !== "string") {
    return {
      success: true,
      faceDetected: false,
      faceCount: 0,
      pose: null,
      confidence: 0,
      message: "No frame received.",
    };
  }

  let buffer;
  let image;
  try {
    buffer = dataUrlToBuffer(frame);
    image = await loadImage(buffer);
  } catch (err) {
    return {
      success: true,
      faceDetected: false,
      faceCount: 0,
      pose: null,
      confidence: 0,
      message: "Corrupted camera frame.",
    };
  }

  const quality = imageQuality(image);
  if (quality.brightness < 20) {
    return {
      success: true,
      faceDetected: false,
      faceCount: 0,
      pose: null,
      confidence: 0,
      message: "Lighting too dark. Please face a light source.",
    };
  }

  const detections = await faceapi
    .detectAllFaces(image, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.30 }))
    .withFaceLandmarks()
    .withFaceDescriptors();

  if (detections.length === 0) {
    return {
      success: true,
      faceDetected: false,
      faceCount: 0,
      pose: null,
      confidence: 0,
      isInsideGuide: false,
      message: "No face detected in camera guide.",
    };
  }

  if (detections.length > 1) {
    return {
      success: true,
      faceDetected: true,
      faceCount: detections.length,
      pose: null,
      confidence: 0,
      isInsideGuide: false,
      message: "Multiple faces detected. Ensure only you are visible.",
    };
  }

  const detection = detections[0];
  const area = detection.detection.box.width * detection.detection.box.height;
  const totalArea = image.width * image.height;
  const areaRatio = area / totalArea;

  if (areaRatio < 0.035) {
    return {
      success: true,
      faceDetected: true,
      faceCount: 1,
      pose: null,
      confidence: 0,
      isInsideGuide: false,
      message: "Please move closer to the camera guide.",
    };
  }

  if (areaRatio > 0.92) {
    return {
      success: true,
      faceDetected: true,
      faceCount: 1,
      pose: null,
      confidence: 0,
      isInsideGuide: false,
      message: "Please move slightly back.",
    };
  }

  const { pose, confidence, rawPitch, rawYaw, pitchDelta, yawDelta, diagnostics } = calculateRelativePose(
    detection.landmarks,
    baseline,
    detection.detection.score
  );

  return {
    success: true,
    faceDetected: true,
    faceCount: 1,
    isInsideGuide: true,
    pose,
    confidence,
    rawPitch,
    rawYaw,
    pitchDelta,
    yawDelta,
    diagnostics,
    areaRatio: Number(areaRatio.toFixed(2)),
    embedding: Array.from(detection.descriptor),
    message: "Face aligned",
  };
};

export const averageEmbeddings = (embeddings) => {
  if (!embeddings || embeddings.length === 0) throw new Error("No embeddings to average.");
  if (embeddings.length === 1) return embeddings[0];

  const sum = embeddings.reduce((total, embedding) =>
    total.map((value, index) => value + embedding[index])
  );
  const mean = sum.map((value) => value / embeddings.length);
  const magnitude = Math.sqrt(mean.reduce((total, value) => total + value * value, 0));
  return mean.map((value) => value / magnitude);
};

export const faceDistance = (first, second) =>
  Math.sqrt(first.reduce((sum, value, index) => sum + (value - second[index]) ** 2, 0));

/**
 * Cross-pose verification to ensure all 3 frames belong to the same candidate
 */
export const isLivenessMatch = async (frames) => {
  if (!Array.isArray(frames) || frames.length < 3) {
    return {
      match: false,
      confidence: 0,
      reason: "Front, Right, and Left pose views are required for enrollment.",
    };
  }

  await ensureModels();
  const analyzedList = [];

  for (let i = 0; i < frames.length; i++) {
    const res = await detectAndAnalyzeFrame(frames[i]);
    if (!res.faceDetected || !res.embedding) {
      return {
        match: false,
        confidence: 0,
        reason: `Photo ${i + 1} analysis failed: ${res.message || "Face not clearly visible."}`,
      };
    }
    analyzedList.push(res);
  }

  const embeddings = analyzedList.map((a) => a.embedding);
  const distances = [];

  for (let i = 0; i < embeddings.length; i++) {
    for (let j = i + 1; j < embeddings.length; j++) {
      const dist = faceDistance(embeddings[i], embeddings[j]);
      distances.push(dist);
    }
  }

  const maxDistance = Math.max(...distances);
  const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;

  const isMatch = maxDistance <= 0.58;
  const confidence = Math.max(0, Math.min(100, Math.round((1 - avgDistance / 0.70) * 100)));

  if (!isMatch) {
    return {
      match: false,
      confidence,
      maxDistance: Number(maxDistance.toFixed(3)),
      reason: "User mismatch found across views. The same person must be present throughout.",
    };
  }

  return {
    match: true,
    confidence,
    avgDistance: Number(avgDistance.toFixed(3)),
    maxDistance: Number(maxDistance.toFixed(3)),
    embedding: averageEmbeddings(embeddings),
  };
};
