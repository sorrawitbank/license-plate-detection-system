import { Image } from "lucide-react";
import useDetect from "../hooks/useDetect";
import MainWithNavbar from "../layout/MainWithNavbar";

function Detection() {
  const { pictureRef, previewImageUrl, handleImageFileChange } = useDetect();

  return (
    <MainWithNavbar className="gap-8">
      <h3 className="style-headline-3">Detection</h3>
      <form>
        <fieldset className="fieldset flex flex-col gap-8 md:flex-row md:gap-12">
          <div className="flex flex-col gap-4">
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
                className="h-40 w-80 object-cover rounded-2xl"
              />
            ) : (
              <div className="flex justify-center items-center h-40 w-80 bg-secondary rounded-2xl">
                <Image className="size-8 text-secondary-content" />
              </div>
            )}
            <button
              type="button"
              className="btn btn-xl w-fit"
              onClick={() => pictureRef.current.click()}
            >
              Upload
            </button>
          </div>
          <div className="flex flex-col gap-4 md:gap-6 md:mt-5">
            <label className="label style-body-1 text-accent-content">
              <input
                type="checkbox"
                defaultChecked
                className="checkbox checkbox-accent"
              />
              Detect car
            </label>
            <label className="label style-body-1 text-accent-content">
              <input
                type="checkbox"
                defaultChecked
                className="checkbox checkbox-accent"
              />
              Detect plate
            </label>
            <label className="label style-body-1 text-accent-content">
              <input
                type="checkbox"
                defaultChecked
                className="checkbox checkbox-accent"
              />
              Preprocess OCR
            </label>
          </div>
        </fieldset>
      </form>
      <div className="text-success-content style-body-1 font-bold bg-success p-4 rounded-lg">
        Detect Success
      </div>
      <div className="flex flex-col gap-4">
        <h4 className="style-headline-4 underline">Result</h4>
        <ul className="flex flex-col gap-2">
          <li className="flex gap-2">
            <span className="style-body-1 font-bold">Detected Plate:</span>
            <span className="style-body-1">กข 8242</span>
          </li>
          <li className="flex gap-2">
            <span className="style-body-1 font-bold">Confidence</span>
            <span className="style-body-1">0.89</span>
          </li>
        </ul>
      </div>
    </MainWithNavbar>
  );
}

export default Detection;
