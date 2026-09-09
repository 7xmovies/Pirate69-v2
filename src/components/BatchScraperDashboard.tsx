import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Terminal, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

interface ScrapeJob {
  id: string;
  source: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  logs: string[];
}

export function BatchScraperDashboard() {
  const [source, setSource] = useState('vegamovies');
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(5);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobState, setJobState] = useState<ScrapeJob | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [jobState?.logs]);

  // Poll for job status if active
  useEffect(() => {
    let interval: number;

    const fetchStatus = async () => {
      if (!activeJobId) return;
      try {
        const res = await fetch(`/api/scrape/status/${activeJobId}`);
        if (res.ok) {
          const data = await res.json();
          setJobState(data);
          if (data.status === 'completed' || data.status === 'error') {
            setActiveJobId(null);
          }
        }
      } catch (err) {
        console.error('Error fetching job status', err);
      }
    };

    if (activeJobId) {
      fetchStatus(); // Initial fetch
      interval = window.setInterval(fetchStatus, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeJobId]);

  const handleStart = async () => {
    try {
      const res = await fetch('/api/scrape/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source,
          startPage,
          endPage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveJobId(data.jobId);
        setJobState({
          id: data.jobId,
          source,
          status: 'running',
          progress: 0,
          logs: ['Initializing scrape job...'],
        });
      } else {
        console.error('Failed to start job');
      }
    } catch (err) {
      console.error('Error starting job', err);
    }
  };

  const handleStop = async () => {
    if (!activeJobId) return;
    try {
      await fetch(`/api/scrape/stop/${activeJobId}`, { method: 'POST' });
    } catch (err) {
      console.error('Error stopping job', err);
    }
  };

  const handleSync = async () => {
    try {
      const res = await fetch('/api/scrape/sync', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setActiveJobId(data.jobId);
        setJobState({
          id: data.jobId,
          source: 'git-sync',
          status: 'running',
          progress: 50,
          logs: ['Initializing database sync...'],
        });
      }
    } catch (err) {
      console.error('Error starting sync', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold font-heading flex items-center gap-3">
          <Terminal className="w-8 h-8 text-indigo-500" />
          Batch Scraper Dashboard
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Automate the extraction of movie data and bundle it into JSON chunks.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="md:col-span-1 space-y-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-semibold text-lg border-b border-slate-100 dark:border-slate-800 pb-3">Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Source</label>
              <select 
                value={source}
                onChange={(e) => setSource(e.target.value)}
                disabled={activeJobId !== null}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <option value="vegamovies">VegaMovies (Hollywood)</option>
                <option value="rogmovies">RogMovies (Bollywood)</option>
                <option value="xprimehub">X-Hub (XPrimeHub)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Page</label>
                <input 
                  type="number"
                  min="1"
                  value={startPage}
                  onChange={(e) => setStartPage(parseInt(e.target.value) || 1)}
                  disabled={activeJobId !== null}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Page</label>
                <input 
                  type="number"
                  min={startPage}
                  value={endPage}
                  onChange={(e) => setEndPage(parseInt(e.target.value) || startPage)}
                  disabled={activeJobId !== null}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              {!activeJobId && (!jobState || jobState.status === 'completed' || jobState.status === 'error' || jobState.status === 'stopped') ? (
                <>
                    <button
                    onClick={handleStart}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/25"
                    >
                    <Play className="w-4 h-4" fill="currentColor" /> Start Scraping
                    </button>
                    
                    <button
                    onClick={handleSync}
                    className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg font-medium transition-colors"
                    >
                    <RefreshCw className="w-4 h-4" /> Push to GitHub
                    </button>
                </>
              ) : (
                <button
                  onClick={handleStop}
                  className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-red-500/25"
                >
                  <Square className="w-4 h-4" fill="currentColor" /> Stop Scraping
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Console / Monitor */}
        <div className="md:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-lg shadow-slate-900/50 h-[500px]">
          {/* Header */}
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <span className="ml-2 text-xs font-mono text-slate-400">scraper-terminal ~ {source}</span>
            </div>
            
            {jobState && (
              <div className="flex items-center gap-2 text-xs font-mono">
                {jobState.status === 'running' && (
                  <span className="text-indigo-400 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> RUNNING</span>
                )}
                {jobState.status === 'completed' && (
                  <span className="text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> COMPLETED</span>
                )}
                {jobState.status === 'error' && (
                  <span className="text-red-400 flex items-center gap-1"><XCircle className="w-3 h-3" /> FAILED</span>
                )}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {jobState && (
            <div className="h-1 bg-slate-800 w-full">
              <div 
                className="h-full bg-indigo-500 transition-all duration-500 ease-out"
                style={{ width: `${jobState.progress}%` }}
              ></div>
            </div>
          )}

          {/* Logs */}
          <div className="p-4 overflow-y-auto flex-1 font-mono text-xs sm:text-sm text-slate-300 space-y-1">
            {!jobState ? (
              <div className="text-slate-600 italic">Waiting to start job...</div>
            ) : (
              jobState.logs.map((log, idx) => (
                <div key={idx} className="break-all">
                  <span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                  <span className={
                    log.includes('[ERROR]') ? 'text-red-400' :
                    log.includes('[SUCCESS]') || log.includes('✅') ? 'text-green-400' :
                    log.includes('[NEW]') ? 'text-yellow-300' :
                    log.includes('[SKIP]') ? 'text-slate-500' : 'text-slate-300'
                  }>
                    {log}
                  </span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
