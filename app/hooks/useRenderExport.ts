import { useState } from 'react';
import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface ClipPayload {
  url: string;
  duration: number;
  trimStart?: number;
  trimDuration?: number;
  muted?: boolean;
}

interface RenderPayload {
  clips: ClipPayload[];
}

export function useRenderExport(projectId?: string, userId?: string) {
  const [isRendering, setIsRendering] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const exportVideo = async (payload: RenderPayload) => {
    if (!projectId || !userId) {
      console.error('Missing projectId or userId for export');
      return;
    }

    setIsRendering(true);
    setDownloadUrl(null);

    try {
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to start render');
      }

      const { id: renderId } = await response.json();
      if (!renderId) throw new Error('No render id returned');

      const shotstackUrl = await pollForStatus(renderId);
      if (!shotstackUrl) throw new Error('Render failed');

      const videoRes = await fetch(shotstackUrl);
      if (!videoRes.ok) throw new Error('Failed to download rendered video');
      const videoBlob = await videoRes.blob();

      const storageRef = ref(storage, `users/${userId}/exports/${projectId}.mp4`);
      await uploadBytes(storageRef, videoBlob);

      const firebaseUrl = await getDownloadURL(storageRef);

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        finalVideoUrl: firebaseUrl,
        status: 'completed',
        lastExportedAt: serverTimestamp(),
      });

      setDownloadUrl(firebaseUrl);
      return firebaseUrl;
    } catch (error) {
      console.error('Export error:', error);
      alert('Something went wrong during export.');
      return null;
    } finally {
      setIsRendering(false);
    }
  };

  const pollForStatus = async (id: string): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/render/status?id=${id}`);
          if (!res.ok) throw new Error('Status check failed');
          const data = await res.json();

          if (data.status === 'done' && data.url) {
            clearInterval(interval);
            resolve(data.url as string);
          } else if (data.status === 'failed') {
            clearInterval(interval);
            resolve(null);
          }
        } catch (e) {
          clearInterval(interval);
          reject(e);
        }
      }, 2000);
    });
  };

  return { isRendering, downloadUrl, exportVideo, setDownloadUrl };
}