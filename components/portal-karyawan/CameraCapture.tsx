"use client";

import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Camera, SwitchCamera, X } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (photos: File[]) => void;
  maxPhotos?: number;
}

export default function CameraCapture({
  onCapture,
  maxPhotos = 3,
}: CameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const videoConstraints = {
    facingMode: facingMode,
  };

  const capturePhoto = useCallback(() => {
    if (webcamRef.current && photos.length < maxPhotos) {
      const imageSrc = webcamRef.current.getScreenshot();
      
      if (imageSrc) {
        const newPhotos = [...photos, imageSrc];
        setPhotos(newPhotos);

        // Convert base64 to File objects
        Promise.all(
          newPhotos.map((base64, i) =>
            fetch(base64)
              .then((r) => r.blob())
              .then(
                (b) => new File([b], `photo_${i + 1}.jpg`, { type: "image/jpeg" })
              )
          )
        ).then((files) => {
          onCapture(files);
        });
      }
    }
  }, [photos, maxPhotos, onCapture]);

  const switchCamera = useCallback(() => {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
  }, []);

  const deletePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);

    // Update parent
    Promise.all(
      newPhotos.map((base64, i) =>
        fetch(base64)
          .then((r) => r.blob())
          .then(
            (b) => new File([b], `photo_${i + 1}.jpg`, { type: "image/jpeg" })
          )
      )
    ).then((files) => {
      onCapture(files);
    });
  };

  return (
    <div className="space-y-4">
      {photos.length < maxPhotos && (
        <div className="relative">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="w-full rounded-lg bg-black"
            mirrored={facingMode === "user"}
          />

          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <Button
              type="button"
              onClick={capturePhoto}
              size="lg"
              className="rounded-full bg-white text-black hover:bg-gray-200"
            >
              <Camera className="w-6 h-6" />
            </Button>

            <Button
              type="button"
              onClick={switchCamera}
              size="lg"
              variant="secondary"
              className="rounded-full"
            >
              <SwitchCamera className="w-5 h-5" />
            </Button>
          </div>

          {/* Info kamera yang aktif */}
          <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            {facingMode === "user" ? "Kamera Depan" : "Kamera Belakang"}
          </div>
        </div>
      )}

      {photos.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">
              Foto diambil: {photos.length}/{maxPhotos}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo, index) => (
              <div key={index} className="relative group">
                <img
                  src={photo}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => deletePhoto(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}