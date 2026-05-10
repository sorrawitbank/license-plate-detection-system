import { Video } from "lucide-react";
import useDetectVideo from "../../hooks/useDetectVideo";
import { cn, numberToDirection } from "../../utils";
import VideoDetectionResultFrame from "./VideoDetectionResultFrame";

function VideoDetection() {
  const {
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
  } = useDetectVideo();

  const linePositionPercent = `${linePosition * 100}%`;

  return (
    <>
      <section className="flex flex-col gap-6">
        <form onSubmit={handleSubmit}>
          <fieldset
            disabled={isDetecting}
            className="fieldset flex flex-col gap-8 md:flex-row md:gap-12"
          >
            <div className="flex flex-col items-center gap-4 md:items-stretch">
              <input
                type="file"
                ref={videoRef}
                accept=".mp4,.quicktime,.x-msvideo,.x-matroska,.webm"
                onChange={handleVideoFileChange}
                className="hidden"
              />
              {previewVideoUrl ? (
                <div className="relative h-40 w-80 overflow-visible sm:h-50 sm:w-100">
                  <video
                    src={previewVideoUrl}
                    controls
                    className="h-full w-full object-cover rounded-2xl"
                  />
                  <div
                    aria-hidden="true"
                    className={cn(
                      lineOrientation === "horizontal"
                        ? "pointer-events-none absolute inset-x-0 z-5 h-0.5 bg-accent"
                        : "pointer-events-none absolute inset-y-0 z-5 w-0.5 bg-accent",
                      isDetecting && "opacity-30"
                    )}
                    style={
                      lineOrientation === "horizontal"
                        ? { top: linePositionPercent }
                        : { left: linePositionPercent }
                    }
                  />
                  {lineOrientation === "vertical" ? (
                    <div className="pointer-events-auto absolute -top-3.75 left-[calc(1/10*100%-9px)] z-10 w-[calc(80%+20px)]">
                      <label htmlFor="video-line-slider" className="sr-only">
                        Detection line position
                      </label>
                      <input
                        id="video-line-slider"
                        type="range"
                        min={0.1}
                        max={0.9}
                        step={0.01}
                        value={linePosition}
                        onChange={handleLinePositionChange}
                        className="range range-sm range-accent w-full [--range-fill:0] [--range-bg:color-mix(in_oklab,var(--color-accent)_60%,transparent)]"
                      />
                    </div>
                  ) : (
                    <div className="pointer-events-auto absolute top-[calc(1/2*100%-10px)] -left-19.75 z-10 w-[calc(8rem+20px)] sm:-left-23.75 sm:w-45">
                      <label htmlFor="video-line-slider" className="sr-only">
                        Detection line position
                      </label>
                      <input
                        id="video-line-slider"
                        type="range"
                        min={0.1}
                        max={0.9}
                        step={0.01}
                        value={linePosition}
                        onChange={handleLinePositionChange}
                        className="range range-sm range-accent w-full rotate-90 [--range-fill:0] [--range-bg:color-mix(in_oklab,var(--color-accent)_60%,transparent)]"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex justify-center items-center h-40 w-80 bg-secondary rounded-2xl sm:h-50 sm:w-100">
                  <Video className="size-8 text-secondary-content" />
                </div>
              )}
              <div className="flex flex-col items-center gap-4 sm:gap-12 sm:flex-row sm:justify-between sm:items-stretch">
                <button
                  type="button"
                  onClick={() => videoRef.current.click()}
                  className="btn btn-xl w-fit"
                >
                  Upload
                </button>
                <button
                  type="submit"
                  disabled={!selectedVideoFile}
                  className="btn btn-primary btn-xl w-fit"
                >
                  {isDetecting && (
                    <span className="loading loading-spinner loading-sm" />
                  )}
                  Run detection
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-4 md:gap-6 md:mt-5">
              <label className="label w-fit style-body-1 text-accent-content">
                <input
                  type="checkbox"
                  checked={detectCar}
                  onChange={(e) => handleCheckbox.detectCar(e.target.checked)}
                  className="checkbox checkbox-accent"
                />
                Detect car
              </label>
              <label className="label w-fit style-body-1 text-accent-content">
                <input
                  type="checkbox"
                  checked={preprocessOcr}
                  onChange={(e) =>
                    handleCheckbox.preprocessOcr(e.target.checked)
                  }
                  className="checkbox checkbox-accent"
                />
                Preprocess OCR
              </label>
              <h4
                id="video-line-orientation-label"
                className="style-headline-4 underline"
              >
                Line Orientation
              </h4>
              <div
                className="flex gap-8"
                role="radiogroup"
                aria-labelledby="video-line-orientation-label"
              >
                <label className="label style-body-1 text-accent-content">
                  <input
                    id="line-orientation-horizontal"
                    type="radio"
                    name="line-orientation-radio"
                    checked={lineOrientation === "horizontal"}
                    onChange={() => handleLineOrientationChange("horizontal")}
                    className="radio radio-accent"
                  />
                  Horizontal
                </label>
                <label className="label style-body-1 text-accent-content">
                  <input
                    id="line-orientation-vertical"
                    type="radio"
                    name="line-orientation-radio"
                    checked={lineOrientation === "vertical"}
                    onChange={() => handleLineOrientationChange("vertical")}
                    className="radio radio-accent"
                  />
                  Vertical
                </label>
              </div>
            </div>
          </fieldset>
        </form>
        {videoError && (
          <div
            role="alert"
            className="style-body-1 font-bold bg-error text-error-content p-4 rounded-lg"
          >
            {videoError}
          </div>
        )}
        {detectError && (
          <div
            role="alert"
            className="style-body-1 font-bold bg-error text-error-content p-4 rounded-lg"
          >
            {detectError}
          </div>
        )}
        {detectResult && (
          <div
            role="status"
            className="text-success-content style-body-1 font-bold bg-success p-4 rounded-lg"
          >
            Detect success — {detectResult.count}{" "}
            {detectResult.count === 1 ? "region" : "regions"}
          </div>
        )}
      </section>
      {detectResult && detectResult.results.length > 0 && (
        <section className="flex flex-col gap-4 mt-8">
          <h4 className="style-headline-4 underline">Result</h4>
          <ul className="flex flex-col gap-6">
            {detectResult.results.map((item) => {
              const timeText = item.timestampSec.toFixed(2) + " second";
              const direction = numberToDirection(
                detectResult.line.orientation,
                item.direction
              );
              const plateText = item.ocr.texts.join(" ").trim() || "—";
              const ocrConf =
                item.ocr.confidences.length > 0
                  ? Math.max(...item.ocr.confidences)
                  : null;
              const plateConf = item.plate?.confidence ?? null;
              const province = item.province?.name ?? null;

              return (
                <li key={item.frameIndex}>
                  <article className="flex flex-col gap-2 rounded-lg border border-base-300 p-4">
                    <h5 className="style-headline-4">
                      {`Frame #${item.frameIndex + 1}`}
                    </h5>
                    {previewVideoUrl && (
                      <VideoDetectionResultFrame
                        videoSrc={previewVideoUrl}
                        resultItem={item}
                        line={detectResult.line}
                      />
                    )}
                    <ul className="flex flex-col gap-2">
                      <li className="flex flex-wrap gap-2">
                        <span className="style-body-1 font-bold">Time:</span>
                        <span className="style-body-1">{timeText}</span>
                      </li>
                      <li className="flex flex-wrap gap-2">
                        <span className="style-body-1 font-bold">
                          Direction:
                        </span>
                        <span className="style-body-1">{direction}</span>
                      </li>
                      <li className="flex flex-wrap gap-2">
                        <span className="style-body-1 font-bold">
                          Detected text:
                        </span>
                        <span className="style-body-1">{plateText}</span>
                      </li>
                      {ocrConf !== null && (
                        <li className="flex flex-wrap gap-2">
                          <span className="style-body-1 font-bold">
                            OCR confidence (max):
                          </span>
                          <span className="style-body-1">
                            {ocrConf.toFixed(3)}
                          </span>
                        </li>
                      )}
                      {plateConf !== null && (
                        <li className="flex flex-wrap gap-2">
                          <span className="style-body-1 font-bold">
                            Plate box confidence:
                          </span>
                          <span className="style-body-1">
                            {plateConf.toFixed(3)}
                          </span>
                        </li>
                      )}
                      {province !== null && (
                        <li className="flex flex-wrap gap-2">
                          <span className="style-body-1 font-bold">
                            Province:
                          </span>
                          <span className="style-body-1">{province}</span>
                        </li>
                      )}
                    </ul>
                  </article>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}

export default VideoDetection;
