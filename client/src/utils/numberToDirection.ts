import type { LineOrientation } from "../types/detection";

function numberToDirection(lineOrientation: LineOrientation, number: 1 | 2) {
  switch (lineOrientation) {
    case "horizontal":
      switch (number) {
        case 1:
          return "Down";
        case 2:
          return "Up";
      }
    case "vertical":
      switch (number) {
        case 1:
          return "Right";
        case 2:
          return "Left";
      }
  }
}

export default numberToDirection;
