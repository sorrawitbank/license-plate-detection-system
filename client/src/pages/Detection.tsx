import { Image } from "lucide-react";
import { useState } from "react";
import useDetectImage from "../hooks/useDetectImage";
import MainWithNavbar from "../layout/MainWithNavbar";

function Detection() {
  const {
    pictureRef,
    pictureError,
    selectedImageFile,
    previewImageUrl,
    handleImageFileChange,
    isDetecting,
    detectError,
    detectResult,
    handleDetectImage,
  } = useDetectImage();

  const [detectCar, setDetectCar] = useState(true);
  const [detectPlate, setDetectPlate] = useState(true);
  const [preprocessOcr, setPreprocessOcr] = useState(true);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (
    event
  ) => {
    event.preventDefault();
    await handleDetectImage({
      detectCar,
      detectPlate,
      preprocessOcr,
    });
  };

  return (
    <MainWithNavbar className="gap-8">
      <header>
        <h3 className="style-headline-3">Detection</h3>
      </header>
      <section className="flex flex-col gap-6">
        <form onSubmit={handleSubmit}>
          <fieldset className="fieldset flex flex-col gap-8 md:flex-row md:gap-12">
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
                  disabled={!selectedImageFile || isDetecting}
                  className="btn btn-primary btn-xl w-fit"
                >
                  {isDetecting ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : null}
                  Run detection
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-4 md:gap-6 md:mt-5">
              <label className="label style-body-1 text-accent-content">
                <input
                  type="checkbox"
                  checked={detectCar}
                  onChange={(e) => setDetectCar(e.target.checked)}
                  className="checkbox checkbox-accent"
                />
                Detect car
              </label>
              <label className="label style-body-1 text-accent-content">
                <input
                  type="checkbox"
                  checked={detectPlate}
                  onChange={(e) => setDetectPlate(e.target.checked)}
                  className="checkbox checkbox-accent"
                />
                Detect plate
              </label>
              <label className="label style-body-1 text-accent-content">
                <input
                  type="checkbox"
                  checked={preprocessOcr}
                  onChange={(e) => setPreprocessOcr(e.target.checked)}
                  className="checkbox checkbox-accent"
                />
                Preprocess OCR
              </label>
            </div>
          </fieldset>
        </form>
        {pictureError ? (
          <div
            role="alert"
            className="style-body-1 font-bold bg-error text-error-content p-4 rounded-lg"
          >
            {pictureError}
          </div>
        ) : null}
        {detectError ? (
          <div
            role="alert"
            className="style-body-1 font-bold bg-error text-error-content p-4 rounded-lg"
          >
            {detectError}
          </div>
        ) : null}
        {detectResult ? (
          <div
            role="status"
            className="text-success-content style-body-1 font-bold bg-success p-4 rounded-lg"
          >
            Detect success — {detectResult.count}{" "}
            {detectResult.count === 1 ? "region" : "regions"}
          </div>
        ) : null}
      </section>
      {detectResult && detectResult.results.length > 0 ? (
        <section className="flex flex-col gap-4">
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
                    <h5 className="style-body-1 font-bold">
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
      ) : null}
    </MainWithNavbar>
  );
}

export default Detection;
