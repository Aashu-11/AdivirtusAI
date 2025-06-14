"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { tw, components, fonts, utils } from "@/config/design-system";

export default function RoadmapPage() {
  const [user, setUser] = useState<any>(null);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchRoadmap = async () => {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth/signin");
        return;
      }
      setUser(session.user);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const res = await fetch(`${backendUrl}/api/roadmap/generate-roadmap/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
        });
        if (!res.ok) {
          let errMsg = "Failed to fetch roadmap";
          try {
            const err = await res.json();
            errMsg = err.error || errMsg;
          } catch {
            errMsg = `HTTP ${res.status}`;
          }
          throw new Error(errMsg);
        }
        const data = await res.json();
        setRoadmap(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRoadmap();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="text-red-500 text-lg font-semibold mb-4">{error}</div>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!roadmap) {
    return null;
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="bg-[#0E0E0E] border border-gray-800/70 rounded-2xl shadow-xl p-8 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ fontFamily: fonts.primary }}>
          {roadmap.title}
        </h1>
        <p className="text-gray-300 mb-4">{roadmap.description}</p>
        <div className="flex flex-wrap gap-4 mb-4">
          <span className="bg-blue-600/10 text-blue-400 px-3 py-1 rounded-full text-xs font-medium">
            Difficulty: {roadmap.difficulty_level}
          </span>
          <span className="bg-emerald-600/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium">
            Total Hours: {roadmap.total_estimated_hours}
          </span>
          <span className="bg-purple-600/10 text-purple-400 px-3 py-1 rounded-full text-xs font-medium">
            Status: {roadmap.status}
          </span>
        </div>
        <div className="text-xs text-gray-500 mb-2">Created: {new Date(roadmap.created_at).toLocaleString()}</div>
        {roadmap.user_name && (
          <div className="text-lg text-white font-semibold mb-2">Hello {roadmap.user_name}!</div>
        )}
        {roadmap.roadmap_text && (
          <div className="prose prose-invert max-w-none bg-gray-900/80 rounded-xl p-6 mt-4 mb-2 text-base leading-relaxed whitespace-pre-line" style={{fontFamily: fonts.primary}}>
            {roadmap.roadmap_text.split('\n').map((line, idx) => (
              <span key={idx}>{line}<br /></span>
            ))}
          </div>
        )}
      </div>

      {/* Skill Gaps */}
      {roadmap.skill_gaps && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-blue-400 mb-2">Skill Gaps</h2>
          <pre className="bg-gray-900 rounded p-4 text-gray-200 overflow-x-auto text-sm">
            {JSON.stringify(roadmap.skill_gaps, null, 2)}
          </pre>
        </div>
      )}

      {/* Learning Profile */}
      {roadmap.learning_profile && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-emerald-400 mb-2">Learning Profile</h2>
          <pre className="bg-gray-900 rounded p-4 text-gray-200 overflow-x-auto text-sm">
            {JSON.stringify(roadmap.learning_profile, null, 2)}
          </pre>
        </div>
      )}

      {/* Learning Paths */}
      {roadmap.learning_paths && roadmap.learning_paths.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-purple-400 mb-4">Learning Paths</h2>
          {roadmap.learning_paths.map((path: any, idx: number) => (
            <div key={idx} className="mb-6 p-4 bg-gray-800 rounded-xl shadow">
              <h3 className="text-xl font-bold text-white mb-2">{path.skill_name || `Path ${idx + 1}`}</h3>
              <div className="text-gray-300 mb-2">Estimated Hours: {path.total_estimated_hours}</div>
              {path.nodes && path.nodes.length > 0 && (
                <ol className="list-decimal ml-6 text-gray-200">
                  {path.nodes.map((node: any, nidx: number) => (
                    <li key={nidx} className="mb-2">
                      <div className="font-semibold text-blue-300">{node.title}</div>
                      <div className="text-xs text-gray-400 mb-1">Type: {node.node_type} | Difficulty: {node.difficulty} | Time: {node.estimated_time} min</div>
                      {node.resources && node.resources.length > 0 && (
                        <ul className="list-disc ml-6 text-xs text-emerald-300">
                          {node.resources.map((res: any, ridx: number) => (
                            <li key={ridx}>
                              <a href={res.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-400">{res.title}</a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 