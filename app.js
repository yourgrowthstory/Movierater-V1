import { db } from './firebase-config.js';

const API_KEY = 'b34cf10a';

const ratingLabels = {
  1: 'Unwatchable', 2: 'Very poor', 3: 'Below average', 4: 'Fair',
  5: 'Average', 6: 'Decent', 7: 'Good', 8: 'Great',
  9: 'Excellent', 10: 'Masterpiece'
};

let selectedRating = 0;
let selectedMovie = null;

async function getReviews() {
  try {
    const snapshot = await db.collection('reviews').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting reviews:', error);
    return [];
  }
}

async function saveReviews(reviews) {
  try {
    const batch = db.batch();
    // First, delete all existing
    const existing = await db.collection('reviews').get();
    existing.docs.forEach(doc => batch.delete(doc.ref));
    // Then add new
    reviews.forEach(review => {
      const docRef = db.collection('reviews').doc(review.id.toString());
      batch.set(docRef, review);
    });
    await batch.commit();
  } catch (error) {
    console.error('Error saving reviews:', error);
  }
}

function buildStars() {
  const row = document.getElementById('starRow');
  for (let i = 1; i <= 10; i++) {
    const s = document.createElement('span');
    s.className = 'star';
    s.textContent = '★';
    s.dataset.val = i;
    s.addEventListener('click', () => selectRating(i));
    s.addEventListener('mouseenter', () => highlightStars(i));
    s.addEventListener('mouseleave', () => highlightStars(selectedRating));
    row.appendChild(s);
  }
}

function highlightStars(n) {
  document.querySelectorAll('.star').forEach(s => {
    s.classList.toggle('active', parseInt(s.dataset.val) <= n);
  });
}

function selectRating(n) {
  selectedRating = n;
  highlightStars(n);
  document.getElementById('ratingLabel').textContent = n + '/10 — ' + ratingLabels[n];
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function searchMovie() {
  const query = document.getElementById('movieSearch').value.trim();
  if (!query) { showToast('Please enter a movie name'); return; }

  try {
    const response = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&t=${encodeURIComponent(query)}`);
    const data = await response.json();
    if (data.Response === 'True') {
      selectedMovie = data;
      displayMovieDetails(selectedMovie);
      document.getElementById('ratingRow').style.display = 'block';
      document.getElementById('submitBtn').style.display = 'block';
    } else {
      showToast('No movie found');
    }
  } catch (error) {
    console.log('Search error:', error);
    showToast('Error searching movie: ' + error.message);
  }
}

function displayMovieDetails(movie) {
  const details = document.getElementById('movieDetails');
  const poster = movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : '';
  details.innerHTML = `
    <div style="display: flex; gap: 14px; align-items: flex-start;">
      ${poster ? `<img src="${poster}" alt="${movie.Title}" style="width: 100px; border-radius: 8px;" />` : ''}
      <div>
        <h3 style="margin: 0 0 8px 0; font-size: 18px;">${escHtml(movie.Title)}</h3>
        <p style="margin: 0; font-size: 14px; color: #666;">${escHtml(movie.Plot)}</p>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #888;">Release: ${movie.Year}</p>
      </div>
    </div>
  `;
  details.style.display = 'block';
}

document.getElementById('submitBtn').addEventListener('click', async () => {
  const name  = document.getElementById('userName').value.trim();
  if (!name)           { showToast('Please enter your name'); return; }
  if (!selectedMovie)  { showToast('Please search for a movie'); return; }
  if (!selectedRating) { showToast('Please pick a rating'); return; }

  const reviews = await getReviews();
  reviews.unshift({
    id: Date.now(), name, movie: selectedMovie, rating: selectedRating,
    ts: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  });
  await saveReviews(reviews);
  await renderReviews();

  document.getElementById('userName').value  = '';
  document.getElementById('movieSearch').value = '';
  selectedMovie = null;
  selectedRating = 0;
  highlightStars(0);
  document.getElementById('ratingLabel').textContent = 'Click to rate';
  document.getElementById('movieDetails').style.display = 'none';
  document.getElementById('ratingRow').style.display = 'none';
  document.getElementById('submitBtn').style.display = 'none';
  showToast('Review added!');
});

async function renderReviews() {
  const reviews = await getReviews();
  const list  = document.getElementById('reviewsList');
  const badge = document.getElementById('countBadge');
  badge.textContent = reviews.length + (reviews.length === 1 ? ' review' : ' reviews');

  if (!reviews.length) {
    list.innerHTML = '<div class="empty-state"><span class="icon">🎬</span>No reviews yet — be the first!</div>';
    return;
  }

  list.innerHTML = reviews.map(r => {
    const filled = '★'.repeat(Math.round(r.rating / 2));
    const empty  = '☆'.repeat(5 - Math.round(r.rating / 2));
    const title = r.movie ? r.movie.Title : r.title;
    const poster = r.movie && r.movie.Poster && r.movie.Poster !== 'N/A' ? `<img src="${r.movie.Poster}" alt="${title}" style="width: 60px; height: 90px; border-radius: 8px; flex-shrink: 0;" />` : '';
    return `
      <div class="review-card">
        ${poster}
        <div class="score-badge">
          <span class="score-num">${r.rating}</span>
          <span class="score-denom">/10</span>
        </div>
        <div class="review-body">
          <div class="review-title">${escHtml(title)}</div>
          <div class="review-meta">
            <span>${escHtml(r.name)}</span>
            <span class="sep">·</span>
            <span class="review-stars">${filled}${empty}</span>
            <span class="sep">·</span>
            <span>${r.ts}</span>
          </div>
        </div>
      </div>`;
  }).join('');
}

buildStars();
renderReviews();

document.getElementById('searchBtn').addEventListener('click', searchMovie);
document.getElementById('movieSearch').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') searchMovie();
});