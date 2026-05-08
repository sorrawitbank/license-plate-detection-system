import { Image, Video } from "lucide-react";
import ImageDetection from "../features/detection/ImageDetection";
import MainWithNavbar from "../layout/MainWithNavbar";

function Detection() {
  return (
    <MainWithNavbar className="gap-8">
      <header>
        <h3 className="style-headline-3">Detection</h3>
      </header>
      <div className="tabs tabs-border">
        <label className="tab gap-2 style-headline-4">
          <input type="radio" name="detection-tabs" defaultChecked />
          <Image />
          Image
        </label>
        <div className="tab-content pt-4">
          <ImageDetection />
        </div>
        <label className="tab gap-2 style-headline-4">
          <input type="radio" name="detection-tabs" />
          <Video />
          Video
        </label>
        <div className="tab-content pt-4">Video</div>
      </div>
    </MainWithNavbar>
  );
}

export default Detection;
