import React, { useState, useRef } from 'react';
import { Camera, X, Check, Trash2, ShieldCheck, RefreshCw } from 'lucide-react';
import type { ChecklistItem } from '../types.js';

interface PhotoProofModalProps {
  item: ChecklistItem | null;
  onClose: () => void;
  onSavePhoto: (itemId: string, photoDataUrl: string) => void;
  onDeletePhoto: (itemId: string) => void;
}

export const PhotoProofModal: React.FC<PhotoProofModalProps> = ({
  item,
  onClose,
  onSavePhoto,
  onDeletePhoto,
}) => {
  const [isCapturingLive, setIsCapturingLive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!item) return null;

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCapturingLive(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Camera access denied or unavailable.';
      setCameraError(msg + ' You can also select a photo file from your device below.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCapturingLive(false);
  };

  const captureSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        stopCamera();
        onSavePhoto(item.id, dataUrl);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDimension = 1000;
            let width = img.width;
            let height = img.height;

            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
              onSavePhoto(item.id, compressedDataUrl);
            } else {
              onSavePhoto(item.id, reader.result as string);
            }
          };
          img.src = reader.result;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-lg w-full border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-stone-700 dark:text-stone-300" />
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">
              Photo Proof: {item.title}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Take a quick reassurance snapshot of the locked deadbolt, unplugged flat iron, or closed garage. Review it anytime you're away and wondering.
          </p>

          {cameraError && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300">
              {cameraError}
            </div>
          )}

          {/* Active Live Video Stream */}
          {isCapturingLive ? (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={captureSnapshot}
                  className="flex-1 min-h-[44px] py-2.5 px-4 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-xs font-semibold hover:bg-stone-800 dark:hover:bg-white flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Photo Now</span>
                </button>
                <button
                  onClick={stopCamera}
                  className="px-4 py-2 text-xs text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : item.photoProofUrl ? (
            /* Existing photo proof preview */
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-950">
                <img
                  src={item.photoProofUrl}
                  alt={`Proof of ${item.title}`}
                  className="w-full h-auto max-h-72 object-contain mx-auto"
                />
                <div className="absolute bottom-2 left-2 right-2 bg-stone-900/80 backdrop-blur-xs text-white text-[11px] p-2 rounded-lg flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Verified by {item.checkedBy || 'Household Member'}
                  </span>
                  <span className="font-mono text-stone-300">
                    {item.checkedAt ? new Date(item.checkedAt).toLocaleTimeString() : 'Verified'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  onClick={startCamera}
                  className="px-3 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 dark:text-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-lg flex items-center gap-1.5 min-h-[40px] cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retake Photo</span>
                </button>

                <button
                  onClick={() => onDeletePhoto(item.id)}
                  className="px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 rounded-lg flex items-center gap-1.5 min-h-[40px] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Photo</span>
                </button>
              </div>
            </div>
          ) : (
            /* Empty state: options to take photo */
            <div className="border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center mx-auto">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                  No photo proof attached yet
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Snap a quick picture right now to confirm with absolute certainty.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-2 pt-2">
                <button
                  onClick={startCamera}
                  className="px-4 py-2.5 text-xs font-semibold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl hover:bg-stone-800 dark:hover:bg-white flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Use Live Camera</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                >
                  <span>Select from Device</span>
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-50 dark:bg-stone-900/60 border-t border-stone-100 dark:border-stone-800 flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-xs font-medium text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100 rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
