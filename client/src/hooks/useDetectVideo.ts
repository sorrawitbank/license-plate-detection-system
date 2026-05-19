import { AxiosError } from "axios";
import { useState } from "react";
import { detectVideo } from "../services/api/detection";
import { createLogFromVideo } from "../services/api/log";
import type { DetectVideoResponse, LineOrientation } from "../types/detection";
import type { CreateLogFromVideoResponse, LogEventType } from "../types/log";
import { directionToLogEventType } from "../utils";
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
  const [lineOrientationDetect, setLineOrientationDetect] =
    useState<LineOrientation | null>(null);
  const [oneEventType, setOneEventType] = useState<LogEventType>("IN");
  const [hasDetect, setHasDetect] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [detectResult, setDetectResult] = useState<DetectVideoResponse | null>(
    null
  );
  const [createLogResult, setCreateLogResult] =
    useState<CreateLogFromVideoResponse | null>(null);

  const handleCheckbox = {
    detectCar: (value: boolean) => setDetectCar(value),
    preprocessOcr: (value: boolean) => setPreprocessOcr(value),
  };

  const handleVideoFileChange: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    setDetectResult(null);
    setDetectError(null);
    setCreateError(null);
    setCreateLogResult(null);
    setHasDetect(false);
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

  const handleOneEventTypeChange = (value: LogEventType) => {
    setOneEventType(value);
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
      setCreateError(null);
      setCreateLogResult(null);
      setHasDetect(false);
      const videoFileForDetection = selectedVideoFile;

      const response = await detectVideo({
        video: videoFileForDetection,
        lineOrientation,
        point: linePosition,
        detectCar,
        preprocessOcr,
      });

      setLineOrientationDetect(lineOrientation);
      setDetectResult(response);
      setHasDetect(false);
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

  const handleCreateLogSubmit: React.FormEventHandler<HTMLFormElement> = async (
    event
  ) => {
    event.preventDefault();

    if (!detectResult || detectResult.results.length === 0) {
      setCreateError("No detection results to save.");
      return;
    }

    try {
      setIsLoading(true);
      setCreateError(null);

      const response = await createLogFromVideo({
        results: detectResult.results.map((item) => ({
          trackId: item.trackId,
          frameIndex: item.frameIndex,
          timestampSec: item.timestampSec,
          eventType: directionToLogEventType(item.direction, oneEventType),
          ocr: item.ocr,
          province: item.province
            ? {
                index: item.province.index,
                provinceId: item.province.provinceId,
              }
            : null,
          plate: item.plate,
        })),
      });

      setCreateLogResult(response);
      setHasDetect(true);
    } catch (error) {
      const fallbackMessage =
        "Unable to create logs right now. Please try again.";

      if (error instanceof AxiosError) {
        setCreateError(error.response?.data?.detail || fallbackMessage);
      } else if (error instanceof Error) {
        setCreateError(error.message || fallbackMessage);
      } else {
        setCreateError(fallbackMessage);
      }

      setCreateLogResult(null);
      setHasDetect(false);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    videoRef,
    selectedVideoFile,
    previewVideoUrl,
    detectResult,
    createLogResult,
    videoError,
    detectError,
    createError,
    hasDetect,
    isDetecting,
    isLoading,
    detectCar,
    preprocessOcr,
    linePosition,
    lineOrientation,
    lineOrientationDetect,
    oneEventType,
    handleCheckbox,
    handleVideoFileChange,
    handleLineOrientationChange,
    handleLinePositionChange,
    handleOneEventTypeChange,
    handleSubmit,
    handleCreateLogSubmit,
  };
}

export default useDetectVideo;
