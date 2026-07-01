// KINGAMU MOVIES - Core Application Logic & Premium Expansion

const DEFAULT_TMDB_KEY = "fe4e6af94da8d4491617742af59cd5fe";
const DEFAULT_TMDB_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmZTRlNmFmOTRkYThkNDQ5MTYxNzc0MmFmNTljZDVmZSIsIm5iZiI6MTc4MjY1NzMyMS41NCwic3ViIjoiNmE0MTMxMjkwM2U0NjcwYjA3YmNlZGJlIiwic2NvcGVzIjpbImFwaV9yZWFkIl0sInZlcnNpb24iOjF9.rwzywSjbyedFJkPU6hC0iNInEVQHu7HWHhIN4AFCw2M";

// Cache for storing fetched movie/tv details temporarily
window.mediaCache = {};

// User Avatar icons selection list
const USER_AVATARS = [
  { id: "av1", name: "Superhero", url: "https://image.tmdb.org/t/p/w92/or065RznetuEV34t21Gw5o4Jrm5.jpg" },
  { id: "av2", name: "Sci-Fi Geek", url: "https://image.tmdb.org/t/p/w92/49WJfeN0mhmmRLxsO7SLbb62h0G.jpg" },
  { id: "av3", name: "Showrunner", url: "https://image.tmdb.org/t/p/w92/2y446sc9xRxd6672AsOIW9FHO0f.jpg" },
  { id: "av4", name: "Director", url: "https://image.tmdb.org/t/p/w92/hjS9mH8KvRiGHgjk6VUZH7OT0Ng.jpg" },
  { id: "av5", name: "Cinephile", url: "https://image.tmdb.org/t/p/w92/8912AsVuS7Sj915apArUFbv6F9L.jpg" },
  { id: "av6", name: "Popcorn Lover", url: "https://image.tmdb.org/t/p/w92/ztkUQv63Mz4836oiGo2j6voo8rv.jpg" }
];

// App settings state
let settings = {
  tmdbKey: DEFAULT_TMDB_KEY,
  tmdbToken: DEFAULT_TMDB_TOKEN,
  accentColor: localStorage.getItem("kingamu_accent_color") || "#e50914",
  accentColorName: localStorage.getItem("kingamu_accent_color_name") || "red",
  playerOverlay: localStorage.getItem("kingamu_player_overlay") !== "false",
  playerNextBtn: localStorage.getItem("kingamu_player_next_btn") !== "false",
  playerAutoplay: localStorage.getItem("kingamu_player_autoplay") !== "false",
  playerSelector: localStorage.getItem("kingamu_player_selector") !== "false"
};

// Current authenticated user state
let currentUser = null;

// Search results state cache for advanced filtering
window.currentSearchResults = [];

/**
 * Filter movie streaming sources from API response.
 * Remove any source that contains ads, popups, redirects, or suspicious tracking domains.
 * Only keep clean and direct video URLs.
 *
 * @param {Array|Object|string} sources - Streaming sources list or item
 * @returns {Array|string} Cleaned sources list, or error string if empty
 */
window.filterStreamingSources = function(sources) {
  if (!sources) {
    return "No clean sources available";
  }

  // Normalize input to array
  const sourceList = Array.isArray(sources) ? sources : [sources];

  // Disallowed ad/popup/redirect keywords
  const blacklist = ["ads", "popup", "doubleclick", "tracker", "redirect", "banner", "sponsor"];

  // Filter sources
  const cleaned = sourceList.filter(item => {
    let url = "";
    if (typeof item === "string") {
      url = item;
    } else if (item && typeof item === "object") {
      url = item.url || item.src || item.link || item.file || "";
    }

    if (!url) return false;
    
    const lowerUrl = url.toLowerCase();
    
    // Return false if url contains any blacklisted keyword
    return !blacklist.some(keyword => lowerUrl.includes(keyword));
  });

  if (cleaned.length === 0) {
    return "No clean sources available";
  }

  return cleaned;
};

const MOCK_CATALOG = {
  movies: [
    { id: 1314481, title: "The Devil Wears Prada 2", rating: 7.8, vote_average: 7.8, release_date: "2026-06-01", year: 2026, overview: "Miranda Priestly faces the decline of traditional print magazine publishing in the modern digital era, forcing her to confront her former assistant Andy Sachs.", poster_path: "/8912AsVuS7Sj915apArUFbv6F9L.jpg", backdrop_path: "/gkh6Nt8DtY1XT4gQsyFq9XAVJlJ.jpg", genres: [{ name: "Drama" }, { name: "Comedy" }], original_language: "en" },
    { id: 350, title: "The Devil Wears Prada", rating: 7.4, vote_average: 7.4, release_date: "2006-06-30", year: 2006, overview: "Andy, a college graduate with big dreams, lands a job at a prestigious fashion magazine as assistant to Miranda Priestly, a demanding editor.", poster_path: "/8912AsVuS7Sj915apArUFbv6F9L.jpg", backdrop_path: "/gkh6Nt8DtY1XT4gQsyFq9XAVJlJ.jpg", genres: [{ name: "Drama" }, { name: "Comedy" }], original_language: "en" },
    { id: 337404, title: "Cruella", rating: 8.0, vote_average: 8.0, release_date: "2021-05-26", year: 2021, overview: "In 1970s London amidst the punk rock revolution, a young grifter named Estella is determined to make a name for herself with her designs.", poster_path: "/hjS9mH8KvRiGHgjk6VUZH7OT0Ng.jpg", backdrop_path: "/6MKr3KgOLmzOP6MSuZERO41Lpkt.jpg", genres: [{ name: "Comedy" }, { name: "Crime" }, { name: "Drama" }], original_language: "en" },
    { id: 299534, title: "Avengers: Endgame", rating: 8.3, vote_average: 8.3, release_date: "2019-04-24", year: 2019, overview: "After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more.", poster_path: "/or065RznetuEV34t21Gw5o4Jrm5.jpg", backdrop_path: "/7RyNsL1vC40rZ77vPR64zRLPAHP.jpg", genres: [{ name: "Action" }, { name: "Sci-Fi" }, { name: "Adventure" }], original_language: "en" }
  ],
  tv: [
    { id: 1399, title: "Game of Thrones", rating: 8.4, vote_average: 8.4, first_air_date: "2011-04-17", year: 2011, overview: "Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war.", poster_path: "/1XS1nmgV0xE191jue8e0OI16ypC.jpg", backdrop_path: "/2OMGnOcqz15v48Ct8ee4XSVi1eL.jpg", genres: [{ name: "Sci-Fi & Fantasy" }, { name: "Drama" }], original_language: "en" },
    { id: 1396, title: "Breaking Bad", rating: 8.9, vote_average: 8.9, first_air_date: "2008-01-20", year: 2008, overview: "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine.", poster_path: "/ztkUQv63Mz4836oiGo2j6voo8rv.jpg", backdrop_path: "/9fa5tG5L4Z3ECwPHQ450IuE98tA.jpg", genres: [{ name: "Drama" }, { name: "Crime" }], original_language: "en" }
  ],
  anime: [
    { id: 21, title: "One Piece", rating: 8.7, vote_average: 8.7, first_air_date: "1999-10-20", year: 1999, overview: "Monkey D. Luffy and his pirate crew search for the ultimate treasure to become the next Pirate King.", poster_path: "/2y446sc9xRxd6672AsOIW9FHO0f.jpg", backdrop_path: "/4t0890696a2e8c253.jpg", genres: [{ name: "Animation" }, { name: "Adventure" }], original_language: "ja" }
  ]
};

// Cache catalog fallback elements
MOCK_CATALOG.movies.forEach(m => { window.mediaCache[m.id] = { ...m, media_type: "movie" }; });
MOCK_CATALOG.tv.forEach(t => { window.mediaCache[t.id] = { ...t, media_type: "tv" }; });
MOCK_CATALOG.anime.forEach(a => { window.mediaCache[a.id] = { ...a, media_type: "anime" }; });

let currentWatchServer = "s1";

function applyAccentColor(hex) {
  document.documentElement.style.setProperty("--accent", hex);
  let c = hex.replace("#", "");
  let r = parseInt(c.substring(0, 2), 16);
  let g = parseInt(c.substring(2, 4), 16);
  let b = parseInt(c.substring(4, 6), 16);
  document.documentElement.style.setProperty("--accent-rgb", `${r}, ${g}, ${b}`);
}

// -------------------------------------------------------------
// Authentication Session Manager (localStorage)
// -------------------------------------------------------------
function loadUserSession() {
  const raw = localStorage.getItem("kingamu_user");
  if (raw) {
    currentUser = JSON.parse(raw);
  } else {
    currentUser = null;
  }
  updateHeaderUserUI();
}

function saveUserSession(user) {
  currentUser = user;
  if (user) {
    localStorage.setItem("kingamu_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("kingamu_user");
  }
  updateHeaderUserUI();
}

function updateHeaderUserUI() {
  const profileTrigger = document.getElementById("profile-trigger");
  const avatarPlaceholder = profileTrigger.querySelector(".user-avatar-placeholder");
  const avatarImg = document.getElementById("header-avatar-img");
  
  if (currentUser && currentUser.isLoggedIn) {
    profileTrigger.href = "#/profile";
    profileTrigger.title = `Profile (${currentUser.username})`;
    
    if (currentUser.customAvatar) {
      avatarImg.src = currentUser.customAvatar;
    } else {
      const avatarObj = USER_AVATARS.find(a => a.id === currentUser.avatarId) || USER_AVATARS[0];
      avatarImg.src = avatarObj.url;
    }
    avatarImg.style.display = "block";
    avatarPlaceholder.style.display = "none";
  } else {
    profileTrigger.href = "#/auth";
    profileTrigger.title = "Sign In";
    avatarImg.style.display = "none";
    avatarPlaceholder.style.display = "block";
  }
}

// -------------------------------------------------------------
// TMDB API Service Wrapper
// -------------------------------------------------------------
async function tmdbFetch(endpoint, queryParams = {}) {
  const url = new URL(`https://api.themoviedb.org/3${endpoint}`);
  queryParams.api_key = settings.tmdbKey;
  Object.keys(queryParams).forEach(key => url.searchParams.append(key, queryParams[key]));

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${settings.tmdbToken}`
      }
    });
    if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("TMDB API error: ", error);
    return null;
  }
}

function cacheResults(list, defaultType) {
  if (!list) return;
  list.forEach(item => {
    const id = item.id;
    if (!window.mediaCache[id]) {
      window.mediaCache[id] = {
        ...item,
        media_type: item.media_type || defaultType
      };
    }
  });
}

// Fetch lists from TMDB
async function getTrendingMovies() {
  const data = await tmdbFetch("/trending/movie/week");
  if (data && data.results) {
    cacheResults(data.results, "movie");
    return data.results;
  }
  return MOCK_CATALOG.movies;
}

async function getPopularTV() {
  const data = await tmdbFetch("/tv/popular");
  if (data && data.results) {
    cacheResults(data.results, "tv");
    return data.results;
  }
  return MOCK_CATALOG.tv;
}

async function getRecommendations(type, id) {
  const data = await tmdbFetch(`/${type}/${id}/recommendations`);
  if (data && data.results) {
    cacheResults(data.results, type);
    return data.results;
  }
  return MOCK_CATALOG[type === "tv" ? "tv" : "movies"];
}

async function getComingSoon() {
  const data = await tmdbFetch("/movie/upcoming");
  if (data && data.results) {
    cacheResults(data.results, "movie");
    return data.results;
  }
  return MOCK_CATALOG.movies;
}

async function getRecentlyAdded() {
  const data = await tmdbFetch("/movie/now_playing");
  if (data && data.results) {
    cacheResults(data.results, "movie");
    return data.results;
  }
  return MOCK_CATALOG.movies;
}

async function searchCatalog(query) {
  const data = await tmdbFetch("/search/multi", { query: query });
  if (data && data.results) {
    const filtered = data.results.filter(item => item.media_type === "movie" || item.media_type === "tv");
    cacheResults(filtered, "movie");
    return filtered;
  }
  return [];
}

async function getMediaDetails(type, id) {
  if (type === "anime") {
    return await getAnilistMediaDetails(id);
  }
  const data = await tmdbFetch(`/${type}/${id}`);
  if (data) {
    window.mediaCache[id] = { ...data, media_type: type };
    return data;
  }
  const list = type === "tv" ? MOCK_CATALOG.tv : MOCK_CATALOG.movies;
  return list.find(item => item.id == id) || null;
}

async function getSeasonDetails(tvId, seasonNum) {
  const data = await tmdbFetch(`/tv/${tvId}/season/${seasonNum}`);
  return data ? data.episodes : [];
}

// -------------------------------------------------------------
// Anilist GraphQL API wrapper
// -------------------------------------------------------------
async function fetchAnilist(query, variables = {}) {
  try {
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ query, variables })
    });
    if (!response.ok) throw new Error("Anilist GraphQL Error");
    const json = await response.json();
    return json.data;
  } catch (error) {
    console.error("Anilist API error: ", error);
    return null;
  }
}

async function getTrendingAnime() {
  const query = `
  query {
    Page(page: 1, perPage: 12) {
      media(type: ANIME, sort: TRENDING_DESC) {
        id
        title {
          english
          romaji
        }
        coverImage {
          extraLarge
          large
        }
        bannerImage
        description
        averageScore
        startDate {
          year
        }
      }
    }
  }`;

  const data = await fetchAnilist(query);
  if (data && data.Page && data.Page.media) {
    const mapped = data.Page.media.map(item => ({
      id: item.id,
      title: item.title.english || item.title.romaji,
      name: item.title.english || item.title.romaji, 
      poster_path: item.coverImage.extraLarge || item.coverImage.large,
      backdrop_path: item.bannerImage || item.coverImage.extraLarge,
      vote_average: item.averageScore ? (item.averageScore / 10).toFixed(1) : "7.5",
      release_date: item.startDate.year ? `${item.startDate.year}-01-01` : "2026-01-01",
      first_air_date: item.startDate.year ? `${item.startDate.year}-01-01` : "2026-01-01",
      overview: item.description ? item.description.replace(/<[^>]*>/g, "") : "",
      media_type: "anime"
    }));
    
    cacheResults(mapped, "anime");
    return mapped;
  }
  return MOCK_CATALOG.anime;
}

async function getAnilistMediaDetails(id) {
  const query = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title {
        english
        romaji
      }
      coverImage {
        extraLarge
      }
      bannerImage
      description
      averageScore
      startDate {
        year
      }
      genres
      episodes
      duration
      trailer {
        id
        site
      }
      staff {
        edges {
          role
          node {
            name {
              full
            }
          }
        }
      }
    }
  }`;

  const data = await fetchAnilist(query, { id: parseInt(id) });
  if (data && data.Media) {
    const item = data.Media;
    const mapped = {
      id: item.id,
      title: item.title.english || item.title.romaji,
      poster_path: item.coverImage.extraLarge,
      backdrop_path: item.bannerImage || item.coverImage.extraLarge,
      vote_average: item.averageScore ? (item.averageScore / 10).toFixed(1) : "7.5",
      release_date: item.startDate.year ? `${item.startDate.year}-01-01` : "2026-01-01",
      overview: item.description ? item.description.replace(/<[^>]*>/g, "") : "",
      genres: item.genres.map(name => ({ name })),
      episodes_count: item.episodes || 24,
      runtime: item.duration || 24,
      trailer_id: (item.trailer && item.trailer.site === "youtube") ? item.trailer.id : null,
      staff: item.staff ? item.staff.edges.filter(e => e.role.toLowerCase().includes("director")).map(e => e.node.name.full) : [],
      media_type: "anime"
    };
    window.mediaCache[id] = mapped;
    return mapped;
  }
  return null;
}

// -------------------------------------------------------------
// Watchlist & Favorites Operations
// -------------------------------------------------------------
window.isInWatchlist = function(id, type) {
  const watchlist = JSON.parse(localStorage.getItem("kingamu_watchlist")) || [];
  return watchlist.some(item => item.id == id && item.type == type);
};

window.isFavorite = function(id, type) {
  const favorites = JSON.parse(localStorage.getItem("kingamu_favorites")) || [];
  return favorites.some(item => item.id == id && item.type == type);
};

window.toggleWatchlist = function(event, type, id) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  let watchlist = JSON.parse(localStorage.getItem("kingamu_watchlist")) || [];
  const index = watchlist.findIndex(item => item.id == id && item.type == type);

  let isAdded = false;
  if (index !== -1) {
    watchlist.splice(index, 1);
    localStorage.setItem("kingamu_watchlist", JSON.stringify(watchlist));
  } else {
    const cachedItem = window.mediaCache[id];
    if (cachedItem) {
      watchlist.unshift({
        id: cachedItem.id,
        type: type,
        title: cachedItem.title || cachedItem.name,
        name: cachedItem.title || cachedItem.name,
        poster_path: cachedItem.poster_path || cachedItem.poster,
        vote_average: cachedItem.vote_average || cachedItem.rating,
        release_date: cachedItem.release_date || cachedItem.first_air_date || `${cachedItem.year}-01-01`
      });
      localStorage.setItem("kingamu_watchlist", JSON.stringify(watchlist));
      isAdded = true;
    } else {
      getMediaDetails(type, id).then(details => {
        if (details) {
          watchlist.unshift({
            id: details.id,
            type: type,
            title: details.title || details.name,
            name: details.title || details.name,
            poster_path: details.poster_path || details.poster,
            vote_average: details.vote_average || details.rating,
            release_date: details.release_date || details.first_air_date || `${details.year}-01-01`
          });
          localStorage.setItem("kingamu_watchlist", JSON.stringify(watchlist));
          updateBookmarkUIStates(id, type, true);
        }
      });
      return;
    }
  }
  updateBookmarkUIStates(id, type, isAdded);

  if (window.location.hash === "" || window.location.hash === "#/") {
    renderWatchlist();
  }
};

window.toggleFavorite = function(event, type, id) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  let favorites = JSON.parse(localStorage.getItem("kingamu_favorites")) || [];
  const index = favorites.findIndex(item => item.id == id && item.type == type);

  let isAdded = false;
  if (index !== -1) {
    favorites.splice(index, 1);
    localStorage.setItem("kingamu_favorites", JSON.stringify(favorites));
  } else {
    const cachedItem = window.mediaCache[id];
    if (cachedItem) {
      favorites.unshift({
        id: cachedItem.id,
        type: type,
        title: cachedItem.title || cachedItem.name,
        name: cachedItem.title || cachedItem.name,
        poster_path: cachedItem.poster_path || cachedItem.poster,
        vote_average: cachedItem.vote_average || cachedItem.rating,
        release_date: cachedItem.release_date || cachedItem.first_air_date || `${cachedItem.year}-01-01`
      });
      localStorage.setItem("kingamu_favorites", JSON.stringify(favorites));
      isAdded = true;
    } else {
      getMediaDetails(type, id).then(details => {
        if (details) {
          favorites.unshift({
            id: details.id,
            type: type,
            title: details.title || details.name,
            name: details.title || details.name,
            poster_path: details.poster_path || details.poster,
            vote_average: details.vote_average || details.rating,
            release_date: details.release_date || details.first_air_date || `${details.year}-01-01`
          });
          localStorage.setItem("kingamu_favorites", JSON.stringify(favorites));
          updateFavoriteUIStates(id, type, true);
        }
      });
      return;
    }
  }
  updateFavoriteUIStates(id, type, isAdded);
};

function updateBookmarkUIStates(id, type, isActive) {
  const cardBtns = document.querySelectorAll(`.card-wrapper[data-id="${id}"][data-type="${type}"] .bookmark-btn`);
  cardBtns.forEach(btn => {
    if (isActive) btn.classList.add("active");
    else btn.classList.remove("active");
  });

  const detailBtn = document.getElementById("details-watchlist-btn");
  if (detailBtn) {
    if (isActive) {
      detailBtn.classList.add("active");
      detailBtn.querySelector(".bookmark-text").innerText = "In Watchlist";
    } else {
      detailBtn.classList.remove("active");
      detailBtn.querySelector(".bookmark-text").innerText = "Add to Watchlist";
    }
  }
}

function updateFavoriteUIStates(id, type, isActive) {
  const cardBtns = document.querySelectorAll(`.card-wrapper[data-id="${id}"][data-type="${type}"] .favorite-btn`);
  cardBtns.forEach(btn => {
    if (isActive) btn.classList.add("active");
    else btn.classList.remove("active");
  });

  const detailBtn = document.getElementById("details-favorite-btn");
  if (detailBtn) {
    if (isActive) {
      detailBtn.classList.add("active");
      detailBtn.querySelector(".fav-text").innerText = "Favorited";
    } else {
      detailBtn.classList.remove("active");
      detailBtn.querySelector(".fav-text").innerText = "Favorite";
    }
  }
}

// -------------------------------------------------------------
// Playback Progress & History Logs
// -------------------------------------------------------------
function saveProgress(data) {
  let progressList = JSON.parse(localStorage.getItem("kingamu_progress")) || [];
  const index = progressList.findIndex(item => item.id == data.id && item.type == data.type);
  
  const progressItem = {
    id: data.id,
    type: data.type,
    progress: data.progress,
    timestamp: data.timestamp,
    duration: data.duration,
    season: data.season || null,
    episode: data.episode || null,
    title: data.title || "Unknown Title",
    poster: data.poster || "",
    updatedAt: Date.now()
  };

  if (index !== -1) {
    progressList.splice(index, 1);
  }
  progressList.unshift(progressItem);
  if (progressList.length > 12) {
    progressList.pop();
  }

  localStorage.setItem("kingamu_progress", JSON.stringify(progressList));
  
  if (window.location.hash === "" || window.location.hash === "#/") {
    renderContinueWatching();
  }
}

function getWatchProgress(type, id, season = null, episode = null) {
  let progressList = JSON.parse(localStorage.getItem("kingamu_progress")) || [];
  let item = progressList.find(i => i.id == id && i.type == type);
  if (item) {
    if (type === "tv" && (item.season != season || item.episode != episode)) {
      return null;
    }
    if (type === "anime" && item.episode != episode) {
      return null;
    }
    return item;
  }
  return null;
}

function logWatchHistory(item) {
  let history = JSON.parse(localStorage.getItem("kingamu_history")) || [];
  const index = history.findIndex(h => h.id == item.id && h.type == item.type);
  if (index !== -1) {
    history.splice(index, 1);
  }
  history.unshift({
    id: item.id,
    type: item.type,
    title: item.title,
    poster: item.poster || item.poster_path,
    season: item.season || null,
    episode: item.episode || null,
    watchedAt: Date.now()
  });
  if (history.length > 20) {
    history.pop();
  }
  localStorage.setItem("kingamu_history", JSON.stringify(history));
}

// -------------------------------------------------------------
// Interactive Movie Cards & Preview Lightbox
// -------------------------------------------------------------
function createMovieCard(item, type, isTop10Rank = null) {
  const id = item.id;
  const title = item.title || item.name || "Untitled";
  const posterPath = item.poster_path ? 
    (item.poster_path.startsWith("http") ? item.poster_path : `https://image.tmdb.org/t/p/w500${item.poster_path}`) : 
    "https://placehold.co/500x750/0a0a0e/ffffff?text=No+Poster";
  const rating = item.vote_average ? parseFloat(item.vote_average).toFixed(1) : "7.5";
  const date = item.release_date || item.first_air_date || "2026-01-01";
  const year = date.split("-")[0];
  
  let watchRoute = `#/watch/movie/${id}`;
  if (type === "tv") watchRoute = `#/watch/tv/${id}/1/1`;
  if (type === "anime") watchRoute = `#/watch/anime/${id}/1`;

  const watchmarked = window.isInWatchlist(id, type);
  const favorited = window.isFavorite(id, type);

  const is4K = year && parseInt(year) > 2018;
  const qualityText = is4K ? "4K" : "HD";

  const cardHtml = `
    <div class="card-wrapper" data-id="${id}" data-type="${type}">
      <div class="card-container">
        <!-- Quality Badges -->
        <span class="card-badge quality-badge">${qualityText}</span>
        <div class="card-rating-badge">
          <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path></svg>
          <span>${rating}</span>
        </div>

        <!-- Floating hover overlay quick buttons -->
        <div class="card-hover-actions">
          <button class="card-action-btn favorite-btn ${favorited ? 'active' : ''}" onclick="window.toggleFavorite(event, '${type}', ${id})" title="Favorite">
            <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
          </button>
          <button class="card-action-btn bookmark-btn ${watchmarked ? 'active' : ''}" onclick="window.toggleWatchlist(event, '${type}', ${id})" title="Watchlist">
            <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
          </button>
          <button class="card-action-btn preview-btn" onclick="window.openQuickPreview(event, '${type}', ${id})" title="Quick Trailer Preview">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
          </button>
        </div>

        <img class="card-poster" src="${posterPath}" alt="${title}" loading="lazy" />
        <div class="card-play-overlay">
          <a class="card-play-btn" href="${watchRoute}">
            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
          </a>
        </div>
      </div>
      <a class="card-details-drawer" href="${watchRoute}">
        <h4 class="card-details-title">${title}</h4>
        <div class="card-details-meta">
          <span>${year}</span>
          <div class="card-details-chevron" style="margin-left: auto;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"></path></svg>
          </div>
        </div>
      </a>
    </div>
  `;

  if (isTop10Rank !== null) {
    return `
      <div class="top10-card-wrapper">
        <div class="top10-number">${isTop10Rank}</div>
        ${cardHtml}
      </div>
    `;
  }
  return cardHtml;
}

function createContinueCard(item) {
  const watchRoute = item.type === "movie" ? 
    `#/watch/movie/${item.id}?t=${item.timestamp}` : 
    (item.type === "tv" ? `#/watch/tv/${item.id}/${item.season}/${item.episode}?t=${item.timestamp}` : `#/watch/anime/${item.id}/${item.episode}?t=${item.timestamp}`);
  
  const posterPath = item.poster ? 
    (item.poster.startsWith("http") ? item.poster : `https://image.tmdb.org/t/p/w342${item.poster}`) : 
    "https://placehold.co/342x513/0a0a0e/ffffff?text=No+Poster";

  let label = `S${item.season} E${item.episode}`;
  if (item.type === "anime") label = `Episode ${item.episode}`;
  if (item.type === "movie") label = "Movie";

  return `
    <div class="card-wrapper progress-card" data-id="${item.id}" data-type="${item.type}">
      <div class="card-container">
        <img class="card-poster" src="${posterPath}" alt="${item.title}" loading="lazy" />
        <div class="progress-card-bar-container">
          <div class="progress-card-bar" style="width: ${item.progress}%"></div>
        </div>
        <div class="card-play-overlay">
          <a class="card-play-btn" href="${watchRoute}">
            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
          </a>
        </div>
      </div>
      <a class="card-details-drawer" href="${watchRoute}">
        <h4 class="card-details-title">${item.title}</h4>
        <div class="card-details-meta">
          <span style="color: var(--accent); font-weight:900;">${label}</span>
          <span style="margin-left: auto;">${Math.round(item.progress)}% Watched</span>
        </div>
      </a>
    </div>
  `;
}

function createCardSkeletons(count = 6) {
  let html = "";
  for (let i = 0; i < count; i++) {
    html += `<div class="card-skeleton"></div>`;
  }
  return html;
}

// Quick Preview Lightbox trigger
window.openQuickPreview = async function(event, type, id) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  let lightbox = document.getElementById("quick-preview-lightbox");
  if (!lightbox) {
    lightbox = document.createElement("div");
    lightbox.id = "quick-preview-lightbox";
    lightbox.className = "preview-lightbox";
    document.body.appendChild(lightbox);
  }
  
  lightbox.innerHTML = `
    <div class="preview-box">
      <button class="preview-close-btn" onclick="window.closeQuickPreview()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
      <div class="preview-video-container">
        <div class="loader-dots" style="position: absolute; top:50%; left:50%; transform:translate(-50%, -50%);">
          <div class="loader-dot"></div>
          <div class="loader-dot"></div>
          <div class="loader-dot"></div>
        </div>
        <iframe id="preview-iframe" class="preview-video-iframe" src="" allowfullscreen allow="autoplay; encrypted-media"></iframe>
      </div>
      <div class="preview-details">
        <div class="preview-header-row">
          <h2 class="preview-title" id="preview-title">Loading...</h2>
        </div>
        <p class="preview-overview" id="preview-desc">...</p>
        <div class="preview-actions">
          <a class="btn btn-primary" id="preview-play-link" href="#/">Play Now</a>
          <button class="btn btn-secondary" id="preview-watchlist-btn">Add to Watchlist</button>
        </div>
      </div>
    </div>
  `;
  
  lightbox.classList.add("open");
  
  const details = await getMediaDetails(type, id);
  if (!details) return;
  
  document.getElementById("preview-title").innerText = details.title || details.name;
  document.getElementById("preview-desc").innerText = details.overview;
  
  let watchRoute = `#/watch/movie/${id}`;
  if (type === "tv") watchRoute = `#/watch/tv/${id}/1/1`;
  if (type === "anime") watchRoute = `#/watch/anime/${id}/1`;
  document.getElementById("preview-play-link").href = watchRoute;
  
  const wlBtn = document.getElementById("preview-watchlist-btn");
  const watchmarked = window.isInWatchlist(id, type);
  wlBtn.innerText = watchmarked ? "In Watchlist" : "Add to Watchlist";
  wlBtn.onclick = () => {
    window.toggleWatchlist(null, type, id);
    const updated = window.isInWatchlist(id, type);
    wlBtn.innerText = updated ? "In Watchlist" : "Add to Watchlist";
  };
  
  // YouTube trailer
  let trailerUrl = "";
  if (type === "anime") {
    if (details.trailer_id) {
      trailerUrl = `https://www.youtube.com/embed/${details.trailer_id}?autoplay=1&mute=1`;
    }
  } else {
    const videoData = await tmdbFetch(`/${type}/${id}/videos`);
    if (videoData && videoData.results) {
      const trailer = videoData.results.find(v => v.type === "Trailer" && v.site === "YouTube");
      if (trailer) {
        trailerUrl = `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1`;
      }
    }
  }
  
  const iframe = document.getElementById("preview-iframe");
  if (trailerUrl) {
    iframe.src = trailerUrl;
  } else {
    const backdropUrl = details.backdrop_path ? 
      (details.backdrop_path.startsWith("http") ? details.backdrop_path : `https://image.tmdb.org/t/p/w780${details.backdrop_path}`) : 
      (details.poster_path ? `https://image.tmdb.org/t/p/w780${details.poster_path}` : "");
    const container = document.querySelector(".preview-video-container");
    container.innerHTML = `<img src="${backdropUrl}" style="width:100%; height:100%; object-fit:cover;" alt="Backdrop">`;
  }
};

window.closeQuickPreview = function() {
  const lightbox = document.getElementById("quick-preview-lightbox");
  if (lightbox) {
    const iframe = document.getElementById("preview-iframe");
    if (iframe) iframe.src = "";
    lightbox.classList.remove("open");
  }
};

// -------------------------------------------------------------
// Shelves Shelf Rendering
// -------------------------------------------------------------
function renderContinueWatching() {
  const progressList = JSON.parse(localStorage.getItem("kingamu_progress")) || [];
  const section = document.getElementById("continue-watching-section");
  const container = document.getElementById("continue-grid");

  if (progressList.length === 0) {
    section.style.display = "none";
    return;
  }
  section.style.display = "block";
  container.innerHTML = progressList.map(item => createContinueCard(item)).join("");
}

function renderWatchlist() {
  const watchlist = JSON.parse(localStorage.getItem("kingamu_watchlist")) || [];
  const section = document.getElementById("watchlist-section");
  const container = document.getElementById("watchlist-grid");

  if (watchlist.length === 0) {
    section.style.display = "none";
    return;
  }
  section.style.display = "block";
  container.innerHTML = watchlist.map(item => createMovieCard(item, item.type)).join("");
}

async function renderBecauseYouWatched() {
  const history = JSON.parse(localStorage.getItem("kingamu_history")) || [];
  const section = document.getElementById("because-watched-section");
  const label = document.getElementById("because-watched-title");
  const grid = document.getElementById("because-watched-grid");

  if (history.length === 0) {
    section.style.display = "none";
    return;
  }

  const lastItem = history[0];
  section.style.display = "block";
  label.innerText = `Because You Watched: ${lastItem.title}`;
  grid.innerHTML = createCardSkeletons(6);

  const recs = await getRecommendations(lastItem.type, lastItem.id);
  grid.innerHTML = recs.slice(0, 6).map(item => createMovieCard(item, lastItem.type)).join("");
}

function generateLoaderParticles() {
  const container = document.querySelector(".loader-particles");
  if (!container) return;

  container.innerHTML = "";
  for (let i = 0; i < 18; i++) {
    const particle = document.createElement("div");
    particle.className = "loader-particle";
    particle.style.left = Math.random() * 100 + "vw";
    particle.style.animationDuration = (Math.random() * 3 + 3) + "s";
    particle.style.animationDelay = (Math.random() * 2) + "s";
    particle.style.setProperty("--drift", (Math.random() * 100 - 50) + "px");
    container.appendChild(particle);
  }
}

// -------------------------------------------------------------
// Home Page Rendering
// -------------------------------------------------------------
async function renderHomePage() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <section class="hero" id="hero-banner">
      <div class="hero-backdrop">
        <img id="hero-img" src="" alt="Hero Backdrop" />
      </div>
      <div class="container">
        <div class="hero-content">
          <div class="hero-tag">
            <div class="hero-tag-dot"></div>
            <div class="hero-tag-text" id="hero-tag-title">Featured Movie</div>
          </div>
          <h2 class="hero-title" id="hero-title">Loading Featured Title</h2>
          <div class="hero-meta">
            <div class="hero-rating">
              <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path></svg>
              <span id="hero-rating-val">8.4</span>
            </div>
            <span class="hero-info-tag" id="hero-year">2026</span>
            <div class="hero-genres" id="hero-genres-container"></div>
          </div>
          <p class="hero-overview" id="hero-overview">Details loading...</p>
          <div class="hero-btns">
            <a class="btn btn-primary" id="hero-play-btn" href="#/">
              <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
              Watch Now
            </a>
          </div>
        </div>
      </div>
    </section>

    <div class="container" style="position: relative; margin-top:-4rem; z-index: 30;">
      <!-- Continue Watching Row -->
      <section class="shelf-section" id="continue-watching-section" style="display: none;">
        <div class="shelf-header">
          <div class="shelf-title-container">
            <span class="shelf-subtitle">Pick Up Where You Left Off</span>
            <h3 class="shelf-title">Continue Watching</h3>
          </div>
        </div>
        <div class="movie-grid" id="continue-grid"></div>
      </section>

      <!-- Custom Watchlist Shelf Row -->
      <section class="shelf-section" id="watchlist-section" style="display: none;">
        <div class="shelf-header">
          <div class="shelf-title-container">
            <span class="shelf-subtitle">Your Saved Titles</span>
            <h3 class="shelf-title">My Watchlist</h3>
          </div>
        </div>
        <div class="movie-grid" id="watchlist-grid"></div>
      </section>

      <!-- Because You Watched Shelf Row -->
      <section class="shelf-section" id="because-watched-section" style="display: none;">
        <div class="shelf-header">
          <div class="shelf-title-container">
            <span class="shelf-subtitle">Personalized Picks</span>
            <h3 class="shelf-title" id="because-watched-title">Because You Watched</h3>
          </div>
        </div>
        <div class="movie-grid" id="because-watched-grid"></div>
      </section>

      <!-- Top 10 Today Row -->
      <section class="shelf-section" id="top10-section">
        <div class="shelf-header">
          <div class="shelf-title-container">
            <span class="shelf-subtitle">Most Streamed Today</span>
            <h3 class="shelf-title">Top 10 Today</h3>
          </div>
        </div>
        <div class="movie-grid" id="top10-grid">
          ${createCardSkeletons(5)}
        </div>
      </section>

      <!-- Recommended For You Row -->
      <section class="shelf-section">
        <div class="shelf-header">
          <div class="shelf-title-container">
            <span class="shelf-subtitle">Tailored Just For You</span>
            <h3 class="shelf-title">Recommended For You</h3>
          </div>
        </div>
        <div class="movie-grid" id="recommend-grid">
          ${createCardSkeletons()}
        </div>
      </section>

      <!-- Trending Movies Row -->
      <section class="shelf-section">
        <div class="shelf-header">
          <div class="shelf-title-container">
            <span class="shelf-subtitle">Box Office Hits</span>
            <h3 class="shelf-title">Trending Movies</h3>
          </div>
        </div>
        <div class="movie-grid" id="trending-movies-grid">
          ${createCardSkeletons()}
        </div>
      </section>

      <!-- Popular TV Shows Row -->
      <section class="shelf-section">
        <div class="shelf-header">
          <div class="shelf-title-container">
            <span class="shelf-subtitle">Binge-Worthy Shows</span>
            <h3 class="shelf-title">Popular TV Series</h3>
          </div>
        </div>
        <div class="movie-grid" id="popular-tv-grid">
          ${createCardSkeletons()}
        </div>
      </section>

      <!-- Trending Anime Row -->
      <section class="shelf-section">
        <div class="shelf-header">
          <div class="shelf-title-container">
            <span class="shelf-subtitle">Anilist Favorites</span>
            <h3 class="shelf-title">Trending Anime</h3>
          </div>
        </div>
        <div class="movie-grid" id="trending-anime-grid">
          ${createCardSkeletons()}
        </div>
      </section>

      <!-- Recently Added Row -->
      <section class="shelf-section">
        <div class="shelf-header">
          <div class="shelf-title-container">
            <span class="shelf-subtitle">Fresh in Theater</span>
            <h3 class="shelf-title">Recently Added</h3>
          </div>
        </div>
        <div class="movie-grid" id="recent-added-grid">
          ${createCardSkeletons()}
        </div>
      </section>

      <!-- Coming Soon Row -->
      <section class="shelf-section">
        <div class="shelf-header">
          <div class="shelf-title-container">
            <span class="shelf-subtitle">Anticipated Releases</span>
            <h3 class="shelf-title">Coming Soon</h3>
          </div>
        </div>
        <div class="movie-grid" id="coming-soon-grid">
          ${createCardSkeletons()}
        </div>
      </section>
    </div>
  `;

  renderContinueWatching();
  renderWatchlist();
  renderBecauseYouWatched();

  // Concurrent loading
  const [movies, tvShows, anime, comingSoon, recentlyAdded] = await Promise.all([
    getTrendingMovies(),
    getPopularTV(),
    getTrendingAnime(),
    getComingSoon(),
    getRecentlyAdded()
  ]);

  if (movies && movies.length > 0) {
    const heroItem = movies[0];
    document.getElementById("hero-img").src = heroItem.backdrop_path ? 
      (heroItem.backdrop_path.startsWith("http") ? heroItem.backdrop_path : `https://image.tmdb.org/t/p/w1280${heroItem.backdrop_path}`) : 
      (heroItem.poster_path ? `https://image.tmdb.org/t/p/w1280${heroItem.poster_path}` : "");
    
    document.getElementById("hero-title").innerText = heroItem.title || heroItem.name;
    document.getElementById("hero-rating-val").innerText = heroItem.vote_average ? parseFloat(heroItem.vote_average).toFixed(1) : "7.5";
    document.getElementById("hero-year").innerText = (heroItem.release_date || "2026-01-01").split("-")[0];
    document.getElementById("hero-overview").innerText = heroItem.overview;
    document.getElementById("hero-play-btn").href = `#/watch/movie/${heroItem.id}`;

    const genresMap = {
      28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
      99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
      27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
      10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western", 10759: "Action & Adventure"
    };

    const genresHtml = (heroItem.genre_ids || [18, 35]).slice(0, 3).map(gid => {
      return `<span class="hero-genre">${genresMap[gid] || "Drama"}</span>`;
    }).join("");
    document.getElementById("hero-genres-container").innerHTML = genresHtml;
  }

  // Render shelves (6 items slices)
  document.getElementById("trending-movies-grid").innerHTML = movies.slice(0, 6).map(item => createMovieCard(item, "movie")).join("");
  document.getElementById("popular-tv-grid").innerHTML = tvShows.slice(0, 6).map(item => createMovieCard(item, "tv")).join("");
  document.getElementById("trending-anime-grid").innerHTML = anime.slice(0, 6).map(item => createMovieCard(item, "anime")).join("");
  document.getElementById("coming-soon-grid").innerHTML = comingSoon.slice(0, 6).map(item => createMovieCard(item, "movie")).join("");
  document.getElementById("recent-added-grid").innerHTML = recentlyAdded.slice(0, 6).map(item => createMovieCard(item, "movie")).join("");
  document.getElementById("recommend-grid").innerHTML = movies.slice(2, 8).map(item => createMovieCard(item, "movie")).join("");

  // Top 10 Today Row (outlines ranking numbers)
  const top10List = [...movies.slice(0, 5), ...tvShows.slice(0, 5)];
  document.getElementById("top10-grid").innerHTML = top10List.map((item, idx) => {
    const isTV = item.first_air_date ? "tv" : "movie";
    return createMovieCard(item, isTV, idx + 1);
  }).join("");
}

// -------------------------------------------------------------
// Movie details Page watch view (Redesigned)
// -------------------------------------------------------------
async function renderWatchPage(type, id, season = 1, episode = 1) {
  const app = document.getElementById("app");
  
  app.innerHTML = `
    <!-- Cinema Details Immersive Header Backdrop banner -->
    <div class="details-hero" id="details-hero-banner">
      <div class="details-hero-backdrop">
        <img id="details-backdrop-img" src="" alt="Cinema Banner" />
      </div>
      <div class="container details-hero-content">
        <a class="back-btn" href="#/" style="margin-bottom: 2rem; display: inline-flex;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to Home
        </a>
        <h1 class="hero-title" id="details-title" style="font-size:3.5rem;">Loading Title...</h1>
        
        <div class="hero-meta" style="margin-bottom: 2rem;">
          <div class="hero-rating">
            <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path></svg>
            <span id="details-rating-val">0.0</span>
          </div>
          <span class="hero-info-tag" id="details-year">2026</span>
          <span class="hero-info-tag" id="details-runtime">Runtime loading...</span>
          <div class="hero-genres" id="details-genres-container"></div>
        </div>

        <p class="hero-overview" id="details-desc" style="max-width: 700px; font-size:1rem; margin-bottom: 2.5rem;">Overview loading...</p>
        
        <div class="hero-btns">
          <button class="btn btn-primary" id="details-play-trigger">
            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
            Play Now
          </button>
          <button class="btn btn-secondary" id="details-watchlist-btn">
            <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
            <span class="bookmark-text">Add to Watchlist</span>
          </button>
          <button class="btn btn-secondary" id="details-favorite-btn">
            <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
            <span class="fav-text">Favorite</span>
          </button>
        </div>
      </div>
    </div>

    <!-- On-Demand Expandable Player container -->
    <div class="details-player-wrapper" id="player-reveal-wrapper">
      <!-- Live streaming active status bar -->
      <div class="watch-details-bar" style="border-radius:0;">
        <div class="watch-bar-left">
          <span class="watching-title" style="font-weight:700;">Streaming: <span id="bar-title-text">...</span></span>
          <div class="bar-divider"></div>
          <a href="" target="_blank" rel="noopener noreferrer" class="pill-link" id="bar-download-link" style="display:none;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Download
          </a>
        </div>
        <div class="watch-bar-right">
          <div class="streaming-pill">
            <div class="equalizer">
              <span class="eq-bar bar-1"></span>
              <span class="eq-bar bar-2"></span>
              <span class="eq-bar bar-3"></span>
            </div>
            <span>Streaming Live</span>
          </div>
        </div>
      </div>

      <div class="player-wrapper" style="border-radius:0; border-left:0; border-right:0;">
        <div class="player-ambient-glow"></div>
        <div class="player-container" style="border-radius: 0;">
          <div class="player-loader" id="watch-player-loader"><div class="loader-dots"><div class="loader-dot"></div><div class="loader-dot"></div><div class="loader-dot"></div></div></div>
          <iframe id="streaming-player" class="player-iframe" src="" allowfullscreen allow="encrypted-media" title="Streaming Player"></iframe>
        </div>
      </div>
    </div>

    <div class="container watch-info-section">
      <!-- Switch Server Panel -->
      <div class="server-section" id="server-panel-container" style="display: none; margin-top:2rem;">
        <div class="server-label-container">
          <span class="server-title">Switch Streaming Server</span>
          <p class="server-desc">Try alternative servers if the player experiences buffering or fails to load.</p>
        </div>
        <div class="server-btns">
          <button class="server-btn active" data-server="s1">S1 (Videasy)</button>
          <button class="server-btn" data-server="s2">S2 (VidSrc.to)</button>
          <button class="server-btn" data-server="s3">S3 (VidSrc.xyz)</button>
          <button class="server-btn" data-server="s4">S4 (Superembed)</button>
          <button class="server-btn" data-server="s5">S5 (VidSrc VIP)</button>
        </div>
      </div>

      <!-- TV Season & Episode Panel Selector -->
      <div class="episodes-panel" id="tv-selector-panel" style="display: none; margin-top: 2.5rem;">
        <div class="episodes-panel-header">
          <h4 class="episodes-panel-title">Seasons & Episodes Guide</h4>
          <div class="selectors-row">
            <div class="custom-select-wrapper">
              <select class="custom-select" id="season-selector"></select>
              <div class="custom-select-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>
          </div>
        </div>
        <div class="episodes-grid" id="episodes-btn-grid"></div>
      </div>

      <!-- Anime Episode selector panel -->
      <div class="episodes-panel" id="anime-selector-panel" style="display: none; margin-top: 2.5rem;">
        <div class="episodes-panel-header">
          <h4 class="episodes-panel-title">Episode Select</h4>
        </div>
        <div class="episodes-grid" id="anime-episodes-grid"></div>
      </div>

      <!-- Cast and Crew details Section -->
      <section class="cast-section" id="movie-cast-section" style="display:none;">
        <h3 class="shelf-title">Cast Members</h3>
        <p class="shelf-subtitle" style="margin-bottom:1.5rem;" id="director-name-label">Directed by Unknown</p>
        <div class="cast-grid" id="cast-cards-grid"></div>
      </section>

      <!-- Trailer Section -->
      <section class="trailer-section" id="movie-trailer-section" style="display: none;">
        <h3 class="shelf-title">Official Trailer</h3>
        <div class="trailer-video-box">
          <iframe id="trailer-youtube-iframe" style="width:100%; height:100%; border:0;" src="" allowfullscreen allow="autoplay; encrypted-media"></iframe>
        </div>
      </section>

      <!-- Similar Movies & Recommendations Row -->
      <section class="shelf-section" style="margin-top: 3.5rem; border-top:1px solid var(--surface-border);">
        <div class="shelf-header">
          <div class="shelf-title-container">
            <span class="shelf-subtitle">More Like This</span>
            <h3 class="shelf-title">Similar & Recommendations</h3>
          </div>
        </div>
        <div class="movie-grid" id="recommendations-grid">
          ${createCardSkeletons(6)}
        </div>
      </section>
    </div>
  `;

  // Fetch details
  const details = await getMediaDetails(type, id);
  if (!details) {
    app.innerHTML = `<div class="container" style="padding: 10rem 0; text-align:center;"><h2>Content not found or API error</h2><br/><a href="#/" class="btn btn-primary">Back to Home</a></div>`;
    return;
  }

  // Dynamic values
  const titleText = details.title || details.name;
  document.getElementById("details-title").innerText = titleText;
  document.getElementById("details-rating-val").innerText = details.vote_average ? parseFloat(details.vote_average).toFixed(1) : "7.5";
  document.getElementById("details-year").innerText = (details.release_date || details.first_air_date || "2026-01-01").split("-")[0];
  document.getElementById("details-desc").innerText = details.overview;
  document.getElementById("bar-title-text").innerText = titleText;

  // Runtime tag
  const runtimeMin = details.runtime || details.episode_run_time ? (details.runtime || details.episode_run_time[0]) : null;
  document.getElementById("details-runtime").innerText = runtimeMin ? `${runtimeMin} min` : (type === "movie" ? "120 min" : "45 min");

  if (details.genres) {
    document.getElementById("details-genres-container").innerHTML = details.genres.slice(0, 3).map(g => `<span class="hero-genre">${g.name}</span>`).join("");
  }

  // Banner Backdrop
  const bannerImg = document.getElementById("details-backdrop-img");
  const bgPath = details.backdrop_path || details.poster_path;
  bannerImg.src = bgPath ? (bgPath.startsWith("http") ? bgPath : `https://image.tmdb.org/t/p/w1280${bgPath}`) : "";

  // Dynamic buttons actions
  const watchmarked = window.isInWatchlist(id, type);
  const favorited = window.isFavorite(id, type);
  updateBookmarkUIStates(id, type, watchmarked);
  updateFavoriteUIStates(id, type, favorited);

  document.getElementById("details-watchlist-btn").onclick = (e) => window.toggleWatchlist(e, type, id);
  document.getElementById("details-favorite-btn").onclick = (e) => window.toggleFavorite(e, type, id);

  // Setup Server player iframe loader source trigger
  function updatePlayerSource(serverName) {
    const iframe = document.getElementById("streaming-player");
    const loader = document.getElementById("watch-player-loader");
    loader.style.display = "flex"; 
    
    const saved = getWatchProgress(type, id, season, episode);
    const startSec = (saved && saved.timestamp) ? Math.floor(saved.timestamp) : 0;
    
    let url = "";
    const colorHex = settings.accentColor.replace("#", "");

    if (serverName === "s1") {
      if (type === "movie") {
        url = `https://player.videasy.net/movie/${id}?color=${colorHex}&overlay=${settings.playerOverlay}&progress=${startSec}`;
      } else if (type === "tv") {
        url = `https://player.videasy.net/tv/${id}/${season}/${episode}?color=${colorHex}&overlay=${settings.playerOverlay}&nextEpisode=${settings.playerNextBtn}&autoplayNextEpisode=${settings.playerAutoplay}&episodeSelector=${settings.playerSelector}&progress=${startSec}`;
      } else if (type === "anime") {
        url = `https://player.videasy.net/anime/${id}/${episode}?color=${colorHex}&overlay=${settings.playerOverlay}&nextEpisode=${settings.playerNextBtn}&autoplayNextEpisode=${settings.playerAutoplay}&episodeSelector=${settings.playerSelector}&progress=${startSec}`;
      }
    } else {
      const baseMap = {
        s2: `https://vidsrc.to/embed/`,
        s3: `https://vidsrc.xyz/embed/`,
        s4: `https://multiembed.to/embed.php?tmdb=1&video_id=`,
        s5: `https://vidsrc.vip/embed/`
      };
      
      const baseUrl = baseMap[serverName];
      if (serverName === "s4") {
        url = type === "movie" ? `${baseUrl}${id}` : `${baseUrl}${id}&s=${season}&e=${episode}`;
      } else {
        url = type === "movie" ? `${baseUrl}movie/${id}` : `${baseUrl}tv/${id}/${season}/${episode}`;
      }
      if (startSec > 0 && serverName !== "s4") url += `?t=${startSec}`;
    }

    iframe.src = url;
    iframe.onload = () => { loader.style.display = "none"; };
    
    // Log watchlist watch history progress
    logWatchHistory({
      id: id,
      type: type,
      title: titleText,
      poster: details.poster_path,
      season: type === "movie" ? null : season,
      episode: type === "movie" ? null : episode
    });
  }

  // Play Now trigger expands player wrapper in-place
  const playTrigger = document.getElementById("details-play-trigger");
  playTrigger.onclick = () => {
    const wrapper = document.getElementById("player-reveal-wrapper");
    const serverPanel = document.getElementById("server-panel-container");
    
    wrapper.classList.add("expanded");
    serverPanel.style.display = "block";
    
    updatePlayerSource(currentWatchServer);
    
    setTimeout(() => {
      wrapper.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  };

  if (type === "movie") {
    const dlLink = document.getElementById("bar-download-link");
    dlLink.href = `https://dl.vidsrc.vip/movie/${id}`;
    dlLink.style.display = "inline-flex";
  }

  const serverButtons = document.querySelectorAll(".server-btn");
  serverButtons.forEach(btn => {
    if (btn.dataset.server === currentWatchServer) {
      serverButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    }
    btn.addEventListener("click", () => {
      serverButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentWatchServer = btn.dataset.server;
      updatePlayerSource(currentWatchServer);
    });
  });

  // TV Selector Guide
  if (type === "tv") {
    const tvSelectorPanel = document.getElementById("tv-selector-panel");
    const seasonSelect = document.getElementById("season-selector");
    const episodesGrid = document.getElementById("episodes-btn-grid");

    tvSelectorPanel.style.display = "block";
    const totalSeasons = details.number_of_seasons || (details.seasons ? details.seasons.length : 1);
    let seasonsOptions = "";
    for (let s = 1; s <= totalSeasons; s++) {
      seasonsOptions += `<option value="${s}" ${s == season ? 'selected' : ''}>Season ${s}</option>`;
    }
    seasonSelect.innerHTML = seasonsOptions;

    async function loadEpisodesForSeason(sNum) {
      episodesGrid.innerHTML = `<span style="font-size:0.85rem; color:var(--muted)">Loading Season ${sNum} episodes...</span>`;
      let episodesList = await getSeasonDetails(id, sNum);
      if (!episodesList || episodesList.length === 0) {
        episodesList = Array.from({ length: 12 }, (_, i) => ({ episode_number: i + 1 }));
      }
      episodesGrid.innerHTML = episodesList.map(ep => {
        const epNum = ep.episode_number;
        const isActive = sNum == season && epNum == episode;
        return `<a class="episode-btn ${isActive ? 'active' : ''}" href="#/watch/tv/${id}/${sNum}/${epNum}">${epNum}</a>`;
      }).join("");
    }
    loadEpisodesForSeason(season);
    seasonSelect.addEventListener("change", (e) => loadEpisodesForSeason(e.target.value));
  }

  // Anime Selector Guide
  if (type === "anime") {
    const animeSelectorPanel = document.getElementById("anime-selector-panel");
    const animeEpisodesGrid = document.getElementById("anime-episodes-grid");

    animeSelectorPanel.style.display = "block";
    const epsCount = details.episodes_count || 12;
    let animeEpisodesHtml = "";
    for (let e = 1; e <= epsCount; e++) {
      const isActive = e == episode;
      animeEpisodesHtml += `<a class="episode-btn ${isActive ? 'active' : ''}" href="#/watch/anime/${id}/${e}">${e}</a>`;
    }
    animeEpisodesGrid.innerHTML = animeEpisodesHtml;
  }

  // Fetch Trailer & Cast credits concurrently
  if (type !== "anime") {
    // TMDB credits and video
    Promise.all([
      tmdbFetch(`/${type}/${id}/credits`),
      tmdbFetch(`/${type}/${id}/videos`)
    ]).then(([credits, videoData]) => {
      // Cast List
      if (credits && credits.cast && credits.cast.length > 0) {
        const castSection = document.getElementById("movie-cast-section");
        const castGrid = document.getElementById("cast-cards-grid");
        const dirLabel = document.getElementById("director-name-label");

        castSection.style.display = "block";
        const directorObj = credits.crew ? credits.crew.find(c => c.job === "Director") : null;
        dirLabel.innerText = directorObj ? `Directed by ${directorObj.name}` : "";

        castGrid.innerHTML = credits.cast.slice(0, 6).map(cast => {
          const pic = cast.profile_path ? `https://image.tmdb.org/t/p/w185${cast.profile_path}` : "https://placehold.co/150x150/0a0a0e/ffffff?text=Actor";
          return `
            <div class="cast-card">
              <img class="cast-avatar" src="${pic}" alt="${cast.name}">
              <span class="cast-name">${cast.name}</span>
              <span class="cast-character">${cast.character}</span>
            </div>
          `;
        }).join("");
      }

      // Trailer
      if (videoData && videoData.results) {
        const trailer = videoData.results.find(v => v.type === "Trailer" && v.site === "YouTube");
        if (trailer) {
          document.getElementById("movie-trailer-section").style.display = "block";
          document.getElementById("trailer-youtube-iframe").src = `https://www.youtube.com/embed/${trailer.key}`;
        }
      }
    });
  } else {
    // Anime staff and trailer (from Anilist graphql cache)
    if (details.staff && details.staff.length > 0) {
      document.getElementById("movie-cast-section").style.display = "block";
      document.getElementById("director-name-label").innerText = `Directed by ${details.staff.join(", ")}`;
    }
    if (details.trailer_id) {
      document.getElementById("movie-trailer-section").style.display = "block";
      document.getElementById("trailer-youtube-iframe").src = `https://www.youtube.com/embed/${details.trailer_id}`;
    }
  }

  // Video Progress details tracking
  window.currentVideoDetails = {
    id: id,
    type: type,
    season: season,
    episode: episode,
    title: titleText,
    poster: details.poster_path
  };

  // Similar Recommendations Grid
  const recommendations = await getRecommendations(type, id);
  document.getElementById("recommendations-grid").innerHTML = recommendations.slice(0, 6).map(item => createMovieCard(item, type)).join("");
}

// -------------------------------------------------------------
// Advanced Filter & Search suggestions
// -------------------------------------------------------------
async function handleSearchInput(query) {
  const overlay = document.getElementById("search-results-overlay");
  const querySpan = document.getElementById("search-query-text");
  const grid = document.getElementById("search-grid");

  if (!query || query.trim() === "") {
    overlay.classList.remove("open");
    return;
  }

  overlay.classList.add("open");
  querySpan.innerText = `"${query}"`;
  grid.innerHTML = createCardSkeletons(6);

  // Save recent search
  saveRecentSearch(query);

  const results = await searchCatalog(query);
  window.currentSearchResults = results || [];
  
  applySearchFilters();
}

function saveRecentSearch(query) {
  if (!query || query.trim().length < 2) return;
  let searches = JSON.parse(localStorage.getItem("kingamu_recent_searches")) || [];
  searches = searches.filter(s => s.toLowerCase() !== query.toLowerCase());
  searches.unshift(query);
  if (searches.length > 5) searches.pop();
  localStorage.setItem("kingamu_recent_searches", JSON.stringify(searches));
}

function removeRecentSearch(query) {
  let searches = JSON.parse(localStorage.getItem("kingamu_recent_searches")) || [];
  searches = searches.filter(s => s !== query);
  localStorage.setItem("kingamu_recent_searches", JSON.stringify(searches));
  renderSearchSuggestionsDropdown();
}

function applySearchFilters() {
  const genre = document.getElementById("filter-genre").value;
  const year = document.getElementById("filter-year").value;
  const rating = document.getElementById("filter-rating").value;
  const lang = document.getElementById("filter-language").value;
  
  let filtered = [...window.currentSearchResults];
  
  if (genre) {
    filtered = filtered.filter(item => {
      if (item.genre_ids) return item.genre_ids.includes(parseInt(genre));
      if (item.genres) return item.genres.some(g => g.id == genre || g.name == genre);
      return false;
    });
  }
  
  if (year) {
    filtered = filtered.filter(item => {
      const date = item.release_date || item.first_air_date || `${item.year}-01-01`;
      const itemYear = date.split("-")[0];
      if (year.endsWith("s")) {
        const dec = parseInt(year);
        const iy = parseInt(itemYear);
        return iy >= dec && iy < dec + 10;
      }
      return itemYear === year;
    });
  }
  
  if (rating) {
    filtered = filtered.filter(item => {
      const r = item.vote_average || item.rating || 0;
      return parseFloat(r) >= parseFloat(rating);
    });
  }
  
  if (lang) {
    filtered = filtered.filter(item => item.original_language === lang);
  }
  
  const grid = document.getElementById("search-grid");
  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 4rem 0; color:var(--muted)">No results match the selected filters.</div>`;
    return;
  }
  grid.innerHTML = filtered.map(item => createMovieCard(item, item.media_type)).join("");
}

// Live Autocomplete Suggestions dropdown logic
async function renderSearchSuggestionsDropdown() {
  const input = document.getElementById("search-input");
  const box = document.getElementById("search-suggestions-box");
  const query = input.value.trim();
  
  if (!query) {
    // Show Recent & Trending searches lists
    const recents = JSON.parse(localStorage.getItem("kingamu_recent_searches")) || [];
    const trendings = ["Avengers", "Cruella", "One Piece", "Breaking Bad"];
    
    let html = "";
    if (recents.length > 0) {
      html += `<div class="suggestion-section-title">Recent Searches</div>`;
      recents.forEach(item => {
        html += `
          <div class="suggestion-item recent-search-term" data-term="${item}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span>${item}</span>
            <div class="suggestion-clear" data-term="${item}">&times;</div>
          </div>
        `;
      });
    }
    
    html += `<div class="suggestion-section-title">Trending Searches</div>`;
    trendings.forEach(item => {
      html += `
        <div class="suggestion-item trending-search-term trending" data-term="${item}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          <span>${item}</span>
        </div>
      `;
    });
    
    box.innerHTML = html;
    box.classList.add("open");
    
    // Bind listeners
    box.querySelectorAll(".suggestion-clear").forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        removeRecentSearch(btn.dataset.term);
      };
    });
    
    box.querySelectorAll(".recent-search-term, .trending-search-term").forEach(el => {
      el.onclick = () => {
        input.value = el.dataset.term;
        handleSearchInput(el.dataset.term);
        box.classList.remove("open");
      };
    });
  } else {
    // Show matching titles list autocomplete suggestions
    const results = await searchCatalog(query);
    if (!results || results.length === 0) {
      box.innerHTML = `<div style="padding: 1rem 1.25rem; font-size:0.8rem; color:var(--muted)">No autocomplete suggestions found</div>`;
      return;
    }
    
    let html = `<div class="suggestion-section-title">Matching Titles</div>`;
    results.slice(0, 5).forEach(item => {
      const title = item.title || item.name;
      const date = item.release_date || item.first_air_date || "2026-01-01";
      const year = date.split("-")[0];
      const posterPath = item.poster_path ? `https://image.tmdb.org/t/p/w92${item.poster_path}` : "https://placehold.co/92x138/0a0a0e/ffffff?text=No+Poster";
      const typeLabel = item.media_type === "tv" ? "TV Show" : "Movie";

      let watchRoute = `#/watch/movie/${item.id}`;
      if (item.media_type === "tv") watchRoute = `#/watch/tv/${item.id}/1/1`;
      
      html += `
        <a class="suggestion-movie-item" href="${watchRoute}">
          <img class="suggestion-movie-poster" src="${posterPath}" alt="Poster">
          <div class="suggestion-movie-info">
            <span class="suggestion-movie-title">${title}</span>
            <span class="suggestion-movie-meta">${year} &bull; ${typeLabel}</span>
          </div>
        </a>
      `;
    });
    
    box.innerHTML = html;
    box.classList.add("open");
  }
}

// -------------------------------------------------------------
// Authentication Page View Render (`#/auth`)
// -------------------------------------------------------------
function renderAuthPage() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-tabs">
          <div class="auth-tab active" id="auth-tab-login">Login</div>
          <div class="auth-tab" id="auth-tab-register">Register</div>
          <div class="auth-tab-slider" id="auth-tab-indicator"></div>
        </div>
        
        <!-- Login Form -->
        <form class="auth-form" id="login-form">
          <div class="form-group">
            <label class="form-label" for="login-email">Email Address</label>
            <input type="email" id="login-email" class="form-input" required placeholder="watcher@kingamu.com">
          </div>
          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label class="form-label" for="login-password">Password</label>
            <input type="password" id="login-password" class="form-input" required placeholder="••••••••">
          </div>
          <button class="btn btn-primary auth-btn" type="submit">Sign In</button>
        </form>

        <!-- Register Form -->
        <form class="auth-form" id="register-form" style="display: none;">
          <div class="form-group">
            <label class="form-label" for="reg-username">Username</label>
            <input type="text" id="reg-username" class="form-input" required placeholder="KingamuWatcher">
          </div>
          <div class="form-group">
            <label class="form-label" for="reg-email">Email Address</label>
            <input type="email" id="reg-email" class="form-input" required placeholder="watcher@kingamu.com">
          </div>
          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label class="form-label" for="reg-password">Password</label>
            <input type="password" id="reg-password" class="form-input" required placeholder="••••••••">
          </div>
          <button class="btn btn-primary auth-btn" type="submit">Create Account</button>
        </form>
      </div>
    </div>
  `;

  const tabLogin = document.getElementById("auth-tab-login");
  const tabRegister = document.getElementById("auth-tab-register");
  const indicator = document.getElementById("auth-tab-indicator");
  const formLogin = document.getElementById("login-form");
  const formRegister = document.getElementById("register-form");

  tabLogin.onclick = () => {
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    indicator.classList.remove("signup");
    formLogin.style.display = "flex";
    formRegister.style.display = "none";
  };

  tabRegister.onclick = () => {
    tabLogin.classList.remove("active");
    tabRegister.classList.add("active");
    indicator.classList.add("signup");
    formLogin.style.display = "none";
    formRegister.style.display = "flex";
  };

  // Submit mock actions
  formLogin.onsubmit = (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const name = email.split("@")[0];
    
    saveUserSession({
      username: name.charAt(0).toUpperCase() + name.slice(1),
      email: email,
      avatarId: "av1",
      isLoggedIn: true
    });
    
    window.location.hash = "#/profile";
  };

  formRegister.onsubmit = (e) => {
    e.preventDefault();
    const username = document.getElementById("reg-username").value;
    const email = document.getElementById("reg-email").value;
    
    saveUserSession({
      username: username,
      email: email,
      avatarId: "av2",
      isLoggedIn: true
    });
    
    window.location.hash = "#/profile";
  };
}

// -------------------------------------------------------------
// User Profile & Settings Page View Render (`#/profile`)
// -------------------------------------------------------------
function renderProfilePage() {
  if (!currentUser || !currentUser.isLoggedIn) {
    window.location.hash = "#/auth";
    return;
  }

  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="container profile-container">
      <div class="profile-grid-layout">
        <!-- Sidebar profile card overview -->
        <div class="profile-sidebar">
          <div class="profile-avatar-circle">
            <img id="sidebar-avatar-img" src="" alt="Avatar">
          </div>
          <span class="profile-username-label" id="sidebar-username">Watcher</span>
          <span class="profile-email-label" id="sidebar-email">watcher@kingamu.com</span>
          
          <div class="profile-menu">
            <button class="profile-menu-item active" data-tab="tab-account">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              Account Details
            </button>
            <button class="profile-menu-item" data-tab="tab-library">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
              My Library
            </button>
            <button class="profile-menu-item" data-tab="tab-history">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              Watch History
            </button>
            <button class="profile-menu-item" id="profile-signout-btn" style="color:var(--accent); margin-top:2rem;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
              Sign Out
            </button>
          </div>
        </div>

        <!-- Sidebar Content Display card -->
        <div class="profile-content-card">
          <!-- 1. Account details tab -->
          <div class="profile-tab-content" id="tab-account">
            <h3 class="profile-section-title">Personal Info & Customizations</h3>
            <form id="profile-details-form">
              <div class="form-group" style="margin-bottom:1.5rem;">
                <label class="form-label" for="profile-username-input">Watcher Nickname</label>
                <input type="text" id="profile-username-input" class="form-input" required>
              </div>
              
              <div class="form-group" style="margin-bottom:1.5rem;">
                <label class="form-label">Choose Avatar Icon</label>
                <div class="avatar-picker-grid">
                  ${USER_AVATARS.map(av => `
                    <div class="avatar-option-item ${av.id === currentUser.avatarId ? 'active' : ''}" data-avatar-id="${av.id}">
                      <img src="${av.url}" alt="${av.name}">
                    </div>
                  `).join("")}
                </div>
              </div>

              <!-- Custom Avatar File Uploader -->
              <div class="form-group" style="margin-bottom: 2rem;">
                <label class="form-label">Or Upload Custom Avatar</label>
                <div class="custom-avatar-uploader" style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
                  <label for="avatar-file-input" class="btn btn-secondary" style="padding: 0.65rem 1.25rem; display: inline-flex; align-items: center; gap: 0.5rem; border-radius: 8px; font-size: 0.75rem; font-weight: 800; cursor: pointer; border: 1px solid var(--surface-border);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="width:1rem; height:1rem;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                    Choose Picture
                  </label>
                  <input type="file" id="avatar-file-input" accept="image/*" style="display: none;">
                  <span id="avatar-file-name" style="font-size: 0.75rem; color: var(--muted); font-weight: 500;">
                    ${currentUser.customAvatar ? "Custom picture uploaded" : "No custom file chosen"}
                  </span>
                </div>
              </div>
              
              <button type="submit" class="btn btn-primary">Save Profile</button>
            </form>
          </div>

          <!-- 2. Library tab (watchlist & favorites) -->
          <div class="profile-tab-content" id="tab-library" style="display:none;">
            <h3 class="profile-section-title">My Favorites & Saved Titles</h3>
            
            <div style="margin-bottom: 3rem;">
              <h4 style="font-size:1.1rem; text-transform:uppercase; margin-bottom:1.5rem;">Favorites</h4>
              <div class="movie-grid" id="profile-favorites-grid"></div>
            </div>
            
            <div>
              <h4 style="font-size:1.1rem; text-transform:uppercase; margin-bottom:1.5rem;">My Watchlist</h4>
              <div class="movie-grid" id="profile-watchlist-grid"></div>
            </div>
          </div>

          <!-- 3. History timeline tab -->
          <div class="profile-tab-content" id="tab-history" style="display:none;">
            <h3 class="profile-section-title">Streaming Watch History</h3>
            <div class="history-list" id="profile-history-list"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Apply sidebar metadata
  if (currentUser.customAvatar) {
    document.getElementById("sidebar-avatar-img").src = currentUser.customAvatar;
  } else {
    const sidebarAvatar = USER_AVATARS.find(a => a.id === currentUser.avatarId) || USER_AVATARS[0];
    document.getElementById("sidebar-avatar-img").src = sidebarAvatar.url;
  }
  document.getElementById("sidebar-username").innerText = currentUser.username;
  document.getElementById("sidebar-email").innerText = currentUser.email;
  document.getElementById("profile-username-input").value = currentUser.username;

  // Account details form submission
  let selectedAvatarId = currentUser.avatarId;
  let selectedCustomAvatar = currentUser.customAvatar || null;
  const avatarOptions = document.querySelectorAll(".avatar-option-item");
  const fileInput = document.getElementById("avatar-file-input");
  const fileNameSpan = document.getElementById("avatar-file-name");

  avatarOptions.forEach(opt => {
    opt.onclick = () => {
      avatarOptions.forEach(o => o.classList.remove("active"));
      opt.classList.add("active");
      selectedAvatarId = opt.dataset.avatarId;
      selectedCustomAvatar = null; // reset custom avatar if preset icon selected
      fileNameSpan.innerText = "Preset avatar selected";
      fileNameSpan.style.color = "var(--muted)";
    };
  });

  // Handle custom file upload reader
  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image file size must be less than 2MB!");
        fileInput.value = "";
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        selectedCustomAvatar = event.target.result;
        selectedAvatarId = null; // de-select preset avatar id
        avatarOptions.forEach(o => o.classList.remove("active"));
        fileNameSpan.innerText = `${file.name} (Ready to save)`;
        fileNameSpan.style.color = "var(--accent)";
      };
      reader.readAsDataURL(file);
    }
  };

  document.getElementById("profile-details-form").onsubmit = (e) => {
    e.preventDefault();
    currentUser.username = document.getElementById("profile-username-input").value.trim();
    currentUser.avatarId = selectedAvatarId;
    currentUser.customAvatar = selectedCustomAvatar;
    saveUserSession(currentUser);
    renderProfilePage();
  };

  // Sign out button
  document.getElementById("profile-signout-btn").onclick = () => {
    saveUserSession(null);
    window.location.hash = "#/";
  };

  // Library rendering
  const watchlist = JSON.parse(localStorage.getItem("kingamu_watchlist")) || [];
  const favorites = JSON.parse(localStorage.getItem("kingamu_favorites")) || [];
  
  document.getElementById("profile-watchlist-grid").innerHTML = watchlist.length > 0 ? 
    watchlist.map(item => createMovieCard(item, item.type)).join("") : 
    `<span style="font-size:0.85rem; color:var(--muted)">Your Watchlist is empty.</span>`;
    
  document.getElementById("profile-favorites-grid").innerHTML = favorites.length > 0 ? 
    favorites.map(item => createMovieCard(item, item.type)).join("") : 
    `<span style="font-size:0.85rem; color:var(--muted)">You haven't favorited any titles yet.</span>`;

  // History timeline rendering
  const history = JSON.parse(localStorage.getItem("kingamu_history")) || [];
  const historyList = document.getElementById("profile-history-list");
  if (history.length === 0) {
    historyList.innerHTML = `<span style="font-size:0.85rem; color:var(--muted)">No streaming logs found in history.</span>`;
  } else {
    historyList.innerHTML = history.map(item => {
      const dateStr = new Date(item.watchedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
      const posterPath = item.poster ? 
        (item.poster.startsWith("http") ? item.poster : `https://image.tmdb.org/t/p/w92${item.poster}`) : 
        "https://placehold.co/92x138/0a0a0e/ffffff?text=Poster";
      const typeLabel = item.type === "movie" ? "Movie" : `S${item.season} E${item.episode}`;
      
      let watchRoute = `#/watch/movie/${item.id}`;
      if (item.type === "tv") watchRoute = `#/watch/tv/${item.id}/${item.season}/${item.episode}`;
      if (item.type === "anime") watchRoute = `#/watch/anime/${item.id}/${item.episode}`;

      return `
        <div class="history-item">
          <img class="history-poster" src="${posterPath}" alt="Poster">
          <div class="history-info">
            <span class="history-title">${item.title}</span>
            <span class="history-meta" style="color:var(--accent); font-weight:800;">${typeLabel}</span>
          </div>
          <span class="history-date">${dateStr}</span>
          <a class="icon-btn" href="${watchRoute}" title="Resume Play">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </a>
        </div>
      `;
    }).join("");
  }

  // Sidebar Tabs clicking listeners
  const menuButtons = document.querySelectorAll(".profile-menu-item[data-tab]");
  const tabPanels = document.querySelectorAll(".profile-tab-content");
  
  menuButtons.forEach(btn => {
    btn.onclick = () => {
      menuButtons.forEach(b => b.classList.remove("active"));
      tabPanels.forEach(p => p.style.display = "none");
      
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).style.display = "block";
    };
  });
}

// -------------------------------------------------------------
// SPA Hash Router
// -------------------------------------------------------------
async function router() {
  const hash = window.location.hash || "#/";
  
  document.getElementById("search-input").value = "";
  document.getElementById("search-results-overlay").classList.remove("open");
  document.getElementById("search-suggestions-box").classList.remove("open");

  updateActiveNavLink();

  const globalLoader = document.getElementById("global-loader");
  if (globalLoader) {
    generateLoaderParticles();
    globalLoader.classList.remove("fade-out");
  }

  const parts = hash.split("/");
  
  try {
    if (hash === "#/" || hash === "") {
      await renderHomePage();
    } else if (parts[1] === "movies") {
      await renderCatalogPage("movie");
    } else if (parts[1] === "tv") {
      await renderCatalogPage("tv");
    } else if (parts[1] === "anime") {
      await renderCatalogPage("anime");
    } else if (parts[1] === "auth") {
      renderAuthPage();
    } else if (parts[1] === "profile") {
      renderProfilePage();
    } else if (parts[1] === "watch") {
      const type = parts[2]; 
      const id = parts[3];
      
      if (type === "movie") {
        await renderWatchPage("movie", id);
      } else if (type === "tv") {
        const season = parseInt(parts[4]) || 1;
        const episode = parseInt(parts[5]) || 1;
        await renderWatchPage("tv", id, season, episode);
      } else if (type === "anime") {
        const episode = parseInt(parts[4]) || 1;
        await renderWatchPage("anime", id, 1, episode);
      }
    } else {
      document.getElementById("app").innerHTML = `
        <div class="container" style="padding: 10rem 0; text-align:center;">
          <h1 style="font-size: 5rem; font-family: var(--font-display);">404</h1>
          <p style="color:var(--muted)">Oops! The page you are looking for does not exist.</p>
          <br/><br/>
          <a href="#/" class="btn btn-primary">Back to Home</a>
        </div>
      `;
    }
  } catch (err) {
    console.error("Router navigation error: ", err);
  }

  setTimeout(() => {
    if (globalLoader) {
      globalLoader.classList.add("fade-out");
    }
  }, 500);

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateActiveNavLink() {
  const hash = window.location.hash || "#/";
  const navLinks = document.querySelectorAll("#main-nav-links .nav-link");
  navLinks.forEach(link => {
    const route = link.dataset.route;
    let isActive = false;
    if (route === "") {
      isActive = hash === "#/" || hash === "";
    } else {
      isActive = hash.startsWith(`#/${route}`);
    }
    
    if (isActive) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // Also highlight mobile bottom nav links
  const bottomLinks = document.querySelectorAll("#mobile-bottom-nav .bottom-nav-item");
  bottomLinks.forEach(link => {
    const route = link.dataset.route;
    let isActive = false;
    if (route === "") {
      isActive = hash === "#/" || hash === "";
    } else {
      isActive = hash.startsWith(`#/${route}`);
    }
    
    if (isActive) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

let catalogCurrentPage = 1;
let catalogMediaList = [];
let catalogType = "movie";

async function renderCatalogPage(type) {
  catalogType = type;
  catalogCurrentPage = 1;
  catalogMediaList = [];
  
  const app = document.getElementById("app");
  
  let titleLabel = "Movies Catalog";
  if (type === "tv") titleLabel = "TV Shows Catalog";
  if (type === "anime") titleLabel = "Anime Catalog";
  
  app.innerHTML = `
    <div class="container" style="padding: 4rem 0;">
      <div class="catalog-header-bar">
        <h2 class="catalog-title">${titleLabel.split(" ")[0]} <span>${titleLabel.split(" ")[1]}</span></h2>
        
        <div class="catalog-filters">
          <div class="filter-group" style="min-width: 140px;">
            <label class="filter-label">Genre</label>
            <div class="custom-select-wrapper">
              <select id="catalog-filter-genre" class="custom-select filter-select">
                <option value="">All Genres</option>
              </select>
              <div class="custom-select-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>
          </div>
          
          <div class="filter-group" style="min-width: 120px;">
            <label class="filter-label">Year</label>
            <div class="custom-select-wrapper">
              <select id="catalog-filter-year" class="custom-select filter-select">
                <option value="">All Years</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
                <option value="2020">2020</option>
                <option value="2020s">2020s</option>
                <option value="2010s">2010s</option>
                <option value="2000s">2000s</option>
              </select>
              <div class="custom-select-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>
          </div>

          <div class="filter-group" style="min-width: 140px;">
            <label class="filter-label">Sort By</label>
            <div class="custom-select-wrapper">
              <select id="catalog-filter-sort" class="custom-select filter-select">
                <option value="popularity.desc">Popularity</option>
                <option value="vote_average.desc">Top Rated</option>
                <option value="primary_release_date.desc">Release Date</option>
              </select>
              <div class="custom-select-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="movie-grid" id="catalog-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 2rem;">
        ${createCardSkeletons(12)}
      </div>
      
      <div class="load-more-container">
        <button class="btn btn-primary" id="catalog-load-more-btn" style="padding: 0.85rem 3rem;">Load More</button>
      </div>
    </div>
  `;
  
  const genreSelect = document.getElementById("catalog-filter-genre");
  let genresList = [];
  if (type === "anime") {
    genresList = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Mystery", "Romance", "Sci-Fi", "Supernatural"];
  } else {
    const tmdbGenres = {
      28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
      99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
      27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
      10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western"
    };
    genresList = Object.entries(tmdbGenres).map(([id, name]) => ({ id, name }));
  }
  
  genreSelect.innerHTML = `<option value="">All Genres</option>` + genresList.map(g => {
    const val = type === "anime" ? g : g.id;
    const label = type === "anime" ? g : g.name;
    return `<option value="${val}">${label}</option>`;
  }).join("");
  
  document.getElementById("catalog-filter-genre").addEventListener("change", () => { catalogCurrentPage = 1; fetchCatalogData(true); });
  document.getElementById("catalog-filter-year").addEventListener("change", () => { catalogCurrentPage = 1; fetchCatalogData(true); });
  document.getElementById("catalog-filter-sort").addEventListener("change", () => { catalogCurrentPage = 1; fetchCatalogData(true); });
  
  document.getElementById("catalog-load-more-btn").addEventListener("click", () => {
    catalogCurrentPage++;
    fetchCatalogData(false);
  });
  
  await fetchCatalogData(true);
}

async function fetchCatalogData(isNewQuery = false) {
  const grid = document.getElementById("catalog-grid");
  const loadMoreBtn = document.getElementById("catalog-load-more-btn");
  if (!grid || !loadMoreBtn) return;
  
  loadMoreBtn.innerText = "Loading...";
  loadMoreBtn.disabled = true;
  
  if (isNewQuery) {
    grid.innerHTML = createCardSkeletons(12);
    catalogMediaList = [];
  }
  
  let results = [];
  const genreVal = document.getElementById("catalog-filter-genre").value;
  const yearVal = document.getElementById("catalog-filter-year").value;
  const sortVal = document.getElementById("catalog-filter-sort").value;
  
  if (catalogType === "anime") {
    let queryStr = `
    query ($page: Int, $perPage: Int, $genre: String, $sort: [MediaSort]) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          hasNextPage
        }
        media(type: ANIME, genre: $genre, sort: $sort) {
          id
          title {
            english
            romaji
          }
          coverImage {
            extraLarge
            large
          }
          bannerImage
          description
          averageScore
          startDate {
            year
          }
        }
      }
    }`;
    
    const sortsMap = {
      "popularity.desc": ["POPULARITY_DESC"],
      "vote_average.desc": ["SCORE_DESC"],
      "primary_release_date.desc": ["START_DATE_DESC"]
    };
    
    const vars = {
      page: catalogCurrentPage,
      perPage: 18,
      sort: sortsMap[sortVal] || ["POPULARITY_DESC"]
    };
    if (genreVal) vars.genre = genreVal;
    
    const data = await fetchAnilist(queryStr, vars);
    if (data && data.Page && data.Page.media) {
      results = data.Page.media.map(item => ({
        id: item.id,
        title: item.title.english || item.title.romaji,
        name: item.title.english || item.title.romaji, 
        poster_path: item.coverImage.extraLarge || item.coverImage.large,
        backdrop_path: item.bannerImage || item.coverImage.extraLarge,
        vote_average: item.averageScore ? (item.averageScore / 10).toFixed(1) : "7.5",
        release_date: item.startDate.year ? `${item.startDate.year}-01-01` : "2026-01-01",
        first_air_date: item.startDate.year ? `${item.startDate.year}-01-01` : "2026-01-01",
        overview: item.description ? item.description.replace(/<[^>]*>/g, "") : "",
        media_type: "anime"
      }));
      
      if (yearVal) {
        results = results.filter(item => {
          const y = item.release_date.split("-")[0];
          if (yearVal.endsWith("s")) {
            const dec = parseInt(yearVal);
            const iy = parseInt(y);
            return iy >= dec && iy < dec + 10;
          }
          return y === yearVal;
        });
      }
      
      cacheResults(results, "anime");
      loadMoreBtn.style.display = data.Page.pageInfo.hasNextPage ? "block" : "none";
    }
  } else {
    const params = {
      page: catalogCurrentPage,
      sort_by: sortVal
    };
    
    if (genreVal) params.with_genres = genreVal;
    if (yearVal) {
      if (yearVal.endsWith("s")) {
        const startDecade = parseInt(yearVal);
        if (catalogType === "movie") {
          params["primary_release_date.gte"] = `${startDecade}-01-01`;
          params["primary_release_date.lte"] = `${startDecade + 9}-12-31`;
        } else {
          params["first_air_date.gte"] = `${startDecade}-01-01`;
          params["first_air_date.lte"] = `${startDecade + 9}-12-31`;
        }
      } else {
        if (catalogType === "movie") {
          params.primary_release_year = yearVal;
        } else {
          params.first_air_date_year = yearVal;
        }
      }
    }
    
    const endpoint = catalogType === "movie" ? "/discover/movie" : "/discover/tv";
    const data = await tmdbFetch(endpoint, params);
    if (data && data.results) {
      results = data.results;
      cacheResults(results, catalogType);
      loadMoreBtn.style.display = catalogCurrentPage < data.total_pages ? "block" : "none";
    }
  }
  
  catalogMediaList = [...catalogMediaList, ...results];
  
  if (catalogMediaList.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:5rem 0; color:var(--muted)">No catalog titles found matching the filters.</div>`;
    loadMoreBtn.style.display = "none";
    return;
  }
  
  grid.innerHTML = catalogMediaList.map(item => createMovieCard(item, catalogType)).join("");
  
  loadMoreBtn.innerText = "Load More";
  loadMoreBtn.disabled = false;
}

// -------------------------------------------------------------
// App Initialization
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  applyAccentColor(settings.accentColor);
  loadUserSession();

  document.addEventListener("mousemove", (e) => {
    document.documentElement.style.setProperty("--mouse-x", e.clientX + "px");
    document.documentElement.style.setProperty("--mouse-y", e.clientY + "px");
  });

  router();
  window.addEventListener("hashchange", router);

  window.addEventListener("scroll", () => {
    const header = document.querySelector(".header");
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });

  // Search input and autocomplete
  const searchInput = document.getElementById("search-input");
  let searchTimer;
  
  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      handleSearchInput(e.target.value);
      renderSearchSuggestionsDropdown();
    }, 400);
  });

  searchInput.addEventListener("focus", () => {
    renderSearchSuggestionsDropdown();
  });

  document.addEventListener("click", (e) => {
    const searchWrapper = document.querySelector(".search-wrapper");
    if (searchWrapper && !searchWrapper.contains(e.target)) {
      document.getElementById("search-suggestions-box").classList.remove("open");
    }
  });

  // Advanced search filters
  const filterGenre = document.getElementById("filter-genre");
  const filterYear = document.getElementById("filter-year");
  const filterRating = document.getElementById("filter-rating");
  const filterLanguage = document.getElementById("filter-language");

  const filterElements = [filterGenre, filterYear, filterRating, filterLanguage];
  filterElements.forEach(el => {
    if (el) {
      el.addEventListener("change", () => {
        applySearchFilters();
      });
    }
  });

  // Escape key hides overlays
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      searchInput.value = "";
      document.getElementById("search-results-overlay").classList.remove("open");
      document.getElementById("search-suggestions-box").classList.remove("open");
      window.closeQuickPreview();
      document.getElementById("settings-modal").classList.remove("open");
    }
  });

  // Settings triggers
  document.getElementById("settings-trigger").addEventListener("click", () => {
    const modal = document.getElementById("settings-modal");
    document.getElementById("set-autoplay").checked = settings.playerAutoplay;
    document.getElementById("set-overlay").checked = settings.playerOverlay;
    document.getElementById("set-nextbtn").checked = settings.playerNextBtn;
    document.getElementById("set-selector").checked = settings.playerSelector;

    const colorOptions = document.querySelectorAll(".color-option");
    colorOptions.forEach(opt => {
      if (opt.dataset.color === settings.accentColor) {
        colorOptions.forEach(o => o.classList.remove("active"));
        opt.classList.add("active");
      }
    });
    modal.classList.add("open");
  });

  document.getElementById("close-settings-x").addEventListener("click", () => {
    document.getElementById("settings-modal").classList.remove("open");
  });
  document.getElementById("btn-settings-cancel").addEventListener("click", () => {
    document.getElementById("settings-modal").classList.remove("open");
  });
  
  document.getElementById("btn-settings-save").addEventListener("click", () => {
    settings.playerAutoplay = document.getElementById("set-autoplay").checked;
    settings.playerOverlay = document.getElementById("set-overlay").checked;
    settings.playerNextBtn = document.getElementById("set-nextbtn").checked;
    settings.playerSelector = document.getElementById("set-selector").checked;

    localStorage.setItem("kingamu_player_autoplay", settings.playerAutoplay);
    localStorage.setItem("kingamu_player_overlay", settings.playerOverlay);
    localStorage.setItem("kingamu_player_next_btn", settings.playerNextBtn);
    localStorage.setItem("kingamu_player_selector", settings.playerSelector);

    document.getElementById("settings-modal").classList.remove("open");
    router();
  });

  const colorOptions = document.querySelectorAll(".color-option");
  colorOptions.forEach(opt => {
    opt.addEventListener("click", () => {
      colorOptions.forEach(o => o.classList.remove("active"));
      opt.classList.add("active");
      
      const newColor = opt.dataset.color;
      const colorName = opt.dataset.name;
      
      settings.accentColor = newColor;
      settings.accentColorName = colorName;
      localStorage.setItem("kingamu_accent_color", newColor);
      localStorage.setItem("kingamu_accent_color_name", colorName);
      
      applyAccentColor(newColor);
    });
  });

  // Track player progress updates
  window.addEventListener("message", (event) => {
    if (typeof event.data === "string") {
      try {
        const payload = JSON.parse(event.data);
        if (payload && payload.progress !== undefined && window.currentVideoDetails) {
          const watchDetails = window.currentVideoDetails;
          const progressPayload = {
            id: watchDetails.id,
            type: watchDetails.type,
            progress: parseFloat(payload.progress),
            timestamp: parseFloat(payload.timestamp),
            duration: parseFloat(payload.duration),
            season: watchDetails.season,
            episode: watchDetails.episode,
            title: watchDetails.title,
            poster: watchDetails.poster
          };
          saveProgress(progressPayload);
        }
      } catch (err) {
        // Silent catch
      }
    }
  });
});
