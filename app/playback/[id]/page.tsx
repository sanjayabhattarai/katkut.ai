// app/playback/[id]/page.tsx
"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '../../api/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface Project {
  id: string;
  finalVideoUrl?: string;
}

export default function PlaybackPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    const fetchProject = async () => {
      try {
        const docRef = doc(db, 'projects', projectId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProject({
            id: docSnap.id,
            ...docSnap.data()
          } as Project);
        }
      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  if (!project?.finalVideoUrl) return <div className="h-screen bg-black flex items-center justify-center text-white">Video not found</div>;

  return (
    <main className="h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <video
          src={project.finalVideoUrl}
          controls
          autoPlay
          className="w-full h-full rounded-lg"
          playsInline
        />
      </div>
    </main>
  );
}
