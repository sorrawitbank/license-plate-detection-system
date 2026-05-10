import { useEffect, useState } from "react";
import type {
  DetectionVideoResultItem,
  LineOrientationResult,
  OverlayBox,
} from "../../types/detection";
import { getPlateGlobalBBox } from "../../utils";

/** Same blob URL + parallel seeks often yields black canvas; serialize per src. */
const captureChainBySrc = new Map<string, Promise<unknown>>();

function enqueueCaptureForSrc<T>(
  src: string,
  task: () => Promise<T>
): Promise<T> {
  const prev = captureChainBySrc.get(src) ?? Promise.resolve();
  const run = prev.catch(() => undefined).then(() => task());
  captureChainBySrc.set(
    src,
    run.then(() => undefined).catch(() => undefined)
  );
  return run;
}

/**
 * After seek, wait until a decoded frame is available before drawing to canvas.
 */
async function waitForDecodedFrame(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    return;
  }
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    let timeoutId: ReturnType<typeof window.setTimeout>;

    const onLoadedData = () => {
      finish(() => resolve());
    };
    const onError = () => {
      finish(() => reject(new Error("Video frame decode failed.")));
    };

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("error", onError);
      fn();
    };

    timeoutId = window.setTimeout(() => {
      finish(() => reject(new Error("Video frame decode timed out.")));
    }, 10_000);

    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("error", onError);
  });
}

/**
 * Align drawImage with a presented frame. Off-DOM paused video may never fire
 * requestVideoFrameCallback; time out and use double rAF.
 */
function waitForPaintableVideoFrame(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    const runRafFallback = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(finish);
      });
    };

    const timeoutMs = 120;

    if (typeof video.requestVideoFrameCallback !== "function") {
      runRafFallback();
      return;
    }

    let timer: ReturnType<typeof window.setTimeout> | undefined;

    const handle = video.requestVideoFrameCallback(() => {
      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
      finish();
    });

    timer = window.setTimeout(() => {
      if (typeof video.cancelVideoFrameCallback === "function") {
        video.cancelVideoFrameCallback(handle);
      }
      runRafFallback();
    }, timeoutMs);
  });
}

function buildOverlayBoxes(item: DetectionVideoResultItem): OverlayBox[] {
  const boxes: OverlayBox[] = [];

  if (item.car) {
    boxes.push({
      key: `car-${item.frameIndex}-${item.trackId}`,
      bbox: item.car.bbox,
      rectClass: "stroke-error",
      textClass: "text-error",
      label:
        item.carIndex !== null ? `Car #${item.carIndex + 1}` : "Detected car",
    });
  }

  const plateGlobalBBox = getPlateGlobalBBox(item);
  if (plateGlobalBBox) {
    boxes.push({
      key: `plate-${item.frameIndex}-${item.trackId}`,
      bbox: plateGlobalBBox,
      rectClass: "stroke-warning",
      textClass: "text-warning",
      label: "Plate",
    });
  }

  return boxes;
}

async function waitLoadedMetadata(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const onLoaded = () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("error", onError);
      resolve();
    };
    const onError = () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("error", onError);
      reject(new Error("Video metadata failed to load."));
    };
    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("error", onError);
  });
}

async function seekVideoToTime(
  video: HTMLVideoElement,
  timeSec: number
): Promise<void> {
  const duration = video.duration;
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("Invalid video duration.");
  }

  const target = Math.min(Math.max(0, timeSec), duration - 1e-3);

  if (Math.abs(video.currentTime - target) <= 1e-4) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      resolve();
    };
    const onError = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      reject(new Error("Seek failed."));
    };
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    try {
      video.currentTime = target;
    } catch {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      reject(new Error("Seek failed."));
    }
  });
}

function formatLineCaption(line: LineOrientationResult): string {
  const pct = 100 * line.normalizedValue;
  const px = line.pixelValue.toFixed(0);
  if (line.orientation === "horizontal") {
    return `Horizontal at ${px}px from the top (${pct}% of frame height).`;
  }
  return `Vertical at ${px}px from the left (${pct}% of frame width).`;
}

interface Props {
  videoSrc: string | null;
  resultItem: DetectionVideoResultItem;
  line: LineOrientationResult;
}

function VideoDetectionResultFrame({ videoSrc, resultItem, line }: Props) {
  const [isShowLine, setIsShowLine] = useState(true);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const overlayBoxes = buildOverlayBoxes(resultItem);

  useEffect(() => {
    if (!videoSrc) {
      setSnapshotUrl(null);
      setNaturalSize(null);
      setCaptureError(null);
      return;
    }

    let alive = true;
    let createdUrl: string | null = null;

    setSnapshotUrl(null);
    setNaturalSize(null);
    setCaptureError(null);

    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = videoSrc;

    enqueueCaptureForSrc(videoSrc, async () => {
      try {
        video.load();
        await waitLoadedMetadata(video);
        if (!alive) return;

        await seekVideoToTime(video, resultItem.timestampSec);
        if (!alive) return;

        await waitForDecodedFrame(video);
        if (!alive) return;

        await waitForPaintableVideoFrame(video);
        if (!alive) return;

        const w = video.videoWidth;
        const h = video.videoHeight;
        if (w <= 0 || h <= 0) {
          throw new Error("Invalid frame dimensions.");
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Could not read frame.");
        }

        ctx.drawImage(video, 0, 0);

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", 0.92)
        );
        if (!alive) return;

        if (!blob) {
          throw new Error("Could not encode frame.");
        }

        const url = URL.createObjectURL(blob);
        if (!alive) {
          URL.revokeObjectURL(url);
          return;
        }

        createdUrl = url;
        setCaptureError(null);
        setSnapshotUrl(url);
        setNaturalSize({ width: w, height: h });
      } catch (err) {
        if (!alive) return;
        const message =
          err instanceof Error ? err.message : "Could not capture frame.";
        setCaptureError(message);
        setSnapshotUrl(null);
        setNaturalSize(null);
      }
    });

    return () => {
      alive = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
      // Avoid resetting src/load here: it can abort an in-flight decode and
      // leave waitLoadedMetadata pending, blocking the per-src capture queue.
    };
  }, [videoSrc, resultItem.timestampSec]);

  const overlayLongestSide = naturalSize
    ? Math.max(naturalSize.width, naturalSize.height)
    : 0;
  const overlayStrokeWidth =
    overlayLongestSide > 0 ? Math.max(2, overlayLongestSide * 0.0035) : 2;
  const overlayFontSize =
    overlayLongestSide > 0 ? Math.max(14, overlayLongestSide * 0.018) : 14;
  const overlayLabelOffset = Math.max(8, overlayFontSize * 0.4);

  if (captureError) {
    return (
      <div role="alert" className="style-body-1 text-error">
        {captureError}
      </div>
    );
  }

  if (!snapshotUrl || !naturalSize) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-2xl bg-base-200">
        <span className="loading loading-spinner loading-md text-accent" />
      </div>
    );
  }

  const { width: frameW, height: frameH } = naturalSize;
  const linePx = line.pixelValue;
  const detectionLine =
    line.orientation === "horizontal" ? (
      <line
        x1={0}
        y1={linePx}
        x2={frameW}
        y2={linePx}
        className="stroke-accent"
        strokeWidth={overlayStrokeWidth}
      />
    ) : (
      <line
        x1={linePx}
        y1={0}
        x2={linePx}
        y2={frameH}
        className="stroke-accent"
        strokeWidth={overlayStrokeWidth}
      />
    );

  return (
    <figure className="flex max-w-full flex-col gap-2">
      <div className="relative inline-block self-start">
        <img
          src={snapshotUrl}
          alt={`License plate detection at ${resultItem.timestampSec.toFixed(
            2
          )} seconds`}
          className="block max-h-80 md:max-h-100 rounded-2xl"
        />
        <svg
          viewBox={`0 0 ${frameW} ${frameH}`}
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          {isShowLine && <g>{detectionLine}</g>}
          {overlayBoxes.map((box) => (
            <g key={box.key}>
              <rect
                x={box.bbox.x1}
                y={box.bbox.y1}
                width={Math.max(box.bbox.x2 - box.bbox.x1, 0)}
                height={Math.max(box.bbox.y2 - box.bbox.y1, 0)}
                className={`${box.rectClass} fill-transparent`}
                strokeWidth={overlayStrokeWidth}
              />
              <text
                x={box.bbox.x1}
                y={Math.max(
                  box.bbox.y1 - overlayLabelOffset,
                  overlayFontSize + 2
                )}
                fontSize={overlayFontSize}
                className={`${box.textClass} fill-current font-bold`}
              >
                {box.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <label className="label w-fit style-body-1 text-accent-content">
        <input
          type="checkbox"
          checked={isShowLine}
          onChange={(e) => setIsShowLine(e.target.checked)}
          className="checkbox checkbox-accent"
        />
        Show line
      </label>
      <figcaption className="flex flex-wrap gap-2 mt-2">
        <span className="style-body-1 font-bold">Detection crossing line:</span>
        <span className="style-body-1">{formatLineCaption(line)}</span>
      </figcaption>
    </figure>
  );
}

export default VideoDetectionResultFrame;
