// Distinct Dual-Template Modern Blog Generator for Seogram
const fs = require('fs');
const path = require('path');

class SiteGenerator {
  // Format Persian Date
  formatPersianDate(dateString) {
    try {
      const d = dateString ? new Date(dateString) : new Date();
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(d);
    } catch {
      return 'اخیراً';
    }
  }

  // Resolve image URL to correct relative path based on page level
  resolveImageUrl(imgUrl, isPostPage = false) {
    if (!imgUrl) {
      return isPostPage ? '../assets/images/fallback.webp' : 'assets/images/fallback.webp';
    }
    if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
      return imgUrl;
    }
    // Remove leading slashes
    const cleanPath = imgUrl.replace(/^\/+/, '');
    return isPostPage ? `../${cleanPath}` : cleanPath;
  }

  // Useful Links Widget (Common Dofollow SEO backlinks)
  renderUsefulLinksWidget(usefulLinks = [], isDesign = false) {
    if (!usefulLinks || usefulLinks.length === 0) return '';
    const hoverColor = isDesign ? 'hover:text-purple-600 hover:bg-purple-50' : 'hover:text-sky-600 hover:bg-sky-50';
    const iconColor = isDesign ? 'text-purple-500' : 'text-sky-500';

    const linksHtml = usefulLinks.map(l => `
      <li>
        <a href="${l.url}" rel="${l.rel || 'follow'}" target="${l.target || '_blank'}" 
           class="flex items-center justify-between p-2.5 rounded-xl ${hoverColor} text-slate-700 transition font-medium text-xs group border-b border-slate-100 last:border-b-0">
          <span class="flex items-center gap-2">
            <svg class="w-3.5 h-3.5 ${iconColor} group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
            </svg>
            ${l.title}
          </span>
          <span class="text-[11px] opacity-0 group-hover:opacity-100 transition">←</span>
        </a>
      </li>
    `).join('');

    return `
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 mb-6">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <h3 class="text-sm font-black text-slate-800 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full ${isDesign ? 'bg-purple-600' : 'bg-sky-500'}"></span>
          لینک‌های برگزیده و همکاران
        </h3>
        <span class="text-[11px] font-bold px-2 py-0.5 rounded-full ${isDesign ? 'bg-purple-50 text-purple-700' : 'bg-sky-50 text-sky-700'}">Dofollow</span>
      </div>
      <ul class="space-y-1">
        ${linksHtml}
      </ul>
    </div>
    `;
  }

  // SEO-friendly Numeric Pagination Navigation
  renderPagination(currentPage, totalPages, isDesign = false) {
    if (totalPages <= 1) return '';

    const getUrl = (p) => (p === 1 ? 'index.html' : `page-${p}.html`);
    const activeClass = isDesign 
      ? 'bg-purple-900 text-white font-bold shadow' 
      : 'bg-sky-600 text-white font-bold shadow';
    const normalClass = isDesign
      ? 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200 shadow-sm'
      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-sm';

    let pages = [];
    const delta = 2;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    const prevButton = currentPage > 1
      ? `<a href="${getUrl(currentPage - 1)}" class="px-3 py-2 rounded-xl text-xs font-bold ${normalClass} transition">← قبلی</a>`
      : `<span class="px-3 py-2 rounded-xl text-xs text-slate-300 border border-slate-100 cursor-not-allowed">← قبلی</span>`;

    const nextButton = currentPage < totalPages
      ? `<a href="${getUrl(currentPage + 1)}" class="px-3 py-2 rounded-xl text-xs font-bold ${normalClass} transition">بعدی →</a>`
      : `<span class="px-3 py-2 rounded-xl text-xs text-slate-300 border border-slate-100 cursor-not-allowed">بعدی →</span>`;

    const pageNumbers = pages.map(p => {
      if (p === '...') {
        return `<span class="px-2 py-1 text-slate-400 text-xs">...</span>`;
      }
      const isCurrent = p === currentPage;
      return `<a href="${getUrl(p)}" class="w-8 sm:w-9 h-8 sm:h-9 flex items-center justify-center rounded-xl text-xs transition ${isCurrent ? activeClass : normalClass}">${p}</a>`;
    }).join('');

    return `
    <div class="mt-12 mb-8 pt-8 border-t ${isDesign ? 'border-stone-200' : 'border-slate-200'}">
      <nav class="flex flex-wrap items-center justify-center gap-1.5" aria-label="صفحه‌بندی مقالات">
        ${prevButton}
        <div class="flex items-center gap-1">${pageNumbers}</div>
        ${nextButton}
      </nav>
      <p class="text-center text-xs ${isDesign ? 'text-stone-500' : 'text-slate-500'} mt-3">صفحه ${currentPage} از ${totalPages} (۱۶ مطلب در هر صفحه)</p>
    </div>
    `;
  }

  // =========================================================================
  // TEMPLATE 1: TECH & AI BLOG (GitHub Pages) - High-Tech News Magazine
  // =========================================================================

  getTechHead(title, description, canonicalUrl, ogImage, keywords = [], prevUrl = null, nextUrl = null, schemaJson = null) {
    const fullOgImage = ogImage 
      ? (ogImage.startsWith('http') ? ogImage : `https://pouriazizo-cmyk.github.io/tech-ai-pulse/${ogImage.replace(/^\/+/, '')}`)
      : 'https://pouriazizo-cmyk.github.io/tech-ai-pulse/assets/images/fallback.webp';

    return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta name="keywords" content="${keywords.join(', ')}">
    <link rel="canonical" href="${canonicalUrl}">
    ${prevUrl ? `<link rel="prev" href="${prevUrl}">` : ''}
    ${nextUrl ? `<link rel="next" href="${nextUrl}">` : ''}
    <link rel="alternate" type="application/rss+xml" title="نبض فناوری و هوش مصنوعی" href="https://pouriazizo-cmyk.github.io/tech-ai-pulse/rss.xml">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${fullOgImage}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${fullOgImage}">
    ${schemaJson ? `<script type="application/ld+json">\n${schemaJson}\n    </script>` : ''}
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">

    <style>
      body { font-family: 'Vazirmatn', Tahoma, sans-serif; direction: rtl; background-color: #f1f5f9; color: #0f172a; }
      .article-body h2 { font-size: 1.5rem; font-weight: 800; margin-top: 2rem; margin-bottom: 1rem; color: #0f172a; border-right: 4px solid #0284c7; padding-right: 0.75rem; }
      .article-body h3 { font-size: 1.25rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #1e293b; }
      .article-body p { font-size: 1.05rem; line-height: 2.1; margin-bottom: 1.3rem; color: #334155; }
      .article-body ul { margin-right: 1.5rem; margin-bottom: 1.4rem; list-style-type: disc; }
      .article-body li { margin-bottom: 0.5rem; line-height: 2; }
      .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    </style>
    `;
  }

  renderTechHeader(blog, isPostPage = false) {
    const rootUrl = isPostPage ? '../index.html' : 'index.html';
    const currentDate = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'full' }).format(new Date());

    return `
    <div class="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="w-2 h-2 rounded-full bg-sky-400"></span>
          <span>${currentDate}</span>
          <span class="text-slate-600 hidden sm:inline">|</span>
          <span class="text-slate-400 hidden sm:inline">پایگاه تخصصی رویدادها و اخبار فناوری‌های نوین و مدل‌های زبانی</span>
        </div>
        <div class="flex items-center gap-4">
          <a href="${isPostPage ? '../sitemap.xml' : 'sitemap.xml'}" class="text-slate-400 hover:text-white transition">نقشه سایت</a>
        </div>
      </div>
    </div>

    <header class="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/95">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
        <a href="${rootUrl}" class="flex items-center gap-3 group">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-700 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <div>
            <h1 class="text-xl font-black text-slate-900 group-hover:text-sky-600 transition">${blog.title}</h1>
            <p class="text-xs text-slate-500">تحلیل تخصصی هوش مصنوعی و فناوری</p>
          </div>
        </a>

        <!-- Category Nav -->
        <nav class="hidden md:flex items-center gap-6 text-sm font-bold text-slate-700">
          <a href="${rootUrl}" class="text-sky-600 hover:text-sky-700 transition">صفحه اصلی</a>
          <a href="${rootUrl}#category-ai" onclick="filterCategory('ai')" class="hover:text-sky-600 transition">هوش مصنوعی</a>
          <a href="${rootUrl}#category-tech" onclick="filterCategory('tech')" class="hover:text-sky-600 transition">سخت‌افزار و وب</a>
          <a href="${rootUrl}#category-tutorials" onclick="filterCategory('tutorials')" class="hover:text-sky-600 transition">آموزش‌ها</a>
          <a href="#useful-links" class="hover:text-sky-600 transition">پیوندها</a>
        </nav>
      </div>
    </header>
    `;
  }

  // Generate Tech Index HTML (with Pagination support)
  generateTechIndex(blog, articles = [], usefulLinks = [], currentPage = 1, totalPages = 1) {
    const isFirstPage = currentPage === 1;
    const pageUrl = isFirstPage ? `${blog.target_url}/index.html` : `${blog.target_url}/page-${currentPage}.html`;
    const prevUrl = currentPage > 1 ? (currentPage === 2 ? `${blog.target_url}/index.html` : `${blog.target_url}/page-${currentPage - 1}.html`) : null;
    const nextUrl = currentPage < totalPages ? `${blog.target_url}/page-${currentPage + 1}.html` : null;

    let featured = null;
    let secondary = [];
    let feed = [];

    if (isFirstPage) {
      featured = articles[0] || null;
      secondary = articles.slice(1, 3);
      feed = articles.slice(3, 16);
    } else {
      feed = articles.slice(0, 16);
    }

    const pageTitle = isFirstPage 
      ? `${blog.title} | آخرین رویدادهای هوش مصنوعی و فناوری`
      : `صفحه ${currentPage} | ${blog.title}`;

    const siteSchema = isFirstPage ? JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": blog.title,
      "url": `${blog.target_url}/index.html`,
      "description": blog.description || "پایگاه تخصصی رویدادها و اخبار فناوری‌های نوین و مدل‌های زبانی",
      "inLanguage": "fa"
    }, null, 2) : null;

    return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  ${this.getTechHead(pageTitle, blog.description, pageUrl, featured?.featured_image_url || feed[0]?.featured_image_url, ['هوش مصنوعی', 'فناوری', 'آموزش', 'الگوریتم'], prevUrl, nextUrl, siteSchema)}
</head>
<body class="bg-slate-100 text-slate-900 antialiased">
  ${this.renderTechHeader(blog, false)}

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    ${isFirstPage && featured ? `
    <!-- Hero / Lead Section -->
    <section class="mb-10">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Lead Story (66%) -->
        <div class="lg:col-span-2 bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200/80 hover:shadow-md transition group">
          <a href="posts/${featured.slug}.html" class="block relative aspect-video overflow-hidden bg-slate-900">
            <img src="${this.resolveImageUrl(featured.featured_image_url, false)}" 
                 alt="${featured.featured_image_alt || featured.title}" 
                 class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent"></div>
            <div class="absolute bottom-0 right-0 left-0 p-6 sm:p-8 text-white">
              <span class="inline-block px-3 py-1 bg-sky-600 text-xs font-bold rounded-full mb-3 shadow">خبر ویژه</span>
              <h2 class="text-xl sm:text-2xl md:text-3xl font-black leading-snug mb-3 group-hover:text-sky-300 transition">${featured.title}</h2>
              <div class="flex items-center gap-4 text-xs text-slate-300">
                <span class="font-bold">${featured.author_name}</span>
                <span>•</span>
                <span>${this.formatPersianDate(featured.published_at || featured.created_at)}</span>
                <span>•</span>
                <span>${featured.reading_time_minutes || 4} دقیقه مطالعه</span>
              </div>
            </div>
          </a>
        </div>

        <!-- Secondary Stories (33%) -->
        <div class="flex flex-col gap-6">
          ${secondary.map(item => `
            <article class="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition flex flex-col justify-between group flex-1">
              <div>
                <div class="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span class="font-bold text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full">تحلیل روز</span>
                  <span>${this.formatPersianDate(item.published_at || item.created_at)}</span>
                </div>
                <h3 class="text-base font-bold text-slate-900 group-hover:text-sky-600 transition leading-snug mb-2">
                  <a href="posts/${item.slug}.html">${item.title}</a>
                </h3>
                <p class="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">${item.summary || item.meta_description || ''}</p>
              </div>
              <div class="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                <span>نویسنده: ${item.author_name}</span>
                <a href="posts/${item.slug}.html" class="text-sky-600 font-bold hover:underline">مطالعه مطلب ←</a>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    </section>
    ` : ''}

    <!-- 2-Column Main Feed + Sidebar Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Main Content Feed (70%) -->
      <section class="lg:col-span-2">
        <div class="flex flex-wrap items-center justify-between border-b border-slate-200 pb-4 mb-6 gap-2">
          <h2 class="text-lg font-black text-slate-900 flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-sky-600"></span>
            ${isFirstPage ? 'جدیدترین مقالات و گزارش‌ها' : `آرشیو مقالات و گزارش‌ها (صفحه ${currentPage})`}
          </h2>
          <!-- Filter Buttons -->
          <div class="flex gap-2 text-xs font-bold">
            <button onclick="filterPosts('all')" class="px-3 py-1 bg-sky-600 text-white rounded-full">همه</button>
            <button onclick="filterPosts('ai')" class="px-3 py-1 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-700">هوش مصنوعی</button>
            <button onclick="filterPosts('tutorials')" class="px-3 py-1 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-700">آموزش</button>
          </div>
        </div>

        <div id="articles-grid" class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          ${feed.map(item => `
            <article class="article-card bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200/80 hover:shadow-md transition flex flex-col justify-between group">
              <div>
                <a href="posts/${item.slug}.html" class="block aspect-[16/9] overflow-hidden bg-slate-100 relative">
                  <img src="${this.resolveImageUrl(item.featured_image_url, false)}" 
                       alt="${item.featured_image_alt || item.title}" 
                       loading="lazy"
                       class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                  <span class="absolute top-3 right-3 bg-white/90 backdrop-blur text-xs font-bold px-2 py-0.5 rounded-full text-slate-700 shadow-sm">${item.reading_time_minutes || 4} دقیقه</span>
                </a>
                <div class="p-6">
                  <div class="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <span class="font-bold text-sky-600">${item.author_name}</span>
                    <span>•</span>
                    <span>${this.formatPersianDate(item.published_at || item.created_at)}</span>
                  </div>
                  <h3 class="text-base font-bold text-slate-900 group-hover:text-sky-600 transition leading-snug mb-2">
                    <a href="posts/${item.slug}.html">${item.title}</a>
                  </h3>
                  <p class="text-xs text-slate-600 line-clamp-3 leading-relaxed">${item.summary || item.meta_description || ''}</p>
                </div>
              </div>
              <div class="px-6 pb-6 pt-0 flex items-center justify-between text-xs font-medium text-slate-500">
                <div class="flex flex-wrap gap-1">
                  ${(item.tags || []).slice(0, 2).map(t => `<span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[11px]"># ${t}</span>`).join('')}
                </div>
                <a href="posts/${item.slug}.html" class="text-sky-600 font-bold hover:underline">ادامه مطلب ←</a>
              </div>
            </article>
          `).join('')}
        </div>

        ${this.renderPagination(currentPage, totalPages, false)}
      </section>

      <!-- Sidebar (30%) -->
      <aside class="lg:col-span-1">
        <div id="useful-links">
          ${this.renderUsefulLinksWidget(usefulLinks, false)}
        </div>

        <!-- Search Widget -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 mb-6">
          <h3 class="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            جستجو در مقالات
          </h3>
          <input type="text" placeholder="عنوان یا کلمه کلیدی..." onkeyup="searchPosts(this.value)" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500">
        </div>

        <!-- Popular Posts Widget -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
          <h3 class="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-3">پربازدیدترین‌های هفته</h3>
          <div class="space-y-3">
            ${articles.slice(0, 4).map((a, idx) => `
              <a href="posts/${a.slug}.html" class="flex items-start gap-3 group">
                <span class="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-black text-xs group-hover:bg-sky-600 group-hover:text-white transition shrink-0">${idx + 1}</span>
                <p class="text-xs font-bold text-slate-700 group-hover:text-sky-600 transition leading-snug line-clamp-2">${a.title}</p>
              </a>
            `).join('')}
          </div>
        </div>
      </aside>
    </div>
  </main>

  <footer class="bg-slate-900 text-slate-400 py-10 mt-16 border-t border-slate-800 text-xs text-center">
    <div class="max-w-7xl mx-auto px-4">
      <p>© ${new Date().getFullYear()} ${blog.title} | تمامی حقوق محفوظ است.</p>
    </div>
  </footer>

  <script>
    function searchPosts(query) {
      const q = query.toLowerCase().trim();
      document.querySelectorAll('.article-card').forEach(card => {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(q) ? 'flex' : 'none';
      });
    }
    function filterPosts(cat) {
      // simple filter for demo
      document.querySelectorAll('.article-card').forEach(card => card.style.display = 'flex');
    }
  </script>
</body>
</html>`;
  }

  // Generate Tech Single Article HTML (WITH 2-COLUMN LAYOUT + SIDEBAR!)
  generateTechArticle(blog, article, usefulLinks = [], relatedArticles = []) {
    const canonicalUrl = `${blog.target_url}/posts/${article.slug}.html`;
    const publishDateIso = article.published_at ? new Date(article.published_at).toISOString() : new Date().toISOString();
    const fullImageUrl = article.featured_image_url 
      ? (article.featured_image_url.startsWith('http') ? article.featured_image_url : `${blog.target_url}/${article.featured_image_url.replace(/^\/+/, '')}`)
      : `${blog.target_url}/assets/images/fallback.webp`;

    const schemaObj = [
      {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        "headline": article.title,
        "description": article.meta_description || article.summary || '',
        "image": [fullImageUrl],
        "datePublished": publishDateIso,
        "dateModified": publishDateIso,
        "author": {
          "@type": "Person",
          "name": article.author_name || "تحریریه تکنولوژی"
        },
        "publisher": {
          "@type": "Organization",
          "name": blog.title,
          "url": blog.target_url
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": canonicalUrl
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "صفحه اصلی",
            "item": `${blog.target_url}/index.html`
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "مقالات تکنولوژی",
            "item": `${blog.target_url}/index.html#articles`
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": article.title,
            "item": canonicalUrl
          }
        ]
      }
    ];

    const schemaJson = JSON.stringify(schemaObj, null, 2);

    return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  ${this.getTechHead(article.title + ' | ' + blog.title, article.meta_description, canonicalUrl, fullImageUrl, article.keywords || [], null, null, schemaJson)}
</head>
<body class="bg-slate-100 text-slate-900 antialiased">
  ${this.renderTechHeader(blog, true)}

  <!-- Breadcrumb -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 text-xs text-slate-500 flex items-center gap-2">
    <a href="../index.html" class="hover:text-sky-600 transition">صفحه اصلی</a>
    <span>›</span>
    <span class="text-slate-400">مقالات تکنولوژی</span>
    <span>›</span>
    <span class="text-slate-700 font-semibold truncate max-w-sm">${article.title}</span>
  </div>

  <!-- Main 2-Column Container -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Article Main Column (68%) -->
      <div class="lg:col-span-2">
        <article class="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200/80">
          <h1 class="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-snug mb-6">
            ${article.title}
          </h1>

          <div class="flex flex-wrap items-center justify-between gap-4 py-4 mb-8 border-y border-slate-100 text-xs text-slate-500">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-600 to-blue-700 text-white flex items-center justify-center font-bold text-sm shadow">
                ${(article.author_name || 'س').substring(0, 1)}
              </div>
              <div>
                <p class="font-bold text-slate-900 text-sm">${article.author_name}</p>
                <p class="text-[11px] text-slate-400">منتشر شده در ${this.formatPersianDate(article.published_at || article.created_at)}</p>
              </div>
            </div>
            <span class="bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-bold">زمان مطالعه: ${article.reading_time_minutes || 4} دقیقه</span>
          </div>

          <!-- Featured Image -->
          ${article.featured_image_url ? `
          <div class="mb-8 rounded-2xl overflow-hidden shadow-sm bg-slate-900">
            <img src="${this.resolveImageUrl(article.featured_image_url, true)}" 
                 alt="${article.featured_image_alt || article.title}" 
                 class="w-full h-auto object-cover max-h-[500px]">
          </div>
          ` : ''}

          <!-- Body -->
          <div class="article-body text-slate-800">
            ${article.content_html}
          </div>

          <!-- Tags -->
          <div class="mt-10 pt-6 border-t border-slate-100">
            <h4 class="text-xs font-bold text-slate-400 mb-3">برچسب‌های این مطلب:</h4>
            <div class="flex flex-wrap gap-2">
              ${(article.tags || article.keywords || []).map(t => `
                <span class="bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 text-xs px-3 py-1.5 rounded-lg transition"># ${t}</span>
              `).join('')}
            </div>
          </div>
        </article>

        <!-- Related Articles Section (Point 12) -->
        ${relatedArticles && relatedArticles.length > 0 ? `
        <div class="mt-8 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
          <h3 class="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
            مطالب پیشنهادی و مرتبط
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            ${relatedArticles.slice(0, 3).map(rel => `
              <a href="${rel.slug}.html" class="group block">
                <div class="aspect-video rounded-xl overflow-hidden bg-slate-100 mb-2">
                  <img src="${this.resolveImageUrl(rel.featured_image_url, true)}" class="w-full h-full object-cover group-hover:scale-105 transition">
                </div>
                <h4 class="text-xs font-bold text-slate-800 group-hover:text-sky-600 transition line-clamp-2 leading-snug">${rel.title}</h4>
              </a>
            `).join('')}
          </div>
        </div>
        ` : ''}
      </div>

      <!-- Article Sidebar (32%) - Containing Useful Links Widget! -->
      <aside class="lg:col-span-1">
        ${this.renderUsefulLinksWidget(usefulLinks, false)}

        <!-- Quick Share Box -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 mb-6">
          <h3 class="text-xs font-bold text-slate-800 mb-3">اشتراک‌گذاری این مقاله</h3>
          <button onclick="navigator.clipboard.writeText(window.location.href); alert('لینک کپی شد');" class="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition">
            📋 کپی لینک کوتاه مقاله
          </button>
        </div>
      </aside>

    </div>
  </main>

  <footer class="bg-slate-900 text-slate-400 py-10 mt-16 border-t border-slate-800 text-xs text-center">
    <div class="max-w-7xl mx-auto px-4">
      <p>© ${new Date().getFullYear()} ${blog.title} | تمامی حقوق محفوظ است.</p>
    </div>
  </footer>
</body>
</html>`;
  }

  // =========================================================================
  // TEMPLATE 2: DESIGN & TYPOGRAPHY JOURNAL (GitLab Pages) - Elegant Minimalist
  // =========================================================================

  getDesignHead(title, description, canonicalUrl, ogImage, keywords = [], prevUrl = null, nextUrl = null, schemaJson = null) {
    const fullOgImage = ogImage 
      ? (ogImage.startsWith('http') ? ogImage : `https://design-font-lab-011e29.gitlab.io/${ogImage.replace(/^\/+/, '')}`)
      : 'https://design-font-lab-011e29.gitlab.io/assets/images/fallback.webp';

    return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta name="keywords" content="${keywords.join(', ')}">
    <link rel="canonical" href="${canonicalUrl}">
    ${prevUrl ? `<link rel="prev" href="${prevUrl}">` : ''}
    ${nextUrl ? `<link rel="next" href="${nextUrl}">` : ''}
    <link rel="alternate" type="application/rss+xml" title="استودیو دیزاین و تایپوگرافی" href="https://design-font-lab-011e29.gitlab.io/rss.xml">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${fullOgImage}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${fullOgImage}">
    ${schemaJson ? `<script type="application/ld+json">\n${schemaJson}\n    </script>` : ''}
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;700;900&display=swap" rel="stylesheet">

    <style>
      body { font-family: 'Vazirmatn', serif, sans-serif; direction: rtl; background-color: #fafaf9; color: #18181b; }
      .article-body h2 { font-size: 1.6rem; font-weight: 900; margin-top: 2.2rem; margin-bottom: 1.1rem; color: #18181b; border-bottom: 2px solid #e4e4e7; padding-bottom: 0.5rem; }
      .article-body h3 { font-size: 1.3rem; font-weight: 700; margin-top: 1.6rem; margin-bottom: 0.8rem; color: #27272a; }
      .article-body p { font-size: 1.1rem; line-height: 2.2; margin-bottom: 1.5rem; color: #3f3f46; letter-spacing: -0.01em; }
      .article-body ul { margin-right: 1.5rem; margin-bottom: 1.5rem; list-style-type: square; }
      .article-body li { margin-bottom: 0.5rem; line-height: 2.1; }
      .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    </style>
    `;
  }

  renderDesignHeader(blog, isPostPage = false) {
    const rootUrl = isPostPage ? '../index.html' : 'index.html';

    return `
    <header class="bg-stone-50 border-b border-stone-200/80 sticky top-0 z-40 backdrop-blur-md bg-stone-50/95">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="text-center md:text-right">
          <a href="${rootUrl}" class="group">
            <span class="text-xs uppercase tracking-widest text-purple-700 font-mono font-bold block mb-1">STUDIO & TYPOGRAPHY JOURNAL</span>
            <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 group-hover:text-purple-700 transition">${blog.title}</h1>
          </a>
        </div>

        <nav class="flex items-center gap-6 text-sm font-semibold text-stone-600">
          <a href="${rootUrl}" class="text-purple-700 hover:text-purple-900 transition">رویدادها</a>
          <a href="${rootUrl}#type" class="hover:text-purple-700 transition">تایپوگرافی</a>
          <a href="${rootUrl}#visual" class="hover:text-purple-700 transition">هنر دیداری</a>
          <a href="#useful-links" class="hover:text-purple-700 transition">پیوندها</a>
        </nav>
      </div>
    </header>
    `;
  }

  // Generate Design Index HTML (GitLab) with Pagination
  generateDesignIndex(blog, articles = [], usefulLinks = [], currentPage = 1, totalPages = 1) {
    const isFirstPage = currentPage === 1;
    const pageUrl = isFirstPage ? `${blog.target_url}/index.html` : `${blog.target_url}/page-${currentPage}.html`;
    const prevUrl = currentPage > 1 ? (currentPage === 2 ? `${blog.target_url}/index.html` : `${blog.target_url}/page-${currentPage - 1}.html`) : null;
    const nextUrl = currentPage < totalPages ? `${blog.target_url}/page-${currentPage + 1}.html` : null;

    let featured = null;
    let feed = [];

    if (isFirstPage) {
      featured = articles[0] || null;
      feed = articles.slice(1, 16);
    } else {
      feed = articles.slice(0, 16);
    }

    const pageTitle = isFirstPage
      ? `${blog.title} | ژورنال دیزاین و تایپوگرافی`
      : `صفحه ${currentPage} | ${blog.title}`;

    const siteSchema = isFirstPage ? JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": blog.title,
      "url": `${blog.target_url}/index.html`,
      "description": blog.description || "ژورنال تخصصی دیزاین، تایپوگرافی، فونت و تصویرسازی هوش مصنوعی",
      "inLanguage": "fa"
    }, null, 2) : null;

    return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  ${this.getDesignHead(pageTitle, blog.description, pageUrl, featured?.featured_image_url || feed[0]?.featured_image_url, ['طراحی گرافیک', 'فونت فارسی', 'تایپوگرافی', 'هنر دیجیتال'], prevUrl, nextUrl, siteSchema)}
</head>
<body class="bg-stone-50 text-stone-900 antialiased">
  ${this.renderDesignHeader(blog, false)}

  <main class="max-w-6xl mx-auto px-4 sm:px-6 py-10">
    ${isFirstPage && featured ? `
    <!-- Large Editorial Showcase Card -->
    <div class="mb-14 pb-12 border-b border-stone-200">
      <a href="posts/${featured.slug}.html" class="block group">
        <div class="aspect-[21/9] rounded-3xl overflow-hidden bg-stone-900 mb-6 shadow-md">
          <img src="${this.resolveImageUrl(featured.featured_image_url, false)}" 
               alt="${featured.featured_image_alt || featured.title}" 
               class="w-full h-full object-cover group-hover:scale-102 transition duration-700">
        </div>
        <div class="max-w-3xl">
          <div class="flex items-center gap-3 text-xs text-purple-700 font-bold mb-2">
            <span>سرمقاله استودیو</span>
            <span>•</span>
            <span class="text-stone-400 font-normal">${this.formatPersianDate(featured.published_at || featured.created_at)}</span>
          </div>
          <h2 class="text-2xl sm:text-4xl font-black text-stone-950 group-hover:text-purple-800 transition leading-tight mb-4">${featured.title}</h2>
          <p class="text-sm text-stone-600 leading-relaxed line-clamp-3">${featured.summary || featured.meta_description || ''}</p>
        </div>
      </a>
    </div>
    ` : ''}

    <!-- 2-Column: Feed + Sidebar -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
      <!-- 2-Column Masonry Articles Feed -->
      <div class="lg:col-span-2">
        <h3 class="text-base font-black text-stone-900 uppercase tracking-wider mb-6 pb-2 border-b border-stone-300">
          ${isFirstPage ? 'آرشیو گزیده مقالات و دیزاین' : `مجموعه مقالات و جستارها (صفحه ${currentPage})`}
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
          ${feed.map(item => `
            <article class="group flex flex-col justify-between">
              <div>
                <a href="posts/${item.slug}.html" class="block aspect-[4/3] rounded-2xl overflow-hidden bg-stone-200 mb-3">
                  <img src="${this.resolveImageUrl(item.featured_image_url, false)}" 
                       alt="${item.featured_image_alt || item.title}" 
                       loading="lazy"
                       class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                </a>
                <div class="text-xs text-stone-400 mb-1">
                  <span>${item.author_name}</span> • <span>${this.formatPersianDate(item.published_at || item.created_at)}</span>
                </div>
                <h4 class="text-base font-bold text-stone-900 group-hover:text-purple-700 transition leading-snug mb-2">
                  <a href="posts/${item.slug}.html">${item.title}</a>
                </h4>
                <p class="text-xs text-stone-500 line-clamp-2 leading-relaxed">${item.summary || item.meta_description || ''}</p>
              </div>
              <div class="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                <span class="text-purple-700 font-bold group-hover:underline">مطالعه یادداشت ←</span>
              </div>
            </article>
          `).join('')}
        </div>

        ${this.renderPagination(currentPage, totalPages, true)}
      </div>

      <!-- Sidebar -->
      <aside class="lg:col-span-1">
        <div id="useful-links">
          ${this.renderUsefulLinksWidget(usefulLinks, true)}
        </div>

        <div class="bg-white rounded-2xl p-6 shadow-sm border border-stone-200/80 text-xs text-stone-600 leading-relaxed">
          <h4 class="font-black text-stone-900 text-sm mb-2">درباره این ژورنال</h4>
          <p>
            تایپوگرافی، مبانی چیدمان مدرن و کاربرد مدل‌های تصویری مولد در فرایند طراحی بصری معاصر، محورهای اساسی این رسانه هستند.
          </p>
        </div>
      </aside>
    </div>
  </main>

  <footer class="border-t border-stone-200 py-10 mt-16 text-center text-xs text-stone-500">
    <div class="max-w-6xl mx-auto px-4">
      <p>© ${new Date().getFullYear()} ${blog.title} | ژورنال مستقل هنر و دیزاین</p>
    </div>
  </footer>
</body>
</html>`;
  }

  // Generate Design Single Article HTML (GitLab - 2-Column + Sidebar!)
  generateDesignArticle(blog, article, usefulLinks = [], relatedArticles = []) {
    const canonicalUrl = `${blog.target_url}/posts/${article.slug}.html`;
    const publishDateIso = article.published_at ? new Date(article.published_at).toISOString() : new Date().toISOString();
    const fullImageUrl = article.featured_image_url 
      ? (article.featured_image_url.startsWith('http') ? article.featured_image_url : `${blog.target_url}/${article.featured_image_url.replace(/^\/+/, '')}`)
      : `${blog.target_url}/assets/images/fallback.webp`;

    const schemaObj = [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": article.title,
        "description": article.meta_description || article.summary || '',
        "image": [fullImageUrl],
        "datePublished": publishDateIso,
        "dateModified": publishDateIso,
        "author": {
          "@type": "Person",
          "name": article.author_name || "تحریریه دیزاین"
        },
        "publisher": {
          "@type": "Organization",
          "name": blog.title,
          "url": blog.target_url
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": canonicalUrl
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "صفحه اصلی",
            "item": `${blog.target_url}/index.html`
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "ژورنال دیزاین",
            "item": `${blog.target_url}/index.html#journal`
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": article.title,
            "item": canonicalUrl
          }
        ]
      }
    ];

    const schemaJson = JSON.stringify(schemaObj, null, 2);

    return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  ${this.getDesignHead(article.title + ' | ' + blog.title, article.meta_description, canonicalUrl, fullImageUrl, article.keywords || [], null, null, schemaJson)}
</head>
<body class="bg-stone-50 text-stone-900 antialiased">
  ${this.renderDesignHeader(blog, true)}

  <!-- Breadcrumb with correct root link -->
  <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-6 text-xs text-stone-500 flex items-center gap-2">
    <a href="../index.html" class="hover:text-purple-700 transition">ژورنال</a>
    <span>/</span>
    <span class="text-stone-400">نوشته‌ها</span>
    <span>/</span>
    <span class="text-stone-800 font-bold truncate max-w-sm">${article.title}</span>
  </div>

  <main class="max-w-6xl mx-auto px-4 sm:px-6 py-10">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
      
      <!-- Article Column (68%) -->
      <div class="lg:col-span-2">
        <article class="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-stone-200/80">
          <header class="mb-8">
            <h1 class="text-2xl sm:text-3xl md:text-4xl font-black text-stone-950 leading-tight mb-4">${article.title}</h1>
            <div class="flex items-center gap-3 text-xs text-stone-500 pb-4 border-b border-stone-100">
              <span class="font-bold text-purple-800">${article.author_name}</span>
              <span>•</span>
              <span>${this.formatPersianDate(article.published_at || article.created_at)}</span>
              <span>•</span>
              <span>${article.reading_time_minutes || 5} دقیقه مطالعه</span>
            </div>
          </header>

          ${article.featured_image_url ? `
          <div class="mb-8 rounded-2xl overflow-hidden shadow-sm bg-stone-900">
            <img src="${this.resolveImageUrl(article.featured_image_url, true)}" 
                 alt="${article.featured_image_alt || article.title}" 
                 class="w-full h-auto object-cover max-h-[500px]">
          </div>
          ` : ''}

          <div class="article-body text-stone-800">
            ${article.content_html}
          </div>

          <!-- Tags -->
          <div class="mt-10 pt-6 border-t border-stone-100">
            <div class="flex flex-wrap gap-2">
              ${(article.tags || []).map(t => `
                <span class="bg-stone-100 text-stone-700 text-xs px-3 py-1.5 rounded-lg"># ${t}</span>
              `).join('')}
            </div>
          </div>
        </article>

        <!-- Related Articles Section (Point 12) -->
        ${relatedArticles && relatedArticles.length > 0 ? `
        <div class="mt-8 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200/80">
          <h3 class="text-base font-black text-stone-900 border-b border-stone-100 pb-3 mb-4">
            مطالب پیشنهادی مرتبط
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            ${relatedArticles.slice(0, 3).map(rel => `
              <a href="${rel.slug}.html" class="group block">
                <div class="aspect-video rounded-xl overflow-hidden bg-stone-100 mb-2">
                  <img src="${this.resolveImageUrl(rel.featured_image_url, true)}" class="w-full h-full object-cover group-hover:scale-105 transition">
                </div>
                <h4 class="text-xs font-bold text-stone-800 group-hover:text-purple-700 transition line-clamp-2 leading-snug">${rel.title}</h4>
              </a>
            `).join('')}
          </div>
        </div>
        ` : ''}
      </div>

      <!-- Sidebar Column (32%) - Containing Useful Links Widget! -->
      <aside class="lg:col-span-1">
        ${this.renderUsefulLinksWidget(usefulLinks, true)}
      </aside>

    </div>
  </main>

  <footer class="border-t border-stone-200 py-10 mt-16 text-center text-xs text-stone-500">
    <div class="max-w-6xl mx-auto px-4">
      <p>© ${new Date().getFullYear()} ${blog.title} | ژورنال مستقل هنر و دیزاین</p>
    </div>
  </footer>
</body>
</html>`;
  }

  // Generate XML sitemap (including all pagination pages & posts)
  generateSitemapXml(blog, articles = [], totalPages = 1) {
    const today = new Date().toISOString().split('T')[0];
    const pageUrls = [];
    for (let p = 2; p <= totalPages; p++) {
      pageUrls.push({
        loc: `${blog.target_url}/page-${p}.html`,
        lastmod: today,
        priority: '0.7'
      });
    }

    const urls = [
      { loc: `${blog.target_url}/index.html`, lastmod: today, priority: '1.0' },
      ...pageUrls,
      ...articles.map(a => ({
        loc: `${blog.target_url}/posts/${a.slug}.html`,
        lastmod: (a.published_at ? new Date(a.published_at) : new Date()).toISOString().split('T')[0],
        priority: '0.8'
      }))
    ];

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
  }

  generateRssFeed(blog, articles = []) {
    const pubDate = new Date().toUTCString();
    const items = articles.slice(0, 50).map(a => {
      const link = `${blog.target_url}/posts/${a.slug}.html`;
      const date = a.published_at ? new Date(a.published_at).toUTCString() : pubDate;
      const desc = (a.summary || a.meta_description || a.title || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      const title = (a.title || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${date}</pubDate>
      <description>${desc}</description>
      <author>${a.author_name || 'تحریریه'}</author>
    </item>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${blog.title}</title>
    <link>${blog.target_url}</link>
    <description>${blog.description || blog.title}</description>
    <language>fa</language>
    <lastBuildDate>${pubDate}</lastBuildDate>
    <atom:link href="${blog.target_url}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
  }

  generateRobotsTxt(blog) {
    return `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${blog.target_url}/sitemap.xml\n`;
  }
}

module.exports = new SiteGenerator();
