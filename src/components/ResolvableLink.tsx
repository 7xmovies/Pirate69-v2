import React, { useState } from 'react';
import { Loader2, ExternalLink, Download } from 'lucide-react';

function getEpisodeLabel(filename: string, index: number, isSeason: boolean) {
  const sxxexxMatch = filename.match(/[S|s]\d+[E|e](\d+)/);
  if (sxxexxMatch) return `Episode ${parseInt(sxxexxMatch[1], 10)}`;
  
  const epMatch = filename.match(/[E|e]p(?:isode)?\s*\.?\s*(\d+)/i) || filename.match(/[E|e](\d+)(?:\s|\.|-|_|\[|\])/i);
  if (epMatch) return `Episode ${parseInt(epMatch[1], 10)}`;
  
  const numMatch = filename.match(/(?:^|[^a-zA-Z0-9])0*(\d+)(?:v\d)?(?:\.\w{3,4})$/);
  if (numMatch) return `Episode ${numMatch[1]}`;
  
  const catchAllMatch = filename.match(/[\s\-]0*(\d{1,3})[\s\-\.]/);
  if (catchAllMatch) return `Episode ${parseInt(catchAllMatch[1], 10)}`;

  if (isSeason) {
      return `Episode ${index + 1}`;
  }

  let cleanName = filename.replace(/⚡|G-Direct|\[Instant\]|link|-/gi, '').trim();
  if (!cleanName) cleanName = `Link ${index + 1}`;
  
  return cleanName.length > 25 ? cleanName.substring(0, 22) + '...' : cleanName;
}

export function ResolvableLink({ name, url }: { name: string, url: string, key?: React.Key }) {
  const [resolving, setResolving] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [resolvedList, setResolvedList] = useState<{name: string, url: string}[] | null>(null);
  const [error, setError] = useState(false);

  const isNexdrive = url.includes('nexdrive');

  // Attempt to extract quality (e.g., 480p, 720p, 1080p, 2160p, 4k)
  const qualityMatch = name.match(/(480p|720p|1080p|2160p|4k)/i);
  const quality = qualityMatch ? qualityMatch[1].toUpperCase() : null;
  const isSeason = name.toLowerCase().includes('season') || name.toLowerCase().includes('batch') || name.toLowerCase().includes('episodes');

  // Determine colors based on quality and season
  let theme = {
    button: "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20 text-white",
    border: "hover:border-indigo-500/50",
    text: "text-indigo-400",
    bg: "hover:bg-indigo-950/30",
    textHover: "group-hover/link:text-indigo-300",
    iconHover: "group-hover/link:text-indigo-400",
    badge: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
  };

  if (isSeason) {
      if (quality === '480P') {
         theme = { button: "bg-amber-600 hover:bg-amber-500 shadow-amber-900/20 text-white", border: "hover:border-amber-500/50", text: "text-amber-400", bg: "hover:bg-amber-950/30", textHover: "group-hover/link:text-amber-300", iconHover: "group-hover/link:text-amber-400", badge: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
      } else if (quality === '720P') {
         theme = { button: "bg-orange-600 hover:bg-orange-500 shadow-orange-900/20 text-white", border: "hover:border-orange-500/50", text: "text-orange-400", bg: "hover:bg-orange-950/30", textHover: "group-hover/link:text-orange-300", iconHover: "group-hover/link:text-orange-400", badge: "bg-orange-500/10 text-orange-300 border-orange-500/20" };
      } else if (quality === '1080P' || quality === '2160P' || quality === '4K') {
         theme = { button: "bg-red-600 hover:bg-red-500 shadow-red-900/20 text-white", border: "hover:border-red-500/50", text: "text-red-400", bg: "hover:bg-red-950/30", textHover: "group-hover/link:text-red-300", iconHover: "group-hover/link:text-red-400", badge: "bg-red-500/10 text-red-300 border-red-500/20" };
      } else {
         theme = { button: "bg-orange-600 hover:bg-orange-500 shadow-orange-900/20 text-white", border: "hover:border-orange-500/50", text: "text-orange-400", bg: "hover:bg-orange-950/30", textHover: "group-hover/link:text-orange-300", iconHover: "group-hover/link:text-orange-400", badge: "bg-orange-500/10 text-orange-300 border-orange-500/20" };
      }
  } else {
      if (quality === '480P') {
        theme = { button: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20 text-white", border: "hover:border-emerald-500/50", text: "text-emerald-400", bg: "hover:bg-emerald-950/30", textHover: "group-hover/link:text-emerald-300", iconHover: "group-hover/link:text-emerald-400", badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
      } else if (quality === '720P') {
        theme = { button: "bg-blue-600 hover:bg-blue-500 shadow-blue-900/20 text-white", border: "hover:border-blue-500/50", text: "text-blue-400", bg: "hover:bg-blue-950/30", textHover: "group-hover/link:text-blue-300", iconHover: "group-hover/link:text-blue-400", badge: "bg-blue-500/10 text-blue-300 border-blue-500/20" };
      } else if (quality === '1080P') {
        theme = { button: "bg-purple-600 hover:bg-purple-500 shadow-purple-900/20 text-white", border: "hover:border-purple-500/50", text: "text-purple-400", bg: "hover:bg-purple-950/30", textHover: "group-hover/link:text-purple-300", iconHover: "group-hover/link:text-purple-400", badge: "bg-purple-500/10 text-purple-300 border-purple-500/20" };
      } else if (quality === '2160P' || quality === '4K') {
        theme = { button: "bg-rose-600 hover:bg-rose-500 shadow-rose-900/20 text-white", border: "hover:border-rose-500/50", text: "text-rose-400", bg: "hover:bg-rose-950/30", textHover: "group-hover/link:text-rose-300", iconHover: "group-hover/link:text-rose-400", badge: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
      }
  }

  const handleResolve = async () => {
    if (resolvedUrl) {
      window.open(resolvedUrl, '_blank');
      return;
    }

    if (!isNexdrive) {
      window.open(url, '_blank');
      return;
    }

    try {
      setResolving(true);
      setError(false);
      const res = await fetch(`/api/resolve-link?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      
      if (data.resolvedUrls && data.resolvedUrls.length > 0) {
        setResolvedList(data.resolvedUrls);
      } else if (data.resolvedUrl) {
        setResolvedUrl(data.resolvedUrl);
        window.open(data.resolvedUrl, '_blank');
      } else {
        setError(true);
        window.open(url, '_blank'); // fallback
      }
    } catch (err) {
      setError(true);
      window.open(url, '_blank'); // fallback
    } finally {
      setResolving(false);
    }
  };

  if (resolvedList) {
    return (
      <div className={`bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col gap-4 group transition-colors ${theme.border}`}>
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
           <span className="text-slate-800 dark:text-slate-200 font-medium leading-snug flex items-center flex-wrap gap-2">
             <span className={`px-2 py-0.5 text-xs font-semibold border rounded-md uppercase tracking-wider ${theme.badge}`}>
               {isSeason ? 'SEASON PACK' : (quality || 'LINK')}
             </span>
             {name}
           </span>
           <span className={`text-sm ${theme.text} font-medium shrink-0 bg-slate-50 dark:bg-slate-950 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800`}>
             {resolvedList.length} {isSeason ? 'Episodes' : 'Mirrors'} Available
           </span>
         </div>
         
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-2">
            {resolvedList.map((ep, idx) => (
              <a 
                key={idx}
                href={ep.url}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium text-sm shadow-sm ${theme.button}`}
              >
                <span className="truncate pr-2">{getEpisodeLabel(ep.name, idx, isSeason)}</span>
                <Download className="w-4 h-4 shrink-0 opacity-80" />
              </a>
            ))}
         </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 group transition-colors ${theme.border}`}>
       <span className="text-slate-700 dark:text-slate-300 font-medium leading-snug pr-4 flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
         <span className={`px-2 py-0.5 text-xs font-semibold border rounded-md uppercase tracking-wider shrink-0 w-fit ${theme.badge}`}>
           {isSeason ? 'SEASON PACK' : (quality || 'LINK')}
         </span>
         <span>{name}</span>
         {resolvedUrl && <div className={`text-xs mt-1 truncate ${theme.text}`}>{resolvedUrl}</div>}
       </span>
       
       <button 
         onClick={handleResolve}
         disabled={resolving}
         className={`shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all shadow-md disabled:opacity-70 disabled:cursor-wait ${theme.button}`}
       >
         {resolving ? (
           <><Loader2 className="w-4 h-4 animate-spin" /> Resolving...</>
         ) : resolvedUrl ? (
           <><Download className="w-4 h-4" /> Download Ready</>
         ) : isNexdrive ? (
           <><Download className="w-4 h-4" /> {isSeason ? 'Extract Episodes' : 'Download Now'}</>
         ) : (
           <><ExternalLink className="w-4 h-4" /> Open Link</>
         )}
       </button>
    </div>
  );
}
