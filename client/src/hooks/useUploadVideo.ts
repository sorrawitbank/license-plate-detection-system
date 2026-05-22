import { useEffect, useRef, useState } from "react";

function useUploadVideo() {
  const [videoError, setVideoError] = useState<string | null>(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLInputElement>(document.createElement("input"));

  useEffect(() => {
    if (!selectedVideoFile) {
      setPreviewVideoUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedVideoFile);
    setPreviewVideoUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedVideoFile]);

  const handleVideoFileChange: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      setVideoError(null);
      setSelectedVideoFile(null);
      return;
    }

    const allowedMimeTypes = [
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-matroska",
      "video/webm",
    ];
    const maxFileSizeInBytes = 200 * 1024 * 1024;

    if (!allowedMimeTypes.includes(selectedFile.type)) {
      setVideoError("Only MP4, MOV, AVI, MKV, and WEBM files are allowed.");
      setSelectedVideoFile(null);
      return;
    }

    if (selectedFile.size > maxFileSizeInBytes) {
      setVideoError("Video size must be 200 MB or smaller.");
      setSelectedVideoFile(null);
      return;
    }

    setVideoError(null);
    setSelectedVideoFile(selectedFile);
  };

  return {
    videoRef,
    selectedVideoFile,
    previewVideoUrl,
    videoError,
    handleVideoFileChange,
  };
}

export default useUploadVideo;
