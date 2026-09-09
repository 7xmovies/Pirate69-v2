import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  X, 
  Code2, 
  Layers, 
  Search, 
  Download, 
  ExternalLink, 
  Check, 
  Copy, 
  Terminal, 
  Database, 
  Sparkles,
  ArrowRight,
  Play,
  FileJson
} from 'lucide-react';

interface ApiGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSource?: 'vegamovies' | 'rogmovies' | 'xprimehub';
}

export function ApiGuideModal({ isOpen, onClose, defaultSource = 'vegamovies' }: ApiGuideModalProps) {
  const [activeTab, setActiveTab] = useState<'tutorial' | 'playground' | 'endpoints' | 'code'>('tutorial');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Playground state
  const [selectedSource, setSelectedSource] = useState<'vegamovies' | 'rogmovies' | 'xprimehub'>(defaultSource);
  const [testQuery, setTestQuery] = useState('Avatar');
  const [testLoading, setTestLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<any | null>(null);
  const [chunkLoading, setChunkLoading] = useState(false);
  const [chunkMovieData, setChunkMovieData] = useState<any | null>(null);

  useEffect(() => {
    setSelectedSource(defaultSource);
  }, [defaultSource]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategory = (source: string) => {
    if (source === 'rogmovies') return 'bollywood';
    if (source === 'xprimehub') return 'xprimehub';
    return 'hollywood';
  };

  const runTestSearch = async () => {
    setTestLoading(true);
    setSelectedMovie(null);
    setChunkMovieData(null);
    try {
      const res = await fetch(`/api/json/search?q=${encodeURIComponent(testQuery)}&source=${selectedSource}`);
      const data = await res.json();
      setTestResults(data.results || []);
      if (data.results && data.results.length > 0) {
        handleSelectMovieForDetails(data.results[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTestLoading(false);
    }
  };

  const handleSelectMovieForDetails = async (movie: any) => {
    setSelectedMovie(movie);
    setChunkLoading(true);
    setChunkMovieData(null);
    try {
      const res = await fetch(`/api/json/movie/${encodeURIComponent(movie.id)}?source=${selectedSource}`);
      const data = await res.json();
      setChunkMovieData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setChunkLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-900">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                Movie Fetch & API Guide
                <span className="text-xs bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-sans font-semibold">
                  v2.0
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                How to search movies, read metadata, and resolve direct download links from this database.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 bg-slate-50 dark:bg-slate-950/30 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('tutorial')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'tutorial'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            1. How to Fetch (Step-by-Step)
          </button>
          <button
            onClick={() => setActiveTab('playground')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'playground'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Play className="w-4 h-4 text-amber-500" />
            2. Interactive Fetch Playground
          </button>
          <button
            onClick={() => setActiveTab('endpoints')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'endpoints'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            3. Endpoints & URLs
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'code'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            4. Code Snippets
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: TUTORIAL */}
          {activeTab === 'tutorial' && (
            <div className="space-y-6 max-w-4xl">
              <div className="bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50 rounded-2xl p-4 sm:p-5">
                <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 text-base mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  Decentralized 2-Tier Architecture
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Instead of loading a monolithic 50MB file, this database is organized into lightweight <strong>Index files</strong> for instant search, paired with small <strong>Chunk files (~50KB each)</strong> that store complete movie details and direct download links.
                </p>
              </div>

              {/* Step 1 */}
              <div className="space-y-3 bg-white dark:bg-slate-950/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">1</span>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    Search / Discover Movies (Index File)
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Fetch the lightweight index for your desired category. It contains movie titles, posters, and the assigned <code className="text-indigo-600 dark:text-indigo-400 font-mono">chunk</code> number.
                </p>
                <div className="relative group">
                  <pre className="bg-slate-900 text-slate-200 text-xs p-4 rounded-xl overflow-x-auto font-mono">
{`// 1. Fetch Hollywood Index
const res = await fetch('https://raw.githubusercontent.com/7xmovies/database/main/hollywood-index.json');
const index = await res.json();

// 2. Filter by search term
const searchResults = index.filter(movie => 
  movie.title.toLowerCase().includes('avatar')
);`}
                  </pre>
                  <button 
                    onClick={() => copyToClipboard(`const res = await fetch('https://raw.githubusercontent.com/7xmovies/database/main/hollywood-index.json');\nconst index = await res.json();\nconst searchResults = index.filter(m => m.title.toLowerCase().includes('avatar'));`, 'tut-step1')}
                    className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 border border-slate-700"
                  >
                    {copiedId === 'tut-step1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'tut-step1' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <strong>Index Item Structure:</strong>
                  <code className="block mt-1 font-mono text-slate-700 dark:text-slate-300">
                    {`{ "id": "avatar-fire-and-ash-2025", "title": "Avatar: Fire and Ash", "poster": "https://...", "chunk": 2 }`}
                  </code>
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-3 bg-white dark:bg-slate-950/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">2</span>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    Fetch Movie Details & Download Links (Chunk File)
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Read the <code className="font-mono text-indigo-600 dark:text-indigo-400">movie.chunk</code> number (e.g. <code className="font-mono">2</code>) and fetch that specific chunk file:
                </p>
                <div className="relative group">
                  <pre className="bg-slate-900 text-slate-200 text-xs p-4 rounded-xl overflow-x-auto font-mono">
{`// 3. Fetch specific chunk using movie.chunk (e.g., chunk 2)
const chunkRes = await fetch(\`https://raw.githubusercontent.com/7xmovies/database/main/hollywood/chunk-\${movie.chunk}.json\`);
const chunkData = await chunkRes.json();

// 4. Access full details and download links dictionary by movie.id
const movieDetails = chunkData[movie.id];
console.log(movieDetails.downloadLinks); // Array of { label: "Download Now", url: "https://..." }`}
                  </pre>
                  <button 
                    onClick={() => copyToClipboard(`const chunkRes = await fetch(\`https://raw.githubusercontent.com/7xmovies/database/main/hollywood/chunk-\${movie.chunk}.json\`);\nconst chunkData = await chunkRes.json();\nconst movieDetails = chunkData[movie.id];\nconsole.log(movieDetails.downloadLinks);`, 'tut-step2')}
                    className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 border border-slate-700"
                  >
                    {copiedId === 'tut-step2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'tut-step2' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <strong>Full Movie Chunk Structure:</strong>
                  <code className="block mt-1 font-mono text-slate-700 dark:text-slate-300">
                    {`{ "id": "...", "fullTitle": "...", "poster": "...", "downloadLinks": [{ "label": "Download Now", "url": "https://nexdrive.fit/..." }] }`}
                  </code>
                </div>
              </div>

              {/* Step 3: Or use Built-in API */}
              <div className="space-y-3 bg-white dark:bg-slate-950/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">★</span>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    Alternative: Built-in App API (All-in-One)
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  If your frontend communicates with this site directly, you can use the built-in server endpoints that handle the index filtering and chunk lookup automatically:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">GET</span> /api/search?q=avatar
                    <p className="font-sans text-[11px] text-slate-500 mt-1">Hybrid search: Scraped database + Live results fallback</p>
                  </div>
                  <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">GET</span> /api/json/movie/:id
                    <p className="font-sans text-[11px] text-slate-500 mt-1">Directly resolves movie download links from the chunks</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE PLAYGROUND */}
          {activeTab === 'playground' && (
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Play className="w-4 h-4 text-indigo-500" />
                  Live Fetch Sandbox
                </h3>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <select 
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value as any)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="vegamovies">Hollywood (VegaMovies)</option>
                    <option value="rogmovies">Bollywood (RogMovies)</option>
                    <option value="xprimehub">X-Hub (XPrimeHub)</option>
                  </select>

                  <div className="relative flex-1">
                    <input 
                      type="text"
                      value={testQuery}
                      onChange={(e) => setTestQuery(e.target.value)}
                      placeholder="Type a movie title (e.g. Avatar, WWE, Heart Eyes)..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>

                  <button
                    onClick={runTestSearch}
                    disabled={testLoading}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {testLoading ? 'Searching...' : 'Run Test Fetch'}
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                  <span>Quick keywords:</span>
                  {['Avatar', 'WWE', 'Heart Eyes', 'Mad', 'War'].map(kw => (
                    <button 
                      key={kw} 
                      onClick={() => { setTestQuery(kw); }}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>

              {/* Playground Results Split View */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Step 1: Matching from Index */}
                <div className="space-y-3 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <FileJson className="w-3.5 h-3.5" />
                      Step 1: Index Matches ({testResults.length})
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {getCategory(selectedSource)}-index.json
                    </span>
                  </div>

                  {testResults.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {testResults.map((movie, idx) => (
                        <div 
                          key={idx}
                          onClick={() => handleSelectMovieForDetails(movie)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-3 ${
                            selectedMovie?.id === movie.id
                              ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-400 text-indigo-900 dark:text-indigo-200 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {movie.poster ? (
                              <img src={movie.poster} alt="" className="w-8 h-10 object-cover rounded shrink-0 bg-slate-800" />
                            ) : (
                              <div className="w-8 h-10 bg-slate-200 dark:bg-slate-800 rounded shrink-0" />
                            )}
                            <div className="truncate">
                              <p className="font-semibold truncate">{movie.title}</p>
                              <p className="text-[10px] text-slate-500 font-mono truncate">ID: {movie.id}</p>
                            </div>
                          </div>
                          <span className="shrink-0 font-mono text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded font-bold">
                            Chunk #{movie.chunk || 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-500">
                      {testLoading ? 'Fetching index...' : 'Click "Run Test Fetch" to query the index.'}
                    </div>
                  )}
                </div>

                {/* Step 2: Resolved Chunk Details */}
                <div className="space-y-3 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5" />
                      Step 2: Resolved Links
                    </span>
                    {selectedMovie && (
                      <span className="text-[11px] text-slate-500 font-mono">
                        chunk-{selectedMovie.chunk || 1}.json
                      </span>
                    )}
                  </div>

                  {chunkLoading ? (
                    <div className="py-12 text-center text-xs text-slate-500 animate-pulse">
                      Fetching chunk data from GitHub / storage...
                    </div>
                  ) : chunkMovieData ? (
                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                        <p className="font-bold text-slate-900 dark:text-white line-clamp-2">
                          {chunkMovieData.fullTitle || chunkMovieData.cleanTitle}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Source: <a href={chunkMovieData.sourceUrl} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline">{chunkMovieData.sourceUrl}</a>
                        </p>
                      </div>

                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Extracted Download Links ({chunkMovieData.downloadLinks?.length || 0}):
                      </p>

                      <div className="space-y-1.5 max-h-60 overflow-y-auto">
                        {chunkMovieData.downloadLinks && chunkMovieData.downloadLinks.length > 0 ? (
                          chunkMovieData.downloadLinks.map((dl: any, i: number) => (
                            <a
                              key={i}
                              href={dl.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-lg hover:bg-emerald-100/50 dark:hover:bg-emerald-900/40 transition-colors group"
                            >
                              <span className="font-medium text-emerald-800 dark:text-emerald-300 truncate">
                                {dl.label || 'Direct Download Link'}
                              </span>
                              <ExternalLink className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform" />
                            </a>
                          ))
                        ) : (
                          <p className="text-slate-500 italic">No download links in this chunk entry.</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-500">
                      Select any movie from the left column to view its resolved chunk data.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ENDPOINTS & DIRECT URLS */}
          {activeTab === 'endpoints' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-500" />
                  GitHub Raw CDN URLs (Direct Access)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  You can fetch directly from GitHub's CDN without any authentication:
                </p>

                <div className="space-y-3 font-mono text-xs">
                  {/* Hollywood */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="truncate">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 font-sans">Hollywood Index:</span>
                      <p className="text-slate-600 dark:text-slate-300 truncate">https://raw.githubusercontent.com/7xmovies/database/main/hollywood-index.json</p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard('https://raw.githubusercontent.com/7xmovies/database/main/hollywood-index.json', 'url-hw')}
                      className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 hover:text-indigo-500 shrink-0"
                    >
                      {copiedId === 'url-hw' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Bollywood */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="truncate">
                      <span className="font-bold text-orange-600 dark:text-orange-400 font-sans">Bollywood Index:</span>
                      <p className="text-slate-600 dark:text-slate-300 truncate">https://raw.githubusercontent.com/7xmovies/database/main/bollywood-index.json</p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard('https://raw.githubusercontent.com/7xmovies/database/main/bollywood-index.json', 'url-bw')}
                      className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 hover:text-orange-500 shrink-0"
                    >
                      {copiedId === 'url-bw' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* XPrimeHub */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="truncate">
                      <span className="font-bold text-fuchsia-600 dark:text-fuchsia-400 font-sans">X-Hub (18+) Index:</span>
                      <p className="text-slate-600 dark:text-slate-300 truncate">https://raw.githubusercontent.com/7xmovies/database/main/xprimehub-index.json</p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard('https://raw.githubusercontent.com/7xmovies/database/main/xprimehub-index.json', 'url-xh')}
                      className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 hover:text-fuchsia-500 shrink-0"
                    >
                      {copiedId === 'url-xh' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Chunk template */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="truncate">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-sans">Chunk Template:</span>
                      <p className="text-slate-600 dark:text-slate-300 truncate">https://raw.githubusercontent.com/7xmovies/database/main/{'{category}'}/chunk-{'{chunkNumber}'}.json</p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard('https://raw.githubusercontent.com/7xmovies/database/main/{category}/chunk-{chunkNumber}.json', 'url-chunk')}
                      className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 hover:text-emerald-500 shrink-0"
                    >
                      {copiedId === 'url-chunk' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-indigo-500" />
                  App API Routes (Proxied)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Ready-to-call JSON endpoints provided by the local server:
                </p>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-bold">GET</span>
                      <span className="text-slate-900 dark:text-white">/api/search?q=:query&source=vegamovies</span>
                    </div>
                    <p className="font-sans text-xs text-slate-500 mt-1">
                      Full search combining database index with live fallbacks.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-bold">GET</span>
                      <span className="text-slate-900 dark:text-white">/api/details?url=:postUrl</span>
                    </div>
                    <p className="font-sans text-xs text-slate-500 mt-1">
                      Returns movie title, poster, and instant download links.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CODE SNIPPETS */}
          {activeTab === 'code' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-indigo-500" />
                  JavaScript / TypeScript (Browser or Node.js)
                </h4>
                <div className="relative">
                  <pre className="bg-slate-900 text-slate-200 text-xs p-4 rounded-xl overflow-x-auto font-mono">
{`async function getMovieWithDownloads(query, category = 'hollywood') {
  // 1. Fetch the index file
  const indexUrl = \`https://raw.githubusercontent.com/7xmovies/database/main/\${category}-index.json\`;
  const indexRes = await fetch(indexUrl);
  const indexData = await indexRes.json();

  // 2. Find movie
  const match = indexData.find(m => 
    m.title.toLowerCase().includes(query.toLowerCase())
  );

  if (!match) return null;

  // 3. Fetch the corresponding chunk file
  const chunkUrl = \`https://raw.githubusercontent.com/7xmovies/database/main/\${category}/chunk-\${match.chunk || 1}.json\`;
  const chunkRes = await fetch(chunkUrl);
  const chunkData = await chunkRes.json();

  // 4. Return full movie details with download links
  return chunkData[match.id];
}

// Example usage:
getMovieWithDownloads('Avatar').then(movie => {
  console.log('Title:', movie.fullTitle);
  console.log('Download links:', movie.downloadLinks);
});`}
                  </pre>
                  <button 
                    onClick={() => copyToClipboard(`async function getMovieWithDownloads(query, category = 'hollywood') {\n  const indexUrl = \`https://raw.githubusercontent.com/7xmovies/database/main/\${category}-index.json\`;\n  const indexRes = await fetch(indexUrl);\n  const indexData = await indexRes.json();\n  const match = indexData.find(m => m.title.toLowerCase().includes(query.toLowerCase()));\n  if (!match) return null;\n  const chunkUrl = \`https://raw.githubusercontent.com/7xmovies/database/main/\${category}/chunk-\${match.chunk || 1}.json\`;\n  const chunkRes = await fetch(chunkUrl);\n  const chunkData = await chunkRes.json();\n  return chunkData[match.id];\n}`, 'code-js')}
                    className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 border border-slate-700"
                  >
                    {copiedId === 'code-js' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'code-js' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-500" />
                  Python (requests)
                </h4>
                <div className="relative">
                  <pre className="bg-slate-900 text-slate-200 text-xs p-4 rounded-xl overflow-x-auto font-mono">
{`import requests

def fetch_movie(query, category="hollywood"):
    # 1. Fetch index
    index_url = f"https://raw.githubusercontent.com/7xmovies/database/main/{category}-index.json"
    index = requests.get(index_url).json()
    
    # 2. Match movie
    match = next((m for m in index if query.lower() in m.get("title", "").lower()), None)
    if not match:
        return None
        
    # 3. Fetch chunk
    chunk_num = match.get("chunk", 1)
    chunk_url = f"https://raw.githubusercontent.com/7xmovies/database/main/{category}/chunk-{chunk_num}.json"
    chunk = requests.get(chunk_url).json()
    
    return chunk.get(match["id"])

movie = fetch_movie("Avatar")
print(movie["fullTitle"])
print(movie["downloadLinks"])`}
                  </pre>
                  <button 
                    onClick={() => copyToClipboard(`import requests\n\ndef fetch_movie(query, category="hollywood"):\n    index = requests.get(f"https://raw.githubusercontent.com/7xmovies/database/main/{category}-index.json").json()\n    match = next((m for m in index if query.lower() in m.get("title", "").lower()), None)\n    if not match: return None\n    chunk = requests.get(f"https://raw.githubusercontent.com/7xmovies/database/main/{category}/chunk-{match.get('chunk', 1)}.json").json()\n    return chunk.get(match["id"])`, 'code-py')}
                    className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 border border-slate-700"
                  >
                    {copiedId === 'code-py' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'code-py' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Database updated every time bulk scraper runs and syncs to GitHub.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium rounded-xl transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
