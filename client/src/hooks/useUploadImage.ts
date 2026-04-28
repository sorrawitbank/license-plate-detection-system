import { useEffect, useRef, useState } from "react";

function useUploadImage() {
  const [pictureError, setPictureError] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const pictureRef = useRef<HTMLInputElement>(document.createElement("input"));

  useEffect(() => {
    if (!selectedImageFile) {
      setPreviewImageUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedImageFile);
    setPreviewImageUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedImageFile]);

  const handleImageFileChange: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      setPictureError(null);
      setSelectedImageFile(null);
      return;
    }

    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    const maxFileSizeInBytes = 5 * 1024 * 1024;

    if (!allowedMimeTypes.includes(selectedFile.type)) {
      setPictureError("Only JPG, JPEG, PNG, and WEBP files are allowed.");
      setSelectedImageFile(null);
      return;
    }

    if (selectedFile.size > maxFileSizeInBytes) {
      setPictureError("Image size must be 5 MB or smaller.");
      setSelectedImageFile(null);
      return;
    }

    setPictureError(null);
    setSelectedImageFile(selectedFile);
  };

  return {
    pictureRef,
    pictureError,
    selectedImageFile,
    previewImageUrl,
    setPictureError,
    handleImageFileChange,
  };
}

export default useUploadImage;
