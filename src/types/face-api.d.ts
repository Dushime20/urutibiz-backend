declare module 'face-api.js' {
  export const env: {
    monkeyPatch: (patches: any) => void;
  };
  export function loadSsdMobilenetv1Model(modelPath: string): Promise<any>;
  export function loadTinyFaceDetectorModel(modelPath: string): Promise<any>;
  export function loadFaceLandmarkModel(modelPath: string): Promise<any>;
  export function loadFaceRecognitionModel(modelPath: string): Promise<any>;
  
  interface FaceDetectionChain {
    withFaceLandmarks(): FaceDetectionChain;
    withFaceDescriptor(): Promise<any>;
  }
  
  export function detectSingleFace(input: any, options?: any): FaceDetectionChain;
  export function detectAllFaces(input: any, options?: any): Promise<any[]>;
  export function computeFaceDescriptor(input: any, landmarks?: any): Promise<any>;
  export function euclideanDistance(descriptor1: any, descriptor2: any): number;
  export const nets: {
    ssdMobilenetv1: any;
    tinyFaceDetector: any;
    faceLandmarkNet: any;
    faceLandmark68Net: any;
    faceRecognitionNet: any;
  };
}

