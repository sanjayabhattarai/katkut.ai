import { useState } from 'react';
import axios from 'axios';

interface Clip {
  url: string;
  duration: number;
  trimStart?: number;
  trimDuration?: number;
  muted?: boolean;
}

export const useRenderExport = () => {
  const [rendering, setRendering] = useState(false);
  const [finalVideoUrl, setFinalVideoUrl] = useState("");

  const handleRender = async (clips: Clip[]) => {
    setRendering(true);
    try {
      const res = await axios.post('/api/render', { clips });
      if(res.data.id) checkStatus(res.data.id);
    } catch (e) {
      alert("Render failed");
      setRendering(false);
    }
  };

  const checkStatus = (id: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`/api/render/status?id=${id}`);
        if (res.data.status === 'done') {
            clearInterval(interval);
            setFinalVideoUrl(res.data.url);
            setRendering(false);
        } else if (res.data.status === 'failed') {
            clearInterval(interval);
            alert("Render Failed");
            setRendering(false);
        }
      } catch (e) {}
    }, 3000);
  };

  return {
    rendering,
    finalVideoUrl,
    setFinalVideoUrl,
    handleRender,
  };
};
