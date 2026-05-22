import type { BoundingBox, DetectionObject } from "../types/detection";

interface CarPlateBBoxSource {
  car: DetectionObject | null;
  plate: DetectionObject | null;
}

function getPlateGlobalBBox(item: CarPlateBBoxSource): BoundingBox | null {
  if (!item.plate) {
    return null;
  }

  if (!item.car) {
    return item.plate.bbox;
  }

  return {
    x1: item.car.bbox.x1 + item.plate.bbox.x1,
    y1: item.car.bbox.y1 + item.plate.bbox.y1,
    x2: item.car.bbox.x1 + item.plate.bbox.x2,
    y2: item.car.bbox.y1 + item.plate.bbox.y2,
  };
}

export default getPlateGlobalBBox;
