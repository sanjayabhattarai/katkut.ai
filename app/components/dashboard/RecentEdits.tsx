// components/dashboard/RecentEdits.tsx
import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';

interface Project {
  id: string;
  name?: string;
  finalVideoUrl?: string;
  createdAt: any;
  status: string;
}

export function RecentEdits({ userId }: { userId: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!userId) return;

      try {
        // Query: Get projects by this user, that have a final URL, sorted by newest
        // Note: You might need a composite index in Firebase Console for this specific query
        const q = query(
          collection(db, 'projects'),
          where('userId', '==', userId),
          where('status', '==', 'completed'), // Only show finished videos
          orderBy('lastExportedAt', 'desc'),
          limit(6) // Only show the last 6
        );

        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Project[];

        setProjects(data);
      } catch (error) {
        console.error("Error fetching edits:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [userId]);

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading gallery...</div>;
  if (projects.length === 0) return null; // Hide section if no edits

  return (
    <section className="w-full py-8">
      <div className="flex items-center justify-between mb-6 px-2">
         <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🎞️</span> Your Last Edits
         </h2>
         {/* Optional: 'See All' link could go here */}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {projects.map((project) => (
          <div key={project.id} className="group relative aspect-[9/16] bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-blue-500/50 transition-all hover:shadow-2xl hover:-translate-y-1">
            
            {/* 1. Video Thumbnail (Auto-play on hover effect) */}
            <video 
              src={project.finalVideoUrl}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              muted
              playsInline
              onMouseOver={e => e.currentTarget.play()}
              onMouseOut={e => {
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0;
              }}
            />

            {/* 2. Overlay Actions (Visible on Hover) */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
               
               {/* Play/View Button */}
               <Link 
                 href={`/playback/${project.id}`}
                 className="bg-white text-black rounded-full p-3 hover:scale-110 transition"
                 title="Watch Full Screen"
               >
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
               </Link>

               <div className="flex gap-2">
                 {/* Download Button */}
                 <button 
                    onClick={async (e) => {
                      e.preventDefault();
                      try {
                        // Fetch the video blob
                        const response = await fetch(project.finalVideoUrl!);
                        const blob = await response.blob();
                        
                        // Create blob URL and trigger download
                        const blobUrl = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = blobUrl;
                        a.download = `katkut-edit-${project.id}.mp4`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(blobUrl);
                      } catch (error) {
                        console.error('Download failed:', error);
                        alert('Failed to download video');
                      }
                    }}
                    className="bg-white text-black p-2 rounded-full hover:bg-gray-200 transition"
                    title="Download"
                 >
                    <Image src="/assets/download.png" alt="Download" width={16} height={16} />
                 </button>

                 {/* Remix/Edit Button */}
                 <Link 
                   href={`/editor/${project.id}`}
                   className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-500 transition"
                   title="Open Editor"
                 >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                 </Link>
               </div>
            </div>

            {/* 3. Status Badge */}
            <div className="absolute top-2 right-2 bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-500/30 backdrop-blur-md">
               READY
            </div>

          </div>
        ))}
      </div>
    </section>
  );
}