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
  const [renderProgress, setRenderProgress] = useState(0);

  const exportVideo = async (payload: RenderPayload) => {
    if (!projectId || !userId) {
      console.error('Missing projectId or userId for export');
      return;
    }

    setIsRendering(true);
    setDownloadUrl(null);
    setRenderProgress(0);

    try {
      setRenderProgress(10); // Starting render
      
      // Transform clips to match API expected format
      const transformedPayload = {
        clips: payload.clips.map(clip => ({
          assetUrl: clip.url,
          length: clip.trimDuration || clip.duration,
          startFrom: clip.trimStart || 0,
          muted: clip.muted || false
        }))
      };
      
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transformedPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start render');
      }

      const data = await response.json();
      const renderId = data.id || data.renderId;
      if (!renderId) throw new Error('No render id returned');

      setRenderProgress(20); // Render job created
      const shotstackUrl = await pollForStatus(renderId);
      if (!shotstackUrl) throw new Error('Render failed');

      setRenderProgress(70); // Render complete, downloading
      const videoRes = await fetch(shotstackUrl);
      if (!videoRes.ok) throw new Error('Failed to download rendered video');
      const videoBlob = await videoRes.blob();

      setRenderProgress(80); // Uploading to Firebase
      const storageRef = ref(storage, `users/${userId}/exports/${projectId}.mp4`);
      await uploadBytes(storageRef, videoBlob);

      const firebaseUrl = await getDownloadURL(storageRef);

      setRenderProgress(90); // Updating database
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        finalVideoUrl: firebaseUrl,
        status: 'completed',
        lastExportedAt: serverTimestamp(),
      });

      setRenderProgress(100); // Complete
      setDownloadUrl(firebaseUrl);
      return firebaseUrl;
    } catch (error) {
      console.error('Export error:', error);
      alert('Something went wrong during export.');
      return null;
    } finally {
      setIsRendering(false);
      setRenderProgress(0);
    }
  };

  const pollForStatus = async (id: string): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      let pollProgress = 30;
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/render/status?id=${id}`);
          if (!res.ok) throw new Error('Status check failed');
          const data = await res.json();

          // Gradually increase progress while polling (30% to 65%)
          if (pollProgress < 65) {
            pollProgress += 5;
            setRenderProgress(pollProgress);
          }

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

  return { isRendering, downloadUrl, exportVideo, setDownloadUrl, renderProgress };
}