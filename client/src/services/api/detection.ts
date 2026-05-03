import client from "../client";
import type {
  DetectImagePayload,
  DetectImageResponse,
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
