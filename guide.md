# 🎬 Pirate69 JSON Data Architecture Guide

This guide explains the "Two-Tier" JSON file structure used to power the Pirate69 backend. By storing data in this structure, we bypass Cloudflare blocks and ensure lightning-fast search results.

## 📂 Folder Structure

Your data should be organized exactly like this in the `data/` folder:

```text
data/
├── hollywood-index.json       <-- Lightweight search index for VegaMovies (Hollywood)
├── bollywood-index.json       <-- Lightweight search index for RogMovies (Bollywood)
├── hollywood/                 <-- Folder containing individual Hollywood movie files
│   ├── avatar-fire-and-ash-2025.json
│   └── ...
└── bollywood/                 <-- Folder containing individual Bollywood movie files
    ├── jawan-2023.json
    └── ...
```

## 1️⃣ Tier 1: Search Index Files

These files (`hollywood-index.json` and `bollywood-index.json`) contain the master list of all movies. 
**Rule:** Keep this file as lightweight as possible. It is used *only* for rendering the search results.

### Example (`data/hollywood-index.json`)
```json
[
  {
    "id": "avatar-fire-and-ash-2025",
    "title": "Avatar: Fire and Ash",
    "year": "2025",
    "poster": "https://new2.vegamovies.futbol/wp-content/uploads/2026/03/Avatar-Fire-and-Ash-2025-Bluray-ORG-200x300.jpg",
    "language": "Hindi - English",
    "quality": "4K HDR"
  }
]
```

## 2️⃣ Tier 2: Individual Movie Files

When a user clicks on a search result, the app fetches the detailed movie file using the `id`.
**Rule:** The filename MUST exactly match the `id` provided in the index file, plus `.json`. 
*(e.g., `id: "avatar-fire-and-ash-2025"` -> `data/hollywood/avatar-fire-and-ash-2025.json`)*

### Example (`data/hollywood/avatar-fire-and-ash-2025.json`)
```json
{
  "id": "avatar-fire-and-ash-2025",
  "fullTitle": "Download Avatar: Fire and Ash (2025) iMAX-BluRay Dual Audio (Hindi DD5.1 – English DD5.1) 480p | 720p | 1080p & 2160p",
  "cleanTitle": "Avatar: Fire and Ash",
  "poster": "https://new2.vegamovies.futbol/wp-content/uploads/2026/03/Avatar-Fire-and-Ash-2025-Bluray-ORG-200x300.jpg",
  "info": {
    "imdbRating": "8.5",
    "genres": ["Action", "Sci-Fi", "Adventure"],
    "director": "James Cameron"
  },
  "sourceUrl": "https://new2.vegamovies.futbol/download-avatar-fire-and-ash-...",
  "downloadLinks": [
    {
      "quality": "1080p",
      "size": "3.4GB",
      "label": "V Cloud Resumable",
      "url": "https://vcloud.fit/56jj9q2x72n15nc"
    }
  ]
}
```

## 🔄 API Mapping

The frontend sends a `source` parameter depending on which tab the user selects. The backend routes it as follows:

- `source=vegamovies` ➡️ Reads from `hollywood-index.json` and `hollywood/` folder.
- `source=rogmovies` ➡️ Reads from `bollywood-index.json` and `bollywood/` folder.

## 🚀 How to Update
To update the site, run your Python/Node scraper script to generate these JSON files and commit/push them to your GitHub repository!

## 🤖 AI Agent Scraping Instructions (Prompt Template)

If you are using an AI agent (like ChatGPT, Claude, or Gemini) to write your scraper script, you can copy and paste the following prompt to ensure the AI generates exactly what you need:

```markdown
**System Prompt for AI Coding Assistant:**

I need you to write a web scraper script (in Python or Node.js) that extracts movie data from a movie downloading website (like vegamovies or rogmovies) and saves it into a specific "Two-Tier" JSON architecture for my GitHub repository.

**The scraper must do the following:**
1. Bypass Cloudflare (e.g., using `curl-cffi`, `DrissionPage`, `Puppeteer` with stealth plugins, or `FlareSolverr`).
2. Scrape the movie's main page to get: `title`, `year`, `poster image url`, `language`, and `quality`.
3. Scrape the movie's inner page to extract the download links (resolving any vcloud/shortlinks if possible).
4. Save the data in TWO separate places.

**Formatting Requirement 1 (The Search Index):**
Append the basic movie info to an index array in a file named `data/hollywood-index.json` (or `bollywood-index.json`). 
Format:
{
  "id": "movie-title-year",
  "title": "Clean Title",
  "year": "2024",
  "poster": "img_url",
  "language": "Hindi - English",
  "quality": "1080p BluRay"
}

**Formatting Requirement 2 (The Detail File):**
Create a new file in `data/hollywood/{id}.json` (or `data/bollywood/{id}.json`) containing the full detailed download links. 
Format:
{
  "id": "movie-title-year",
  "fullTitle": "Full scraped text",
  "cleanTitle": "Clean Title",
  "poster": "img_url",
  "info": { "imdbRating": "8.0", "genres": ["Action"] },
  "sourceUrl": "original_url",
  "downloadLinks": [
    { "quality": "1080p", "size": "2GB", "label": "V Cloud", "url": "dl_url" }
  ]
}

Please write the script ensuring it avoids rate-limits (adds random delays) and correctly sanitizes the `id` field for filenames (lowercase, hyphens only).
```