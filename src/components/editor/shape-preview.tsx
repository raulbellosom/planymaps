/**
 * Shape Preview Renderer
 * Shows a preview of a shape being drawn
 */

import { Rect, Ellipse, Line, Arrow } from "react-konva";
import type { BoardItem } from "@/types/board";

export interface ShapePreviewProps {
  shape: Partial<BoardItem>;
}

export const ShapePreview: React.FC<ShapePreviewProps> = ({ shape }) => {
  if (!shape.type || shape.width === undefined || shape.height === undefined) {
    return null;
  }

  const style = {
    fill: "#ffffff",
    stroke: "#0066ff",
    strokeWidth: 2,
  };

  const commonProps = {
    fill: style.fill,
    stroke: style.stroke,
    strokeWidth: style.strokeWidth,
    opacity: 0.5,
    dash: [5, 5],
  };

  switch (shape.type) {
    case "rectangle":
      return (
        <Rect
          x={shape.x || 0}
          y={shape.y || 0}
          width={shape.width}
          height={shape.height}
          {...commonProps}
        />
      );

    case "ellipse": {
      const radiusX = (shape.width || 0) / 2;
      const radiusY = (shape.height || 0) / 2;
      return (
        <Ellipse
          x={(shape.x || 0) + radiusX}
          y={(shape.y || 0) + radiusY}
          radiusX={radiusX}
          radiusY={radiusY}
          {...commonProps}
        />
      );
    }

    case "line":
      return (
        <Line
          x={shape.x || 0}
          y={shape.y || 0}
          points={[0, 0, shape.width || 0, shape.height || 0]}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          opacity={0.5}
          dash={[5, 5]}
        />
      );

    case "arrow":
      return (
        <Arrow
          x={shape.x || 0}
          y={shape.y || 0}
          points={[0, 0, shape.width || 0, shape.height || 0]}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          fill={style.stroke}
          opacity={0.5}
          dash={[5, 5]}
          pointerLength={10}
          pointerWidth={10}
        />
      );

    case "pin": {
      // Pin preview shows a small circle marker
      const pinSize = 16;
      return (
        <Rect
          x={shape.x || 0}
          y={shape.y || 0}
          width={pinSize}
          height={pinSize}
          fill={style.stroke}
          opacity={0.5}
          cornerRadius={pinSize / 2}
          dash={[5, 5]}
        />
      );
    }

    default:
      return null;
  }
};
