import { AxiosError } from "axios";
import { useState } from "react";
import { detectVideo } from "../services/api/detection";
import type { DetectVideoResponse, LineOrientation } from "../types/detection";
import useUploadVideo from "./useUploadVideo";

function useDetectVideo() {
  const {
    videoRef,
    selectedVideoFile,
    previewVideoUrl,
    videoError,
    handleVideoFileChange: useUploadVideoHandleChange,
  } = useUploadVideo();
  const [detectCar, setDetectCar] = useState(true);
  const [preprocessOcr, setPreprocessOcr] = useState(true);
  const [linePosition, setLinePosition] = useState(0.5);
  const [lineOrientation, setLineOrientation] =
    useState<LineOrientation>("horizontal");
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [detectResult, setDetectResult] = useState<DetectVideoResponse | null>(
    null
  );

  const handleCheckbox = {
    detectCar: (value: boolean) => setDetectCar(value),
    preprocessOcr: (value: boolean) => setPreprocessOcr(value),
  };

  const handleVideoFileChange: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    setDetectResult(null);
    setDetectError(null);
    useUploadVideoHandleChange(event);
  };

  const handleLineOrientationChange = (value: LineOrientation) => {
    setLineOrientation(value);
  };

  const handleLinePositionChange: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    setLinePosition(Number(event.target.value));
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (
    event
  ) => {
    event.preventDefault();

    if (!selectedVideoFile) {
      setDetectError("Please upload an video first.");
      return;
    }

    try {
      setIsDetecting(true);
      setDetectError(null);
      const videoFileForDetection = selectedVideoFile;

      const response = await detectVideo({
        video: videoFileForDetection,
        lineOrientation,
        point: linePosition,
        detectCar,
        preprocessOcr,
      });

      setDetectResult(response);
    } catch (error) {
      const fallbackMessage =
        "Unable to detect video right now. Please try again.";

      // Get error message from response data if available
      if (error instanceof Error) {
        if (error instanceof AxiosError) {
          setDetectError(error.response?.data?.detail || fallbackMessage);
        } else {
          setDetectError(error.message || fallbackMessage);
        }
      }

      setDetectResult(null);
    } finally {
      setIsDetecting(false);
    }
  };

  return {
    videoRef,
    selectedVideoFile,
    previewVideoUrl,
    detectResult,
    videoError,
    detectError,
    isDetecting,
    detectCar,
    preprocessOcr,
    linePosition,
    lineOrientation,
    handleCheckbox,
    handleVideoFileChange,
    handleLineOrientationChange,
    handleLinePositionChange,
    handleSubmit,
  };
}

export default useDetectVideo;
