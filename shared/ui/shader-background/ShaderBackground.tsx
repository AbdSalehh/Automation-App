"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/shared/lib/utils";
import { buildPalette, resolveCssColor } from "./palette";
import { FRAGMENT_SHADER_SOURCE, VERTEX_SHADER_SOURCE } from "./shaders";

/**
 * Parameter tampilan gradien: warna, gerak, dan efek akhir. Mengubah nilai di
 * sini mengubah tampilan latar tanpa menyentuh logika render.
 */
const UNIFORMS = {
  colorCount: 4,
  scale: 2.0,
  intensity: 0.54,
  paramA: 0.47,
  warp: 0.042,
  detail: 1.536,
  contrast: 1.158,
  brightness: 0.0,
  saturation: 1.0,
  hue: 0.0,
  vignette: 0.21,
  blur: 0.002,
  grain: 0.101,
  seed: 4012.0,
  rotate: 5.6549,
  offsetX: 0.11,
  offsetY: -0.19,
  drift: 0.116,
  cursorEnabled: false,
  cursorEffect: 2.0,
  cursorStrength: 0.65,
  cursorRadius: 0.46,
  oklab: 0.0,
  timeScale: -0.727,
};

const pendingContextReleases = new WeakMap<HTMLCanvasElement, number>();

interface ShaderBackgroundProps {
  className?: string;
  /**
   * Warna dasar gradien. Menerima warna CSS apa pun, termasuk variabel seperti
   * `var(--primary)`. Bawaannya mengikuti warna primer aplikasi.
   */
  color?: string;
}

export function ShaderBackground({
  className,
  color = "var(--primary)",
}: ShaderBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pendingRelease = pendingContextReleases.get(canvas);
    if (pendingRelease !== undefined) {
      window.clearTimeout(pendingRelease);
    }
    pendingContextReleases.delete(canvas);

    const glContext = canvas.getContext("webgl", { antialias: false });
    if (!glContext) return;

    const compileShader = (shaderType: number, shaderSource: string) => {
      const shader = glContext.createShader(shaderType)!;
      glContext.shaderSource(shader, shaderSource);
      glContext.compileShader(shader);
      return shader;
    };

    const shaderProgram = glContext.createProgram()!;
    const vertexShader = compileShader(
      glContext.VERTEX_SHADER,
      VERTEX_SHADER_SOURCE,
    );
    const fragmentShader = compileShader(
      glContext.FRAGMENT_SHADER,
      FRAGMENT_SHADER_SOURCE,
    );
    glContext.attachShader(shaderProgram, vertexShader);
    glContext.attachShader(shaderProgram, fragmentShader);
    glContext.linkProgram(shaderProgram);
    glContext.deleteShader(vertexShader);
    glContext.deleteShader(fragmentShader);
    glContext.useProgram(shaderProgram);

    const positionBuffer = glContext.createBuffer();
    glContext.bindBuffer(glContext.ARRAY_BUFFER, positionBuffer);
    glContext.bufferData(
      glContext.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      glContext.STATIC_DRAW,
    );

    const attributeLocation = glContext.getAttribLocation(
      shaderProgram,
      "a_position",
    );
    glContext.enableVertexAttribArray(attributeLocation);
    glContext.vertexAttribPointer(
      attributeLocation,
      2,
      glContext.FLOAT,
      false,
      0,
      0,
    );

    const uniformLocations = {
      colors: glContext.getUniformLocation(shaderProgram, "u_colors"),
      scene: glContext.getUniformLocation(shaderProgram, "u_scene"),
      shape: glContext.getUniformLocation(shaderProgram, "u_shape"),
      surface: glContext.getUniformLocation(shaderProgram, "u_surface"),
      finish: glContext.getUniformLocation(shaderProgram, "u_finish"),
      transform: glContext.getUniformLocation(shaderProgram, "u_transform"),
      space: glContext.getUniformLocation(shaderProgram, "u_space"),
      cursor: glContext.getUniformLocation(shaderProgram, "u_cursor"),
    };

    glContext.uniform3fv(
      uniformLocations.colors,
      new Float32Array(buildPalette(resolveCssColor(color)).flat()),
    );
    glContext.uniform4f(
      uniformLocations.shape,
      UNIFORMS.scale,
      UNIFORMS.intensity,
      UNIFORMS.paramA,
      UNIFORMS.warp,
    );
    glContext.uniform4f(
      uniformLocations.surface,
      UNIFORMS.detail,
      UNIFORMS.contrast,
      UNIFORMS.brightness,
      UNIFORMS.saturation,
    );
    glContext.uniform4f(
      uniformLocations.finish,
      UNIFORMS.hue,
      UNIFORMS.vignette,
      UNIFORMS.blur,
      UNIFORMS.grain,
    );
    glContext.uniform4f(
      uniformLocations.transform,
      UNIFORMS.seed,
      UNIFORMS.rotate,
      UNIFORMS.drift,
      UNIFORMS.oklab,
    );
    glContext.uniform4f(
      uniformLocations.cursor,
      0,
      UNIFORMS.cursorEffect,
      UNIFORMS.cursorStrength,
      UNIFORMS.cursorRadius,
    );

    let targetX = 0;
    let targetY = 0;
    let targetPresence = 0;
    let mouseX = 0;
    let mouseY = 0;
    let cursorPresence = 0;
    let pointerKnown = false;
    let pointerClientX = 0;
    let pointerClientY = 0;
    let canvasBounds = canvas.getBoundingClientRect();
    let animationFrameId = 0;
    let lastTimestamp: number | null = null;
    let isDocumentVisible = document.visibilityState === "visible";
    let isElementInView = true;
    let isDisposed = false;
    const animationStartTime = performance.now();
    const isTimeAnimated = Math.abs(UNIFORMS.timeScale) > 0.0001;

    const resizeCanvas = () => {
      const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const rawWidth = Math.max(
        1,
        Math.round(canvasBounds.width * devicePixelRatio),
      );
      const rawHeight = Math.max(
        1,
        Math.round(canvasBounds.height * devicePixelRatio),
      );
      const pixelScale = Math.min(
        1,
        Math.sqrt(2_000_000 / Math.max(1, rawWidth * rawHeight)),
      );
      const scaledWidth = Math.max(1, Math.round(rawWidth * pixelScale));
      const scaledHeight = Math.max(1, Math.round(rawHeight * pixelScale));

      if (canvas.width !== scaledWidth || canvas.height !== scaledHeight) {
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;
        glContext.viewport(0, 0, scaledWidth, scaledHeight);
      }
    };

    function requestRender() {
      if (
        !isDisposed &&
        isDocumentVisible &&
        isElementInView &&
        animationFrameId === 0
      ) {
        animationFrameId = requestAnimationFrame(render);
      }
    }

    const updatePointerTarget = () => {
      if (!pointerKnown) return;
      if (canvasBounds.width === 0 || canvasBounds.height === 0) return;

      const isPointerInside =
        pointerClientX >= canvasBounds.left &&
        pointerClientX <= canvasBounds.right &&
        pointerClientY >= canvasBounds.top &&
        pointerClientY <= canvasBounds.bottom;

      if (!isPointerInside) {
        targetPresence = 0;
        requestRender();
        return;
      }

      const nextX =
        ((pointerClientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
      const nextY = -(
        ((pointerClientY - canvasBounds.top) / canvasBounds.height) * 2 -
        1
      );

      if (targetPresence === 0 && cursorPresence < 0.01) {
        mouseX = nextX;
        mouseY = nextY;
      }
      targetX = nextX;
      targetY = nextY;
      targetPresence = 1;
      requestRender();
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerKnown = true;
      pointerClientX = event.clientX;
      pointerClientY = event.clientY;
      canvasBounds = canvas.getBoundingClientRect();
      updatePointerTarget();
    };

    const onPointerLeave = () => {
      pointerKnown = false;
      targetPresence = 0;
      requestRender();
    };

    const updateLayout = () => {
      canvasBounds = canvas.getBoundingClientRect();
      resizeCanvas();
      updatePointerTarget();
      requestRender();
    };

    window.addEventListener("resize", updateLayout);

    if (UNIFORMS.cursorEnabled) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointercancel", onPointerLeave);
      window.addEventListener("scroll", updateLayout, true);
      window.addEventListener("blur", onPointerLeave);
      document.documentElement.addEventListener("pointerleave", onPointerLeave);
    }

    const resizeObserver = new ResizeObserver(updateLayout);
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isElementInView = entry?.isIntersecting ?? true;
      if (isElementInView) {
        requestRender();
      } else if (animationFrameId !== 0) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
        lastTimestamp = null;
      }
    });
    intersectionObserver.observe(canvas);

    const onVisibilityChange = () => {
      isDocumentVisible = document.visibilityState === "visible";
      if (isDocumentVisible) {
        requestRender();
      } else if (animationFrameId !== 0) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
        lastTimestamp = null;
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    function render(currentTimestamp: number) {
      animationFrameId = 0;
      if (
        isDisposed ||
        !isDocumentVisible ||
        !isElementInView ||
        !glContext ||
        !canvas
      )
        return;

      const deltaTime =
        lastTimestamp === null
          ? 0
          : Math.min((currentTimestamp - lastTimestamp) / 1000, 0.1);
      lastTimestamp = currentTimestamp;
      const followFactor = 1 - Math.exp(-12 * deltaTime);

      mouseX += (targetX - mouseX) * followFactor;
      mouseY += (targetY - mouseY) * followFactor;
      cursorPresence += (targetPresence - cursorPresence) * followFactor;

      resizeCanvas();

      glContext.uniform4f(
        uniformLocations.scene,
        canvas.width,
        canvas.height,
        ((currentTimestamp - animationStartTime) / 1000) * UNIFORMS.timeScale,
        UNIFORMS.colorCount,
      );
      glContext.uniform4f(
        uniformLocations.space,
        UNIFORMS.offsetX,
        UNIFORMS.offsetY,
        mouseX,
        mouseY,
      );
      glContext.uniform4f(
        uniformLocations.cursor,
        UNIFORMS.cursorEnabled ? cursorPresence : 0,
        UNIFORMS.cursorEffect,
        UNIFORMS.cursorStrength,
        UNIFORMS.cursorRadius,
      );

      glContext.drawArrays(glContext.TRIANGLES, 0, 3);

      const isPointerSettling =
        Math.abs(targetX - mouseX) > 0.001 ||
        Math.abs(targetY - mouseY) > 0.001 ||
        Math.abs(targetPresence - cursorPresence) > 0.001;

      if (isTimeAnimated || isPointerSettling) {
        requestRender();
      } else {
        lastTimestamp = null;
      }
    }

    requestRender();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("resize", updateLayout);

      if (UNIFORMS.cursorEnabled) {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointercancel", onPointerLeave);
        window.removeEventListener("scroll", updateLayout, true);
        window.removeEventListener("blur", onPointerLeave);
        document.documentElement.removeEventListener(
          "pointerleave",
          onPointerLeave,
        );
      }

      glContext.deleteBuffer(positionBuffer);
      glContext.deleteProgram(shaderProgram);

      const releaseTimer = window.setTimeout(() => {
        if (pendingContextReleases.get(canvas) !== releaseTimer) return;
        pendingContextReleases.delete(canvas);
        glContext.getExtension("WEBGL_lose_context")?.loseContext();
        canvas.width = 1;
        canvas.height = 1;
      }, 0);

      pendingContextReleases.set(canvas, releaseTimer);
    };
  }, [color]);

  return (
    <canvas ref={canvasRef} className={cn("block size-full", className)} />
  );
}
