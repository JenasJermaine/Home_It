import { useEffect, useRef } from "react";
import "pannellum/build/pannellum.css";
import "pannellum/build/pannellum.js";

const PanoramicPage = () => {
  const viewerRef = useRef(null);
  const pannellumInstanceRef = useRef(null);

  useEffect(() => {
    if (!viewerRef.current) return;
    const pannellum = window.pannellum;
    if (!pannellum?.viewer) return;

    pannellumInstanceRef.current = pannellum.viewer(viewerRef.current, {
      autoLoad: true,
      showZoomCtrl: true,
      showFullscreenCtrl: true,
      default: {
        firstScene: "outside",
        sceneFadeDuration: 1000,
      },
      scenes: {
        outside: {
          type: "equirectangular",
          panorama: "/images/Panoramic1.jpg",
          pitch: 10,
          yaw: 180,
          hfov: 110,
          hotSpots: [
            {
              pitch: -2,
              yaw: 120,
              type: "scene",
              text: "Enter living room",
              sceneId: "living-room",
            },
          ],
        },
        "living-room": {
          type: "equirectangular",
          panorama: "/images/panoramic2.jpg",
          pitch: 6,
          yaw: 90,
          hfov: 110,
          hotSpots: [
            {
              pitch: -2,
              yaw: -130,
              type: "scene",
              text: "Back outside",
              sceneId: "outside",
            },
          ],
        },
      },
    });

    return () => {
      if (pannellumInstanceRef.current) {
        pannellumInstanceRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="container py-4">
      <h3 className="fw-bold mb-3">Panoramic Viewer</h3>
      <div
        ref={viewerRef}
        style={{
          width: "100%",
          height: "520px",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      />
    </div>
  );
};

export default PanoramicPage;
