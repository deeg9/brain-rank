interface VideoFrameCallbackMetadata {
  mediaTime: number;
  presentationTime: number;
  expectedDisplayTime: number;
  width: number;
  height: number;
  presentedFrames: number;
}

interface HTMLVideoElement {
  requestVideoFrameCallback?(
    callback: (now: DOMHighResTimeStamp, metadata: VideoFrameCallbackMetadata) => void
  ): number;
  cancelVideoFrameCallback?(handle: number): void;
}
