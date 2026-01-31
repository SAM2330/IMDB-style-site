const TMDB_KEY = "4f232ac1c3f1cf94a52c682491f7fa6e";
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";


// Utility
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// Create movie card
function createMovieCard(item) {
  const card = document.createElement("div");
  card.className = "movie-card";

  const poster = item.poster_path
    ? `${IMG_BASE}${item.poster_path}`
    : "https://via.placeholder.com/300x450";

  const title = item.title || item.name;

  card.innerHTML = `
    <img src="${poster}">
    <h3>${title}</h3>
  `;

  card.onclick = () => {
    window.location.href = `movie.html?id=${item.id}&type=${item.title ? "movie" : "tv"}`;
  };

  return card;
}

async function loadTop10() {
  const top3Container = document.getElementById("top3");
  const restContainer = document.getElementById("top10rest");
  if (!top3Container || !restContainer) return;
  const res = await fetch(
    `${TMDB_BASE}/trending/all/week?api_key=${TMDB_KEY}`
  );
  const data = await res.json();

  const top10 = data.results.slice(0, 10);

  top10.forEach((item, index) => {
    if (index < 3) {
      const card = document.createElement("div");
      card.className = "top3-card";

      const poster = item.poster_path
        ? `${IMG_BASE}${item.poster_path}`
        : "https://via.placeholder.com/300x450";

      card.innerHTML = `
        <img src="${poster}">
        <div class="top3-info">
          <h3>#${index + 1} ${item.title || item.name}</h3>
          <p>${item.overview}</p>
        </div>
      `;

      card.onclick = () => {
        window.location.href = `movie.html?id=${item.id}&type=${item.title ? "movie" : "tv"}`;
      };

      top3Container.appendChild(card);
    } else {
      const card = createMovieCard(item);

      const rank = document.createElement("div");
      rank.className = "rank-badge";
      rank.textContent = index + 1;
      card.appendChild(rank);

      restContainer.appendChild(card);
    }
  });
}

loadTop10();

async function loadTopPicks(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const res = await fetch(
    `${TMDB_BASE}/discover/tv?api_key=${TMDB_KEY}&sort_by=popularity.desc`
  );
  const data = await res.json();

  data.results.slice(0, 30).forEach(item => {
    container.appendChild(createMovieCard(item));
  });
}

loadTopPicks("topPicks");

// Search
const searchForm = document.getElementById("searchForm");
if (searchForm) {
  searchForm.onsubmit = e => {
    e.preventDefault();
    const q = document.getElementById("searchInput").value;
    window.location.href = `search.html?q=${q}`;
  };
}

// Search results
async function loadSearchResults() {
  const query = getParam("q");
  const container = document.getElementById("searchResults");
  if (!query || !container) return;

  const res = await fetch(
    `${TMDB_BASE}/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}`
  );
  const data = await res.json();

  container.innerHTML = "";

  data.results.forEach(item => {
    if (item.media_type !== "person") {
      container.appendChild(createMovieCard(item));
    }
  });
}

loadSearchResults();


// loadMovieDetails();
async function loadMovieDetails() {
  const id = getParam("id");
  const type = getParam("type") || "movie";
  if (!id) return;

  const res = await fetch(
    `${TMDB_BASE}/${type}/${id}?api_key=${TMDB_KEY}&append_to_response=videos`
  );

  if (!res.ok) {
    console.error("Failed to load details");
    return;
  }

  const item = await res.json();

  document.getElementById("moviePoster").src = item.poster_path
    ? `${IMG_BASE}${item.poster_path}`
    : "https://via.placeholder.com/300x450";

  document.getElementById("movieTitle").textContent =
    item.title || item.name;

  document.getElementById("movieYear").textContent =
    item.release_date?.slice(0, 4) ||
    item.first_air_date?.slice(0, 4) ||
    "N/A";

  document.getElementById("movieRating").textContent =
    item.vote_average ?? "N/A";

  document.getElementById("movieGenre").textContent =
    item.genres?.map(g => g.name).join(", ") || "N/A";

  document.getElementById("movieActors").textContent =
    item.actors || "Actors not available";

  document.getElementById("moviePlot").textContent =
    item.overview || "No description available";

  const addBtn = document.getElementById("addWatchlistBtn");
  if (!addBtn) return;

  addBtn.onclick = () => addToWatchlist(item, type);

  addBtn.onclick = () => addToWatchlist(item, type);

  setupTrailer(item);
  setupPlayer(item, type);
}
loadMovieDetails();

// Watchlist
function addToWatchlist(movie, type = "movie") {
  let list = JSON.parse(localStorage.getItem("watchlist")) || [];

  // prevent duplicates
  if (list.some(item => item.id === movie.id)) return;

  list.push({
    ...movie,
    media_type: type
  });

  localStorage.setItem("watchlist", JSON.stringify(list));
  alert("Added to Watchlist!");
}
function loadWatchlist() {
  const container = document.getElementById("watchlistContainer");
  if (!container) return;

  container.innerHTML = "";

  const list = JSON.parse(localStorage.getItem("watchlist")) || [];

  list.forEach((movie, index) => {
    const card = document.createElement("div");
    card.className = "movie-card";

    const poster = movie.poster_path
      ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
      : "https://via.placeholder.com/300x450";

    const title = movie.title || movie.name;

    card.innerHTML = `
      <img src="${poster}">
      <h3>${title}</h3>
      <button class="remove-btn">Remove</button>
    `;

    // Open movie / TV page
    card.querySelector("img").onclick = () => {
      window.location.href = `movie.html?id=${movie.id}&type=${movie.media_type}`;
    };

    card.querySelector("h3").onclick = () => {
      window.location.href = `movie.html?id=${movie.id}&type=${movie.media_type}`;
    };

    // Remove button
    card.querySelector(".remove-btn").onclick = () => {
      removeFromWatchlist(index);
    };

    container.appendChild(card);
  });
}

loadWatchlist();
// const closeBtn = document.querySelector(".close");

// if (closeBtn) {
//   closeBtn.onclick = () => {
//     const modal = document.getElementById("trailerModal");
//     const iframe = document.getElementById("trailerIframe");

//     if (modal) modal.style.display = "none";
//     if (iframe) iframe.src = ""; // stop video
//   };
// }

// auto scroll
// ===== AUTO SCROLL CAROUSELS =====

function autoScroll(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const step = 300;

  setInterval(() => {
    if (
      container.scrollLeft + container.clientWidth >=
      container.scrollWidth - 10
    ) {
      container.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      container.scrollBy({ left: step, behavior: "smooth" });
    }
  }, 6000);
}



autoScroll("topPicks");
autoScroll("classics");

function removeFromWatchlist(index) {
  let list = JSON.parse(localStorage.getItem("watchlist")) || [];
  list.splice(index, 1);
  localStorage.setItem("watchlist", JSON.stringify(list));
  loadWatchlist(); // refresh UI
}
async function loadFanFavorites(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const res = await fetch(
    `${TMDB_BASE}/trending/all/week?api_key=${TMDB_KEY}`
  );
  const data = await res.json();

  data.results
    .filter(item => item.vote_count > 500) // real fan activity
    .slice(0, 20)
    .forEach(item => {
      container.appendChild(createMovieCard(item));
    });
}
loadFanFavorites("fanFavorites");
autoScroll("fanFavorites");
const MOVIE_GENRES = {
  Action: 28,
  Drama: 18,
  Comedy: 35,
  Thriller: 53,
  SciFi: 878,
  Horror: 27
};
const TV_GENRES = {
  Drama: 18,
  Crime: 80,
  SciFi: 10765,
  Mystery: 9648
};
async function loadMoviesByGenre(genreId, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const res = await fetch(
    `${TMDB_BASE}/discover/movie?api_key=${TMDB_KEY}&with_genres=${genreId}&sort_by=popularity.desc`
  );
  const data = await res.json();

  data.results.slice(0, 20).forEach(movie => {
    movie.media_type = "movie";
    container.appendChild(createMovieCard(movie));
  });
}
async function loadTVByGenre(genreId, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const res = await fetch(
    `${TMDB_BASE}/discover/tv?api_key=${TMDB_KEY}&with_genres=${genreId}&sort_by=popularity.desc`
  );
  const data = await res.json();

  data.results.slice(0, 20).forEach(show => {
    show.media_type = "tv";
    container.appendChild(createMovieCard(show));
  });
}
loadMoviesByGenre(28, "actionMovies");   // Action movies
loadMoviesByGenre(35, "comedyMovies");
loadMoviesByGenre(27, "horrorMovies");
loadMoviesByGenre(53, "thrillerMovies");
loadMoviesByGenre(878, "scifiMovies");
loadTVByGenre(18, "dramaTV");            // Drama TV
loadTVByGenre(80, "crimeTV");
loadTVByGenre(10765, "scifiTV");
loadTVByGenre(9648, "mysteryTV");

autoScroll("actionMovies");
autoScroll("dramaTV");

function setupTrailer(item) {
  if (!item.videos?.results) return;

  const trailer = item.videos.results.find(
    v => v.type === "Trailer" && v.site === "YouTube"
  );

  if (!trailer) return;

  const trailerBtn = document.getElementById("watchTrailerBtn");
  const trailerSection = document.getElementById("trailerSection");
  const iframe = document.getElementById("trailerIframe");

  if (!trailerBtn || !trailerSection || !iframe) return;

  trailerBtn.onclick = () => {
    // show trailer section
    trailerSection.style.display = "block";

    // load trailer
    iframe.src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;

    // smooth scroll to trailer
    trailerSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };
}

function setupPlayer(item, type) {
  const playBtn = document.getElementById("watchMovieBtn");
  const modal = document.getElementById("playerModal");
  const closeBtn = document.querySelector(".close-player");
  const iframe = document.getElementById("playerIframe");

  if (!playBtn || !modal || !closeBtn || !iframe) return;

  playBtn.onclick = () => {
    modal.style.display = "block";
    // Use vidsrc.xyz for embedding
    iframe.src = `https://vidsrc.xyz/embed/${type}/${item.id}`;
  };

  closeBtn.onclick = () => {
    modal.style.display = "none";
    iframe.src = ""; // Stop video
  };

  window.onclick = (event) => {
    if (event.target == modal) {
      modal.style.display = "none";
      iframe.src = "";
    }
  };
}


