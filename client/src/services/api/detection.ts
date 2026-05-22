import client from "../client";
import type {
  DetectImagePayload,
  DetectImageResponse,
  DetectVideoPayload,
  DetectVideoResponse,
} from "../../types/detection";

const DETECT_ROUTE_PREFIX = "/detect";

export async function detectImage({
  image,
  detectCar = true,
  detectPlate = true,
  preprocessOcr = true,
}: DetectImagePayload): Promise<DetectImageResponse> {
  const formData = new FormData();
  formData.append("image", image);
  formData.append("detectCar", String(detectCar));
  formData.append("detectPlate", String(detectPlate));
  formData.append("preprocessOcr", String(preprocessOcr));

  const { data } = await client.post<DetectImageResponse>(
    `${DETECT_ROUTE_PREFIX}/image`,
    formData
  );
  return data;
}

export async function detectVideo({
  video,
  lineOrientation = "horizontal",
  point,
  detectCar = true,
  preprocessOcr = true,
}: DetectVideoPayload): Promise<DetectVideoResponse> {
  const formData = new FormData();
  formData.append("video", video);
  formData.append("lineOrientation", lineOrientation);
  formData.append("detectCar", String(detectCar));
  formData.append("preprocessOcr", String(preprocessOcr));

  if (point !== undefined) {
    formData.append("point", String(point));
  }

  const { data } = await client.post<DetectVideoResponse>(
    `${DETECT_ROUTE_PREFIX}/video`,
    formData
  );
  return data;
}
