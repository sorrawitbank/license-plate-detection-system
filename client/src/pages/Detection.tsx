import { Image, Video } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { ImageDetection, VideoDetection } from "../features/detection";
import MainWithNavbar from "../layout/MainWithNavbar";

function Detection() {
  const [searchParams, setSearchParams] = useSearchParams();

  const isVideoTab = searchParams.get("tab")?.trim() === "video";

  return (
    <MainWithNavbar className="gap-8">
      <header>
        <h3 className="style-headline-3">Detection</h3>
      </header>
      <div className="tabs tabs-border">
        <label className="tab gap-2 style-headline-4">
          <input
            type="radio"
            name="detection-tabs"
            defaultChecked={!isVideoTab}
            onClick={() => {
              setSearchParams(
                (prev) => {
                  const params = new URLSearchParams(prev);
                  params.delete("tab");
                  return params;
                },
                { replace: true }
              );
            }}
          />
          <Image />
          Image
        </label>
        <div className="tab-content pt-4">
          <ImageDetection />
        </div>
        <label className="tab gap-2 style-headline-4">
          <input
            type="radio"
            name="detection-tabs"
            defaultChecked={isVideoTab}
            onClick={() => {
              setSearchParams(
                (prev) => {
                  const params = new URLSearchParams(prev);
                  params.set("tab", "video");
                  return params;
                },
                { replace: true }
              );
            }}
          />
          <Video />
          Video
        </label>
        <div className="tab-content pt-4">
          <VideoDetection />
        </div>
      </div>
    </MainWithNavbar>
  );
}

export default Detection;
