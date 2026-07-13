"use client";

import * as React from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

export type BlobOrigin = { x: number; y: number };
export type BlobMargin =
  | number
  | { top?: number; right?: number; bottom?: number; left?: number };

export type FluidBlobsProps = {
  colors?: string[];
  lightColors?: string[];
  darkColors?: string[];
  sizes?: number | number[];
  blur?: number;
  origins?: BlobOrigin[];
  margin?: BlobMargin;
  className?: string;
};

type BlobConfig = {
  size: number;
  spring: { stiffness: number; damping: number };
  driftX: { freq: number; amp: number; phase: number };
  driftY: { freq: number; amp: number; phase: number };
  pulse: { duration: number; delay: number };
};

const DEFAULT_LIGHT = ["#ffb3c6", "#e8b4f0", "#ffd6a5", "#ffc8dd"];
const DEFAULT_DARK = ["#ff6b8a", "#c084f5", "#d44d8a", "#ff96a9"];

function useIsDark() {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains("dark"));

    check();

    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
}

function blobConfig(index: number, overrideSize?: number): BlobConfig {
  const stiffnesses = [75, 38, 20, 55, 45, 30, 60];
  const dampings = [22, 16, 11, 19, 14, 12, 20];
  const sizes = [240, 200, 220, 170, 210, 190, 230];
  const driftFreqs = [800, 1000, 1600, 520, 1100, 700, 1300];
  const driftAmps = [28, 32, 22, 36, 25, 30, 20];
  const driftPhases = [0, 2.1, 4.5, 1.8, 3.3, 5.2, 0.9];
  const pulseDurations = [3.2, 4.1, 3.7, 4.8, 3.5, 4.4, 3.9];
  const pulseDelays = [0, 0.6, 1.1, 1.8, 0.3, 1.4, 0.9];
  const i = index % 7;

  return {
    size: overrideSize ?? sizes[i],
    spring: { stiffness: stiffnesses[i], damping: dampings[i] },
    driftX: {
      freq: driftFreqs[i],
      amp: driftAmps[i],
      phase: driftPhases[i],
    },
    driftY: {
      freq: driftFreqs[(i + 3) % 7],
      amp: driftAmps[(i + 2) % 7],
      phase: driftPhases[(i + 4) % 7],
    },
    pulse: { duration: pulseDurations[i], delay: pulseDelays[i] },
  };
}

function resolveMargin(margin: BlobMargin) {
  if (typeof margin === "number") {
    return { top: margin, right: margin, bottom: margin, left: margin };
  }

  return {
    top: margin.top ?? 0,
    right: margin.right ?? 0,
    bottom: margin.bottom ?? 0,
    left: margin.left ?? 0,
  };
}

export function FluidBlobs({
  colors,
  lightColors,
  darkColors,
  sizes,
  blur = 55,
  origins,
  margin = 0,
  className,
}: FluidBlobsProps) {
  const isDark = useIsDark();
  const resolvedColors =
    colors ??
    (isDark ? (darkColors ?? DEFAULT_DARK) : (lightColors ?? DEFAULT_LIGHT));
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = React.useState({ w: 384, h: 224 });
  const mouseX = useMotionValue(containerSize.w / 2);
  const mouseY = useMotionValue(containerSize.h / 2);
  const isInsideRef = React.useRef(false);
  const time = useMotionValue(0);

  React.useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver(() => {
      setContainerSize({ w: element.offsetWidth, h: element.offsetHeight });
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const onMove = (event: MouseEvent) => {
      const element = containerRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const bounds = resolveMargin(margin);
      const inside =
        event.clientX >= rect.left - bounds.left &&
        event.clientX <= rect.right + bounds.right &&
        event.clientY >= rect.top - bounds.top &&
        event.clientY <= rect.bottom + bounds.bottom;

      isInsideRef.current = inside;

      if (inside) {
        mouseX.set(event.clientX - rect.left);
        mouseY.set(event.clientY - rect.top);
      }
    };

    window.addEventListener("mousemove", onMove);

    return () => window.removeEventListener("mousemove", onMove);
  }, [margin, mouseX, mouseY]);

  useAnimationFrame((currentTime) => time.set(currentTime));

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${
        className ?? ""
      }`}
    >
      {resolvedColors.map((color, index) => {
        const overrideSize = Array.isArray(sizes)
          ? sizes[index]
          : typeof sizes === "number"
            ? sizes
            : undefined;

        return (
          <BlobLayer
            key={`${color}-${index}`}
            color={color}
            config={blobConfig(index, overrideSize)}
            mouseX={mouseX}
            mouseY={mouseY}
            isInsideRef={isInsideRef}
            time={time}
            blur={blur}
            origin={origins?.[index]}
            containerW={containerSize.w}
            containerH={containerSize.h}
          />
        );
      })}
    </div>
  );
}

type BlobLayerProps = {
  color: string;
  config: BlobConfig;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  mouseY: ReturnType<typeof useMotionValue<number>>;
  isInsideRef: React.RefObject<boolean>;
  time: ReturnType<typeof useMotionValue<number>>;
  blur: number;
  origin?: BlobOrigin;
  containerW: number;
  containerH: number;
};

function BlobLayer({
  color,
  config,
  mouseX,
  mouseY,
  isInsideRef,
  time,
  blur,
  origin,
  containerW,
  containerH,
}: BlobLayerProps) {
  const { size, spring, driftX, driftY, pulse } = config;
  const originX = origin ? (origin.x / 100) * containerW : containerW / 2;
  const originY = origin ? (origin.y / 100) * containerH : containerH / 2;
  const targetX = useMotionValue(originX);
  const targetY = useMotionValue(originY);

  useAnimationFrame(() => {
    targetX.set(isInsideRef.current ? mouseX.get() : originX);
    targetY.set(isInsideRef.current ? mouseY.get() : originY);
  });

  const springX = useSpring(targetX, spring);
  const springY = useSpring(targetY, spring);
  const x = useTransform(
    [springX, time] as const,
    ([currentX, currentTime]) =>
      (currentX as number) +
      Math.sin((currentTime as number) / driftX.freq + driftX.phase) *
        driftX.amp -
      size / 2,
  );
  const y = useTransform(
    [springY, time] as const,
    ([currentY, currentTime]) =>
      (currentY as number) +
      Math.cos((currentTime as number) / driftY.freq + driftY.phase) *
        driftY.amp -
      size / 2,
  );

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
        background: color,
        filter: `blur(${blur}px)`,
        willChange: "transform",
      }}
      animate={{
        scale: [1, 1.18, 0.88, 1.12, 0.95, 1],
        opacity: [0.72, 0.92, 0.68, 0.88, 0.78, 0.72],
      }}
      transition={{
        duration: pulse.duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay: pulse.delay,
      }}
    />
  );
}

export default FluidBlobs;
