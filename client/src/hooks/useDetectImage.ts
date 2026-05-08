import useUploadImage from "./useUploadImage";
import { detectImage } from "../services/api/detection";
import type { DetectImageResponse } from "../types/detection";
import { AxiosError } from "axios";
import React, { useEffect, useState } from "react";

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
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [detectResult, setDetectResult] = useState<DetectImageResponse | null>(
    null
  );
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

  return {
    pictureRef,
    selectedImageFile,
    previewImageUrl,
    detectedImageUrl,
    imageNaturalSize,
    detectResult,
    pictureError,
    detectError,
    isDetecting,
    detectCar,
    detectPlate,
    preprocessOcr,
    handleCheckbox,
    handleImageFileChange,
    handleLoadImage,
    handleSubmit,
  };
}

export default useDetectImage;
