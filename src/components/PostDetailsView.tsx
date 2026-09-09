import React, { useState } from 'react';
import { Loader2, ArrowLeft, Film, Download, Share2, Bookmark, BookmarkCheck, Unlock, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { PostDetails } from '../types';
import { getProxyUrl } from '../utils/url';
import { ResolvableLink } from './ResolvableLink';

interface PostDetailsViewProps {
  loading: boolean;
  error: string | null;
  details: PostDetails | null;
  selectedPostUrl: string | null;
  onBack: () => void;
  isInWatchlist: boolean;
  onToggleWatchlist: () => void;
}

export function PostDetailsView({ loading, error, details, selectedPostUrl, onBack, isInWatchlist, onToggleWatchlist }: PostDetailsViewProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);

  const handleShare = async () => {
    if (!details) return;
    const shareData = {
      title: details.title,
      text: `Check out ${details.title} on Pirate69`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err: any) {
         if (err.name !== 'AbortError') {
             copyToClipboard();
         }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => toast.success("Link copied to clipboard!"))
      .catch(() => toast.error("Failed to copy link."));
  };

  if (loading) {
     return (
       <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="w-12 h-12 text-slate-600 dark:text-slate-400 animate-spin" />
          <p className="text-slate-500 font-medium">Extracting details...</p>
       </div>
     )
  }

  if (error) {
     return (
       <div className="py-12">
         <button onClick={onBack} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-white transition-colors mb-8">
           <ArrowLeft className="w-5 h-5" /> Back to Search
         </button>
         <div className="max-w-2xl mx-auto p-4 bg-red-950/30 border border-red-900/50 rounded-xl text-red-400 text-center">
           {error}
         </div>
       </div>
     )
  }

  if (!details) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-white transition-colors">
           <ArrowLeft className="w-5 h-5" /> Back to Search Results
        </button>
        <div className="flex items-center gap-3">
          <button 
            onClick={onToggleWatchlist} 
            className={`flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 border ${isInWatchlist ? 'border-indigo-500/50 text-indigo-400' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'} rounded-lg transition-colors font-medium`}
          >
             {isInWatchlist ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
             <span className="hidden sm:inline">{isInWatchlist ? 'Saved' : 'Watchlist'}</span>
          </button>
          <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors font-medium">
             <Share2 className="w-4 h-4" /> <span className="hidden sm:inline">Share Link</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         {/* Left Column: Thumbnail */}
         <div className="lg:col-span-4">
            <div className="bg-white dark:bg-white/80 dark:bg-white dark:bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl sticky top-24">
              {details.thumbnail ? (
                <img 
                  src={getProxyUrl(details.thumbnail)} 
                  alt={details.title}
                  referrerPolicy="no-referrer"
                  className="w-full rounded-xl object-cover aspect-[2/3]"
                />
              ) : (
                <div className="w-full aspect-[2/3] flex items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-xl">
                  <Film className="w-16 h-16 text-slate-800" />
                </div>
              )}
            </div>
         </div>

         {/* Right Column: Details & Links */}
         <div className="lg:col-span-8 space-y-12">
            <div>
               <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 dark:text-white leading-tight mb-4 font-heading">
                 {details.title}
               </h1>
            </div>

            {/* Download Links */}
            {details.downloadLinks && details.downloadLinks.length > 0 && (
              <div>
                 <h2 className="text-2xl font-medium text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-3">
                   <Download className="w-6 h-6 text-emerald-500" /> Download Links
                 </h2>
                 
                 {!isUnlocked ? (
                   <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-8 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
                     <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mb-2">
                       <Lock className="w-8 h-8 text-slate-500 dark:text-slate-400" />
                     </div>
                     <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Links are locked</h3>
                     <p className="text-slate-600 dark:text-slate-400 max-w-md">
                       Click the button below to unlock and reveal the high-speed download links.
                     </p>
                     <button
                       onClick={() => setIsUnlocked(true)}
                       className="mt-4 flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/30"
                     >
                       <Unlock className="w-5 h-5" />
                       Unlock Links
                     </button>
                   </div>
                 ) : (
                   <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {details.downloadLinks.map((link, idx) => (
                        <ResolvableLink key={idx} name={link.label || (link as any).name || "Download Link"} url={link.url} />
                      ))}
                   </div>
                 )}
              </div>
            )}

            {/* Screenshots */}
            {details.screenshots && details.screenshots.length > 0 && (
              <div>
                 <h2 className="text-2xl font-medium text-slate-900 dark:text-slate-100 mb-6">Screenshots</h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {details.screenshots.map((src, idx) => (
                       <div key={idx} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                         <img 
                           src={getProxyUrl(src)} 
                           alt={`Screenshot ${idx + 1}`} 
                           loading="lazy"
                           referrerPolicy="no-referrer"
                           className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
                         />
                       </div>
                    ))}
                 </div>
              </div>
            )}
         </div>
      </div>
    </div>
  );
}
