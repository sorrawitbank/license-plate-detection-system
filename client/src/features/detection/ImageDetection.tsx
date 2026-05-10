import { Image } from "lucide-react";
import useDetectImage from "../../hooks/useDetectImage";
import type { OverlayBox } from "../../types/detection";
import { getPlateGlobalBBox } from "../../utils";

function ImageDetection() {
  const {
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
  } = useDetectImage();

  const overlayBoxes: OverlayBox[] =
    detectResult?.results.flatMap((item, index) => {
      const boxes: OverlayBox[] = [];

      if (item.car) {
        boxes.push({
          key: `car-${item.carIndex ?? index}`,
          bbox: item.car.bbox,
          rectClass: "stroke-error",
          textClass: "text-error",
          label:
            item.carIndex !== null
              ? `Car #${item.carIndex + 1}`
              : "Detected car",
        });
      }

      const plateGlobalBBox = getPlateGlobalBBox(item);
      if (plateGlobalBBox) {
        boxes.push({
          key: `plate-${item.carIndex ?? index}`,
          bbox: plateGlobalBBox,
          rectClass: "stroke-warning",
          textClass: "text-warning",
          label: "Plate",
        });
      }

      return boxes;
    }) ?? [];

  const overlayLongestSide = imageNaturalSize
    ? Math.max(imageNaturalSize.width, imageNaturalSize.height)
    : 0;
  const overlayStrokeWidth =
    overlayLongestSide > 0 ? Math.max(2, overlayLongestSide * 0.0035) : 2;
  const overlayFontSize =
    overlayLongestSide > 0 ? Math.max(14, overlayLongestSide * 0.018) : 14;
  const overlayLabelOffset = Math.max(8, overlayFontSize * 0.4);

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
                ref={pictureRef}
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleImageFileChange}
                className="hidden"
              />
              {previewImageUrl ? (
                <img
                  src={previewImageUrl}
                  alt="Selected preview"
                  className="h-40 w-80 object-cover rounded-2xl sm:h-50 sm:w-100"
                />
              ) : (
                <div className="flex justify-center items-center h-40 w-80 bg-secondary rounded-2xl sm:h-50 sm:w-100">
                  <Image className="size-8 text-secondary-content" />
                </div>
              )}
              <div className="flex flex-col items-center gap-4 sm:gap-12 sm:flex-row sm:justify-between sm:items-stretch">
                <button
                  type="button"
                  onClick={() => pictureRef.current.click()}
                  className="btn btn-xl w-fit"
                >
                  Upload
                </button>
                <button
                  type="submit"
                  disabled={!selectedImageFile}
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
                  checked={detectPlate}
                  onChange={(e) => handleCheckbox.detectPlate(e.target.checked)}
                  className="checkbox checkbox-accent"
                />
                Detect plate
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
            </div>
          </fieldset>
        </form>
        {pictureError && (
          <div
            role="alert"
            className="style-body-1 font-bold bg-error text-error-content p-4 rounded-lg"
          >
            {pictureError}
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
          {overlayBoxes.length > 0 && detectedImageUrl && (
            <figure className="self-center lg:self-start">
              <div className="relative inline-block">
                <img
                  src={detectedImageUrl}
                  alt="Detection result"
                  onLoad={handleLoadImage}
                  className="block max-h-80 md:max-h-100 rounded-2xl"
                />
                {imageNaturalSize && (
                  <svg
                    viewBox={`0 0 ${imageNaturalSize.width} ${imageNaturalSize.height}`}
                    className="absolute inset-0 h-full w-full pointer-events-none"
                    aria-hidden="true"
                  >
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
                )}
              </div>
            </figure>
          )}
          <h4 className="style-headline-4 underline">Result</h4>
          <ul className="flex flex-col gap-6">
            {detectResult.results.map((item, index) => {
              const plateText = item.ocr.texts.join(" ").trim() || "—";
              const ocrConf =
                item.ocr.confidences.length > 0
                  ? Math.max(...item.ocr.confidences)
                  : null;
              const plateConf = item.plate?.confidence ?? null;
              const province = item.province?.name ?? null;

              return (
                <li key={item.carIndex ?? `full-${index}`}>
                  <article className="flex flex-col gap-2 rounded-lg border border-base-300 p-4">
                    <h5 className="style-headline-4">
                      {item.carIndex !== null
                        ? `Car #${item.carIndex + 1}`
                        : "Full frame"}
                    </h5>
                    <ul className="flex flex-col gap-2">
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

export default ImageDetection;
