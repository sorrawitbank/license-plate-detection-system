import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { detectImage } from "../services/api/detection";
import { createLogFromImage } from "../services/api/log";
import type { DetectImageResponse } from "../types/detection";
import type { CreateLogFromImageResponse, LogEventType } from "../types/log";
import useUploadImage from "./useUploadImage";

function useDetectImage() {
  const {
    pictureRef,
    selectedImageFile,
    previewImageUrl,
    pictureError,
    handleImageFileChange: useUploadImageHandleChange,
  } = useUploadImage();
  const [detectCar, setDetectCar] = useState(true);
  const [detectPlate, setDetectPlate] = useState(true);
  const [preprocessOcr, setPreprocessOcr] = useState(true);
  const [eventType, setEventType] = useState<LogEventType>("IN");
  const [hasDetect, setHasDetect] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [detectResult, setDetectResult] = useState<DetectImageResponse | null>(
    null
  );
  const [createLogResult, setCreateLogResult] =
    useState<CreateLogFromImageResponse | null>(null);
  const [detectedImageUrl, setDetectedImageUrl] = useState<string | null>(null);
  const [imageNaturalSize, setImageNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (detectedImageUrl) {
        URL.revokeObjectURL(detectedImageUrl);
      }
    };
  }, [detectedImageUrl]);

  const clearDetectedSnapshot = () => {
    if (detectedImageUrl) {
      URL.revokeObjectURL(detectedImageUrl);
    }
    setDetectedImageUrl(null);
  };

  const handleCheckbox = {
    detectCar: (value: boolean) => setDetectCar(value),
    detectPlate: (value: boolean) => setDetectPlate(value),
    preprocessOcr: (value: boolean) => setPreprocessOcr(value),
  };

  const handleImageFileChange: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    clearDetectedSnapshot();
    setDetectResult(null);
    setDetectError(null);
    setCreateError(null);
    setCreateLogResult(null);
    setHasDetect(false);
    useUploadImageHandleChange(event);
  };

  const handleLoadImage: React.ReactEventHandler<HTMLImageElement> = (
    event
  ) => {
    setImageNaturalSize({
      width: event.currentTarget.naturalWidth,
      height: event.currentTarget.naturalHeight,
    });
  };

  const handleEventTypeChange = (value: LogEventType) => {
    setEventType(value);
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (
    event
  ) => {
    event.preventDefault();

    if (!selectedImageFile) {
      setDetectError("Please upload an image first.");
      return;
    }

    try {
      setIsDetecting(true);
      setDetectError(null);
      setCreateError(null);
      setCreateLogResult(null);
      setHasDetect(false);
      const imageFileForDetection = selectedImageFile;

      const response = await detectImage({
        image: imageFileForDetection,
        detectCar,
        detectPlate,
        preprocessOcr,
      });

      clearDetectedSnapshot();
      setDetectedImageUrl(URL.createObjectURL(imageFileForDetection));
      setDetectResult(response);
    } catch (error) {
      const fallbackMessage =
        "Unable to detect image right now. Please try again.";

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

      const response = await createLogFromImage({
        eventType,
        results: detectResult.results.map((item) => ({
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
    pictureRef,
    selectedImageFile,
    previewImageUrl,
    detectedImageUrl,
    imageNaturalSize,
    detectResult,
    createLogResult,
    pictureError,
    detectError,
    createError,
    hasDetect,
    isDetecting,
    isLoading,
    detectCar,
    detectPlate,
    preprocessOcr,
    eventType,
    handleCheckbox,
    handleImageFileChange,
    handleEventTypeChange,
    handleLoadImage,
    handleSubmit,
    handleCreateLogSubmit,
  };
}

export default useDetectImage;
