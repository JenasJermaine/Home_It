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
      type: "equirectangular",
      panorama: "/images/Panoramic1.jpg",
      autoLoad: true,
      showZoomCtrl: true,
      showFullscreenCtrl: true,
      pitch: 10,
      yaw: 180,
      hfov: 110,
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
