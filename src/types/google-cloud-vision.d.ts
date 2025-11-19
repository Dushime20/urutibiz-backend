declare module '@google-cloud/vision' {
  class ImageAnnotatorClient {
    constructor(options?: any);
    faceDetection(request: any): Promise<any>;
    labelDetection(request: any): Promise<any>;
    safeSearchDetection(request: any): Promise<any>;
    textDetection(request: any): Promise<any>;
    webDetection(request: any): Promise<any>;
  }
  
  interface VisionModule {
    ImageAnnotatorClient: typeof ImageAnnotatorClient;
  }
  
  const vision: VisionModule;
  export = vision;
}

