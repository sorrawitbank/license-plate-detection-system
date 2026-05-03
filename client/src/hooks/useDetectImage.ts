import useUploadImage from "./useUploadImage";
import { detectImage } from "../services/api/detection";
import type { DetectImageResponse } from "../types/detection";
import { AxiosError } from "axios";
import { useState } from "react";

function useDetectImage() {
  const {
    pictureRef,
    pictureError,
    selectedImageFile,
    previewImageUrl,
    setPictureError,
    handleImageFileChange,
  } = useUploadImage();
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [detectResult, setDetectResult] = useState<DetectImageResponse | null>(
    null
  );

  const handleDetectImage = async ({
    detectCar = true,
    detectPlate = true,
    preprocessOcr = true,
  }: {
    detectCar?: boolean;
    detectPlate?: boolean;
    preprocessOcr?: boolean;
  } = {}) => {
    if (!selectedImageFile) {
      setDetectError("Please upload an image first.");
      return;
    }

    try {
      setIsDetecting(true);
      setDetectError(null);

      const response = await detectImage({
        image: selectedImageFile,
        detectCar,
        detectPlate,
        preprocessOcr,
      });

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
    pictureError,
    selectedImageFile,
    previewImageUrl,
    setPictureError,
    isDetecting,
    detectError,
    detectResult,
    handleImageFileChange,
    handleDetectImage,
  };
}

export default useDetectImage;
