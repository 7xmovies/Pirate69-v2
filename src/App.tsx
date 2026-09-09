import React, { useState, useEffect } from 'react';
import { Film, Loader2, Menu, History, Sun, Moon, Trash2, Bell } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { MediaItem, SearchResponse, PostDetails, DetailsResponse } from './types';
import { SearchBar } from './components/SearchBar';
import { MediaGrid } from './components/MediaGrid';
import { MediaGridSkeleton } from './components/MediaGridSkeleton';
import { PostDetailsView } from './components/PostDetailsView';
import { Sidebar } from './components/Sidebar';
import { BatchScraperDashboard } from './components/BatchScraperDashboard';

const CATEGORIES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Sci-Fi', 'Horror', 'Thriller', 'Animation', 'Netflix'
];

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`https://raw.githubusercontent.com/Imtiaz9800/Notification/main/Notification.txt?t=${Date.now()}`, {
          cache: 'no-store'
        });
        if (res.ok) {
          const text = await res.text();
          const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
          setNotifications(lines);
          
          const lastSeen = localStorage.getItem('lastSeenNotificationCount');
          if (lastSeen !== lines.length.toString() && lines.length > 0) {
            setHasUnreadNotifications(true);
          }
        }
      } catch (e) {
        console.error('Failed to fetch notifications', e);
      }
    };
    fetchNotifications();
  }, []);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      setHasUnreadNotifications(false);
      localStorage.setItem('lastSeenNotificationCount', notifications.length.toString());
    }
  };

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isWatchlistView, setIsWatchlistView] = useState(false);
  const [isHistoryView, setIsHistoryView] = useState(false);
  const [isScraperView, setIsScraperView] = useState(false);
  const [activeSource, setActiveSource] = useState<'vegamovies' | 'rogmovies' | 'xprimehub'>('vegamovies');
  
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [postDetails, setPostDetails] = useState<PostDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [watchlist, setWatchlist] = useState<MediaItem[]>(() => {
    const saved = localStorage.getItem('pirate69_watchlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [recentHistory, setRecentHistory] = useState<MediaItem[]>(() => {
    const saved = localStorage.getItem('pirate69_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('pirate69_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem('pirate69_history', JSON.stringify(recentHistory));
  }, [recentHistory]);

  // Fetch initial/latest posts on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const postUrl = params.get('post');
    if (postUrl) {
      handlePostClick(postUrl, true);
    } else {
      fetchPosts({ isInitial: true });
    }
  }, []);

  const fetchPosts = async ({ 
    q = query, 
    category = activeCategory, 
    pageNum = 1,
    isInitial = false,
    source = activeSource
  }: { 
    q?: string, 
    category?: string, 
    pageNum?: number,
    isInitial?: boolean,
    source?: string
  }) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      let url = `/api/search?page=${pageNum}`;
      if (q) url += `&q=${encodeURIComponent(q)}`;
      if (category) url += `&category=${encodeURIComponent(category)}`;
      if (source) url += `&source=${encodeURIComponent(source)}`;

      const res = await fetch(url);
      const data: SearchResponse = await res.json();
      
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to fetch results');
      }
      
      if (pageNum === 1) {
        setResults(data.results || []);
      } else {
        setResults(prev => [...prev, ...(data.results || [])]);
      }
      
      setHasMore(data.hasMore || false);
      setPage(pageNum);
    } catch (err: any) {
      if (!isInitial) {
        toast.error(err.message || 'An unexpected error occurred.');
      }
      if (pageNum === 1) setResults([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveCategory('');
    setIsWatchlistView(false);
    setIsHistoryView(false);
    setIsScraperView(false);
    handleBackToHome();
    fetchPosts({ q: query, category: '', pageNum: 1 });
  };

  const handleSourceChange = (newSource: 'vegamovies' | 'rogmovies') => {
    setActiveSource(newSource);
    setIsWatchlistView(false);
    setIsHistoryView(false);
    setIsScraperView(false);
    setQuery('');
    setActiveCategory('');
    handleBackToHome();
    fetchPosts({ q: '', category: '', pageNum: 1, source: newSource });
  };

  const handleCategoryClick = (cat: string) => {
    const newCat = activeCategory === cat ? '' : cat;
    setActiveCategory(newCat);
    setIsWatchlistView(false);
    setIsHistoryView(false);
    setIsScraperView(false);
    setQuery('');
    handleBackToHome();
    fetchPosts({ q: '', category: newCat, pageNum: 1 });
  };

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    fetchPosts({ pageNum: page + 1 });
  };

  const handlePostClick = async (url: string, isInitialLoad = false) => {
    setSelectedPost(url);
    setIsScraperView(false);
    if (!isInitialLoad) {
       window.history.pushState({}, '', `?post=${encodeURIComponent(url)}`);
    }
    setLoadingDetails(true);
    setDetailsError(null);
    setPostDetails(null);
    
    try {
      const res = await fetch(`/api/details?url=${encodeURIComponent(url)}`);
      const data: DetailsResponse = await res.json();
      
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to fetch details');
      }
      
      if (data.details) {
         setPostDetails(data.details);
         setRecentHistory(prev => {
             const newHistory = prev.filter(p => p.link !== url);
             newHistory.unshift({ id: url, title: data.details!.title, link: url, thumbnail: data.details!.thumbnail });
             return newHistory.slice(0, 30);
         });
      } else {
         throw new Error('Details not found');
      }
    } catch (err: any) {
      setDetailsError(err.message || 'An unexpected error occurred.');
      toast.error('Failed to load movie details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleBackToHome = () => {
     setSelectedPost(null);
     window.history.pushState({}, '', window.location.pathname);
  };

  const resetHome = () => {
    handleBackToHome();
    setIsWatchlistView(false);
    setIsHistoryView(false);
    setIsScraperView(false);
    setQuery('');
    setActiveCategory('');
    fetchPosts({ q: '', category: '', pageNum: 1 });
  };

  const handleWatchlistClick = () => {
    setIsWatchlistView(true);
    setIsHistoryView(false);
    setIsScraperView(false);
    setQuery('');
    setActiveCategory('');
    setSelectedPost(null);
    window.history.pushState({}, '', window.location.pathname);
  };

  const handleHistoryClick = () => {
    setIsHistoryView(true);
    setIsWatchlistView(false);
    setIsScraperView(false);
    setQuery('');
    setActiveCategory('');
    setSelectedPost(null);
    window.history.pushState({}, '', window.location.pathname);
  };

  const handleScraperClick = () => {
    setIsScraperView(true);
    setIsHistoryView(false);
    setIsWatchlistView(false);
    setQuery('');
    setActiveCategory('');
    setSelectedPost(null);
    window.history.pushState({}, '', window.location.pathname);
  };

  const handleToggleWatchlist = () => {
    if (!postDetails || !selectedPost) return;
    setWatchlist(prev => {
        const exists = prev.find(p => p.link === selectedPost);
        if (exists) {
            toast.success('Removed from Watchlist');
            return prev.filter(p => p.link !== selectedPost);
        } else {
            toast.success('Added to Watchlist');
            return [{ id: selectedPost, title: postDetails.title, link: selectedPost, thumbnail: postDetails.thumbnail }, ...prev];
        }
    });
  };

  const handleClearWatchlist = () => {
    setWatchlist([]);
    toast.success('Watchlist cleared');
  };

  const handleClearHistory = () => {
    setRecentHistory([]);
    toast.success('History cleared');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500/30">
      <Toaster theme="dark" position="bottom-center" />
      
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-100 dark:bg-slate-800 rounded-full transition-colors focus:outline-none"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 
              className="text-2xl font-bold text-slate-900 dark:text-slate-100 cursor-pointer flex items-center gap-2 tracking-tight hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-heading"
              onClick={resetHome}
            >
              Pirate69 🏴‍☠️
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={handleNotificationClick}
                className="p-2 relative text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {hasUnreadNotifications && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden z-50">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      <ul className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {notifications.map((note, idx) => (
                          <li key={idx} className="p-4 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            {note}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                        No notifications yet.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        categories={CATEGORIES}
        activeCategory={activeCategory}
        onSelectCategory={handleCategoryClick}
        onHomeClick={resetHome}
        onWatchlistClick={handleWatchlistClick}
        isWatchlistView={isWatchlistView}
        onHistoryClick={handleHistoryClick}
        isHistoryView={isHistoryView}
        onScraperClick={handleScraperClick}
        isScraperView={isScraperView}
        activeSource={activeSource}
        onSelectSource={handleSourceChange}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        
        {/* Search & Categories - Hide when looking at details */}
        {!selectedPost && !isWatchlistView && !isHistoryView && !isScraperView && (
          <div className="mb-12">
            <div className="relative mb-8">
              {/* Cinematic Background Glow */}
              <div className="absolute inset-0 -top-8 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
              <div className="relative">
                <SearchBar 
                  query={query}
                  setQuery={setQuery}
                  onSearch={handleSearch}
                  loading={loading}
                  source={activeSource}
                  onClear={() => {
                     setActiveCategory('');
                     setSelectedPost(null);
                     fetchPosts({ q: '', category: '', pageNum: 1 });
                  }}
                />
                
                {/* Quick Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 mt-6 sm:mt-8">
                  <button 
                    onClick={() => handleSourceChange('vegamovies')} 
                    className={`px-6 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 border ${activeSource === 'vegamovies' ? 'bg-gradient-to-br from-indigo-500 to-blue-600 shadow-indigo-500/50 border-indigo-400 ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-950' : 'bg-gradient-to-br from-indigo-700 to-blue-800 hover:from-indigo-600 hover:to-blue-700 shadow-indigo-900/50 border-indigo-500/30'}`}
                  >
                    Hollywood
                  </button>
                  <button 
                    onClick={() => handleSourceChange('rogmovies')} 
                    className={`px-6 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 border ${activeSource === 'rogmovies' ? 'bg-gradient-to-br from-orange-500 to-rose-600 shadow-orange-500/50 border-orange-400 ring-2 ring-orange-400 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-950' : 'bg-gradient-to-br from-orange-700 to-rose-800 hover:from-orange-600 hover:to-rose-700 shadow-orange-900/50 border-orange-500/30'}`}
                  >
                    Bollywood
                  </button>
                </div>
              </div>
            </div>

            {/* Categories Strip */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeCategory === cat 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            <h2 className="text-2xl font-semibold mt-10 mb-6 font-heading">
              {activeCategory ? `${activeCategory} Movies & Shows` : query ? 'Search Results' : 'Latest Releases'}
            </h2>
          </div>
        )}

        {/* Watchlist View Header */}
        {!selectedPost && isWatchlistView && (
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold font-heading">My Watchlist</h2>
              <p className="text-slate-600 dark:text-slate-400 mt-2">Movies and shows you have saved for later.</p>
            </div>
            {watchlist.length > 0 && (
              <button 
                onClick={handleClearWatchlist}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Clear All
              </button>
            )}
          </div>
        )}

        {/* History View Header */}
        {!selectedPost && isHistoryView && (
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold font-heading">Recently Viewed</h2>
              <p className="text-slate-600 dark:text-slate-400 mt-2">Movies and shows you have checked out recently.</p>
            </div>
            {recentHistory.length > 0 && (
              <button 
                onClick={handleClearHistory}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Clear All
              </button>
            )}
          </div>
        )}

        {/* View Routing */}
        {selectedPost ? (
          <PostDetailsView
            loading={loadingDetails}
            error={detailsError}
            details={postDetails}
            selectedPostUrl={selectedPost}
            onBack={handleBackToHome}
            isInWatchlist={watchlist.some(p => p.link === selectedPost)}
            onToggleWatchlist={handleToggleWatchlist}
          />
        ) : isScraperView ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <BatchScraperDashboard />
          </div>
        ) : isWatchlistView ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             {watchlist.length > 0 ? (
               <MediaGrid results={watchlist} onPostClick={handlePostClick} />
             ) : (
               <div className="flex flex-col items-center justify-center py-20 text-center">
                 <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-800">
                    <Film className="w-8 h-8 text-slate-500" />
                 </div>
                 <h3 className="text-xl font-semibold mb-2">Your watchlist is empty</h3>
                 <p className="text-slate-500 max-w-md">Browse movies and click the bookmark icon to save them here for quick access later.</p>
                 <button onClick={resetHome} className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors">
                   Browse Movies
                 </button>
               </div>
             )}
          </div>
        ) : isHistoryView ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             {recentHistory.length > 0 ? (
               <MediaGrid results={recentHistory} onPostClick={handlePostClick} />
             ) : (
               <div className="flex flex-col items-center justify-center py-20 text-center">
                 <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-800">
                    <History className="w-8 h-8 text-slate-500" />
                 </div>
                 <h3 className="text-xl font-semibold mb-2">No recent history</h3>
                 <p className="text-slate-500 max-w-md">Movies you view will automatically appear here for easy access.</p>
                 <button onClick={resetHome} className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors">
                   Browse Movies
                 </button>
               </div>
             )}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Results */}
            {loading ? (
              <MediaGridSkeleton />
            ) : results.length > 0 ? (
              <>
                <MediaGrid results={results} onPostClick={handlePostClick} />
                
                {hasMore && (
                  <div className="mt-12 flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="px-8 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 text-slate-900 dark:text-white rounded-xl font-medium transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {loadingMore ? <><Loader2 className="w-5 h-5 animate-spin" /> Loading...</> : 'Load More Releases'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 text-slate-500">
                No results found. Try a different search term or category.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

