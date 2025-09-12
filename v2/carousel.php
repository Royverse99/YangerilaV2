<?php
// Video data array
$videos = [
    [
        'id' => 'sBe411-F2GE',
        'title' => 'The best guitar solos in every genre',
        'description' => 'A compilation of top guitar solos across multiple genres'
    ],
    [
        'id' => 'Pl9H9X1GoAc',
        'title' => 'Possibly the most beautiful guitar solo',
        'description' => 'A beautifully performed guitar solo with emotional depth'
    ],
    [
        'id' => 'lT_mlbMjcxo',
        'title' => 'The Greatest Guitar Solo Ever Played',
        'description' => 'A legendary iconic guitar solo performance'
    ],
    [
        'id' => 'hafoCeXWxAE',
        'title' => 'Guitar Solos For Beginners',
        'description' => 'Step-by-step guide for beginners to learn guitar solos'
    ],
    [
        'id' => 'AyJcLLYyJ9k',
        'title' => 'Top 20 Greatest Electric Guitar Solos',
        'description' => 'A collection showcasing the best electric guitar solos ever'
    ],
    [
        'id' => 'hgEjTeWc8C0',
        'title' => 'ChatGPT Guitar Solo',
        'description' => 'A unique AI-generated guitar solo performance'
    ],
    [
        'id' => 'Anop2dCuR2g',
        'title' => '10 Iconic Guitar Solos',
        'description' => 'A must-know list of iconic guitar solos'
    ],
    [
        'id' => 'umUAWqoxt-0',
        'title' => 'Greatest Improvised Guitar Solo',
        'description' => 'An incredible improvised guitar solo performance'
    ]
];

// Function to check if thumbnail exists
function getThumbnailUrl($videoId) {
    $thumbnailUrls = [
        "https://img.youtube.com/vi/{$videoId}/maxresdefault.jpg",
        "https://img.youtube.com/vi/{$videoId}/hqdefault.jpg",
        "https://img.youtube.com/vi/{$videoId}/mqdefault.jpg",
        "https://img.youtube.com/vi/{$videoId}/default.jpg"
    ];
    
    foreach ($thumbnailUrls as $url) {
        $headers = @get_headers($url);
        if ($headers && strpos($headers[0], '200')) {
            return $url;
        }
    }
    
    return null; // No thumbnail found
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Guitar Solo YouTube Carousel - PHP</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        html, body { 
            width: 100%; 
            height: 100%; 
            overflow: hidden; 
            background: linear-gradient(135deg, #0f0f0f, #1a1a1a); 
            font-family: 'Arial', sans-serif;
        }
        
        .carousel { 
            position: relative; 
            width: 100vw; 
            height: 100vh; 
            display: flex; 
            overflow: hidden;
            transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        .slide { 
            min-width: 100%; 
            height: 100%; 
            flex-shrink: 0; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            background: #000; 
            position: relative;
            overflow: hidden;
        }
        
        .thumbnail-container {
            width: 100%;
            height: 100%;
            position: relative;
            cursor: pointer;
            background: linear-gradient(135deg, #333, #111);
            display: block;
        }
        
        .thumbnail-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }
        
        .thumbnail-fallback {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #444, #222);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            color: #7ae7c7;
            font-size: 48px;
            text-align: center;
        }
        
        .thumbnail-container:hover .thumbnail-image {
            transform: scale(1.05);
        }
        
        .play-button {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100px;
            height: 100px;
            background: linear-gradient(135deg, rgba(255, 0, 0, 0.9), rgba(255, 0, 0, 0.7));
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            backdrop-filter: blur(10px);
            border: 3px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            z-index: 5;
        }
        
        .play-button:hover {
            transform: translate(-50%, -50%) scale(1.1);
            background: linear-gradient(135deg, #ff0000, rgba(255, 0, 0, 0.8));
            box-shadow: 0 15px 40px rgba(255, 0, 0, 0.4);
        }
        
        .play-button::before {
            content: '';
            width: 0;
            height: 0;
            border-left: 25px solid white;
            border-top: 15px solid transparent;
            border-bottom: 15px solid transparent;
            margin-left: 5px;
        }
        
        .video-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
            padding: 60px 40px 40px;
            color: #7ae7c7;
            transform: translateY(20px);
            opacity: 0;
            transition: all 0.4s ease;
            z-index: 4;
        }
        
        .thumbnail-container:hover .video-overlay {
            transform: translateY(0);
            opacity: 1;
        }
        
        .video-title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #7ae7c7;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        }
        
        .video-description {
            font-size: 16px;
            color: #7ae7c7;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        }
        
        .youtube-player {
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.5s ease;
            z-index: 10;
        }
        
        .youtube-player.active {
            opacity: 1;
            pointer-events: all;
        }
        
        .youtube-player iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
        
        .loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 15;
        }
        
        .loading-overlay.show {
            display: flex;
        }
        
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top: 3px solid #ff0000;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .arrow {
            position: absolute; 
            top: 50%; 
            transform: translateY(-50%);
            width: 60px; 
            height: 60px; 
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));
            color: #333;
            font-size: 24px; 
            line-height: 60px; 
            text-align: center;
            border-radius: 50%; 
            cursor: pointer; 
            z-index: 25;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            user-select: none;
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        
        .arrow:hover { 
            background: linear-gradient(135deg, #fff, rgba(255, 255, 255, 0.9)); 
            transform: translateY(-50%) scale(1.1);
            box-shadow: 0 12px 40px rgba(255, 255, 255, 0.4);
        }
        
        .arrow:active {
            transform: translateY(-50%) scale(0.95);
        }
        
        #prev { left: 30px; }
        #next { right: 30px; }
        
        .dots { 
            position: absolute; 
            bottom: 30px; 
            width: 100%; 
            text-align: center; 
            z-index: 25; 
        }
        
        .dot {
            display: inline-block; 
            width: 14px; 
            height: 14px;
            margin: 0 8px; 
            background: rgba(255, 255, 255, 0.5);
            border-radius: 50%; 
            cursor: pointer; 
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            border: 2px solid rgba(255, 255, 255, 0.3);
            backdrop-filter: blur(5px);
        }
        
        .dot:hover {
            background: rgba(255, 255, 255, 0.8);
            transform: scale(1.2);
        }
        
        .dot.active { 
            background: #fff; 
            transform: scale(1.3);
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.6);
        }
        
        .back-button {
            position: absolute;
            top: 20px;
            left: 20px;
            width: 50px;
            height: 50px;
            background: rgba(0, 0, 0, 0.7);
            color: #7ae7c7;
            border-radius: 50%;
            display: none;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 30;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        }
        
        .back-button:hover {
            background: rgba(0, 0, 0, 0.9);
            transform: scale(1.1);
        }
        
        .back-button.show {
            display: flex;
        }
        
        @media (max-width: 768px) {
            .arrow {
                width: 50px;
                height: 50px;
                font-size: 20px;
                line-height: 50px;
            }
            
            #prev { left: 15px; }
            #next { right: 15px; }
            
            .dot {
                width: 12px;
                height: 12px;
                margin: 0 6px;
            }
            .play-button {
                width: 80px;
                height: 80px;
            }
            .play-button::before {
                border-left: 20px solid white;
                border-top: 12px solid transparent;
                border-bottom: 12px solid transparent;
            }
            .video-title {
                font-size: 22px;
            }
            .video-description {
                font-size: 14px;
            }
        }
    </style>
</head>
<body>
    <div class="carousel" id="carousel">
        <?php foreach ($videos as $index => $video): ?>
            <?php $thumbnailUrl = getThumbnailUrl($video['id']); ?>
            <div class="slide" data-video-id="<?php echo htmlspecialchars($video['id']); ?>">
                <div class="thumbnail-container">
                    <?php if ($thumbnailUrl): ?>
                        <img class="thumbnail-image" 
                             src="<?php echo htmlspecialchars($thumbnailUrl); ?>" 
                             alt="<?php echo htmlspecialchars($video['title']); ?>"
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <?php endif; ?>
                    
                    <div class="thumbnail-fallback" style="<?php echo $thumbnailUrl ? 'display: none;' : 'display: flex;'; ?>">
                        <div>🎸</div>
                        <div style="font-size: 16px; margin-top: 10px;">Guitar Video</div>
                    </div>
                    
                    <div class="play-button"></div>
                    
                    <div class="video-overlay">
                        <div class="video-title"><?php echo htmlspecialchars($video['title']); ?></div>
                        <div class="video-description"><?php echo htmlspecialchars($video['description']); ?></div>
                    </div>
                    
                    <div class="loading-overlay">
                        <div class="loading-spinner"></div>
                    </div>
                </div>
                <div class="youtube-player" id="player<?php echo $index; ?>"></div>
            </div>
        <?php endforeach; ?>
    </div>
    
    <div id="prev" class="arrow">❮</div>
    <div id="next" class="arrow">❯</div>
    <div class="dots" id="dots"></div>
    <div class="back-button" id="backButton">✕</div>

    <script>
        let players = {};
        let current = 0;
        let autoplayTimer = null;
        let isVideoPlaying = false;
        let apiLoaded = false;
        
        const carousel = document.getElementById('carousel');
        const slides = Array.from(document.querySelectorAll('.slide'));
        const prevBtn = document.getElementById('prev');
        const nextBtn = document.getElementById('next');
        const dotsContainer = document.getElementById('dots');
        const backButton = document.getElementById('backButton');

        // Create dots
        slides.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = 'dot' + (i === 0 ? ' active' : '');
            dot.dataset.index = i;
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        });
        const dots = Array.from(document.querySelectorAll('.dot'));

        // Load YouTube API
        function loadYouTubeAPI() {
            if (window.YT && window.YT.Player) {
                apiLoaded = true;
                return;
            }
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        window.onYouTubeIframeAPIReady = function() {
            apiLoaded = true;
            console.log('YouTube API loaded');
        };

        // Create YouTube player
        function createPlayer(slideIndex) {
            if (!apiLoaded || players[slideIndex]) return;
            
            const slide = slides[slideIndex];
            const videoId = slide.dataset.videoId;
            const playerId = `player${slideIndex}`;
            
            try {
                players[slideIndex] = new YT.Player(playerId, {
                    height: '100%',
                    width: '100%',
                    videoId: videoId,
                    playerVars: {
                        autoplay: 1,
                        controls: 1,
                        rel: 0,
                        modestbranding: 1,
                        fs: 1,
                        cc_load_policy: 0,
                        iv_load_policy: 3
                    },
                    events: {
                        onReady: (event) => onPlayerReady(event, slideIndex),
                        onStateChange: (event) => onPlayerStateChange(event, slideIndex),
                        onError: (event) => onPlayerError(event, slideIndex)
                    }
                });
            } catch (error) {
                console.error('Error creating YouTube player:', error);
                hideLoading(slideIndex);
            }
        }

        function onPlayerReady(event, slideIndex) {
            hideLoading(slideIndex);
            showVideoPlayer(slideIndex);
        }

        function onPlayerStateChange(event, slideIndex) {
            if (slideIndex !== current) return;
            
            if (event.data === YT.PlayerState.PLAYING) {
                isVideoPlaying = true;
                pauseAutoplay();
                showBackButton();
            } else if (event.data === YT.PlayerState.PAUSED) {
                isVideoPlaying = false;
            } else if (event.data === YT.PlayerState.ENDED) {
                isVideoPlaying = false;
                hideBackButton();
                showThumbnail(slideIndex);
                setTimeout(() => {
                    nextSlide();
                    startAutoplay();
                }, 2000);
            }
        }

        function onPlayerError(event, slideIndex) {
            console.error(`YouTube player error for slide ${slideIndex}:`, event.data);
            hideLoading(slideIndex);
            showThumbnail(slideIndex);
        }

        function showLoading(slideIndex) {
            const slide = slides[slideIndex];
            const loading = slide.querySelector('.loading-overlay');
            loading.classList.add('show');
        }
        
        function hideLoading(slideIndex) {
            const slide = slides[slideIndex];
            const loading = slide.querySelector('.loading-overlay');
            loading.classList.remove('show');
        }

        function showVideoPlayer(slideIndex) {
            const slide = slides[slideIndex];
            const thumbnail = slide.querySelector('.thumbnail-container');
            const player = slide.querySelector('.youtube-player');
            thumbnail.style.display = 'none';
            player.classList.add('active');
        }
        
        function showThumbnail(slideIndex) {
            const slide = slides[slideIndex];
            const thumbnail = slide.querySelector('.thumbnail-container');
            const player = slide.querySelector('.youtube-player');
            thumbnail.style.display = 'block';
            player.classList.remove('active');
            
            if (players[slideIndex]) {
                try {
                    players[slideIndex].destroy();
                } catch (error) {
                    console.error('Error destroying player:', error);
                }
                delete players[slideIndex];
            }
        }

        function showBackButton() {
            backButton.classList.add('show');
        }
        
        function hideBackButton() {
            backButton.classList.remove('show');
        }

        function handlePlayClick(slideIndex) {
            if (slideIndex !== current) return;
            
            showLoading(slideIndex);
            pauseAutoplay();
            
            const checkAPI = () => {
                if (apiLoaded && window.YT && window.YT.Player) {
                    createPlayer(slideIndex);
                } else {
                    setTimeout(checkAPI, 100);
                }
            };
            checkAPI();
        }

        function handleBackClick() {
            if (isVideoPlaying && players[current]) {
                try {
                    players[current].pauseVideo();
                } catch (error) {
                    console.error('Error pausing video:', error);
                }
            }
            showThumbnail(current);
            hideBackButton();
            isVideoPlaying = false;
            startAutoplay();
        }

        function updateCarousel() {
            carousel.style.transform = `translateX(-${current * 100}vw)`;
            dots.forEach(d => d.classList.remove('active'));
            dots[current].classList.add('active');
        }

        function goToSlide(index) {
            if (index === current) return;
            
            if (isVideoPlaying) {
                showThumbnail(current);
                hideBackButton();
                isVideoPlaying = false;
            }
            
            current = index;
            updateCarousel();
            pauseAutoplay();
            
            setTimeout(() => {
                if (!isVideoPlaying) startAutoplay();
            }, 3000);
        }

        function prevSlide() {
            const newIndex = (current - 1 + slides.length) % slides.length;
            goToSlide(newIndex);
        }
        
        function nextSlide() {
            const newIndex = (current + 1) % slides.length;
            goToSlide(newIndex);
        }

        function startAutoplay() {
            pauseAutoplay();
            autoplayTimer = setInterval(() => {
                if (!isVideoPlaying) {
                    nextSlide();
                }
            }, 4000);
        }
        
        function pauseAutoplay() {
            if (autoplayTimer) {
                clearInterval(autoplayTimer);
                autoplayTimer = null;
            }
        }

        // Event listeners
        slides.forEach((slide, index) => {
            const playButton = slide.querySelector('.play-button');
            const thumbnailContainer = slide.querySelector('.thumbnail-container');
            
            playButton.addEventListener('click', (e) => {
                e.stopPropagation();
                handlePlayClick(index);
            });
            
            thumbnailContainer.addEventListener('click', (e) => {
                if (e.target === playButton || playButton.contains(e.target)) return;
                handlePlayClick(index);
            });
        });

        prevBtn.addEventListener('click', prevSlide);
        nextBtn.addEventListener('click', nextSlide);
        backButton.addEventListener('click', handleBackClick);

        // Keyboard navigation
        document.addEventListener('keydown', (event) => {
            switch(event.key) {
                case 'ArrowLeft':
                    event.preventDefault();
                    if (!isVideoPlaying) prevSlide();
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    if (!isVideoPlaying) nextSlide();
                    break;
                case 'Escape':
                    event.preventDefault();
                    if (isVideoPlaying) handleBackClick();
                    break;
            }
        });

        // Touch/swipe support
        let touchStartX = 0;
        let touchEndX = 0;
        
        carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        carousel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            const swipeThreshold = 100;
            
            if (!isVideoPlaying && Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    nextSlide();
                } else {
                    prevSlide();
                }
            }
        }, { passive: true });

        // Pause autoplay on hover
        carousel.addEventListener('mouseenter', pauseAutoplay);
        carousel.addEventListener('mouseleave', () => {
            if (!isVideoPlaying) {
                setTimeout(() => {
                    if (!isVideoPlaying) startAutoplay();
                }, 2000);
            }
        });

        // Initialize
        loadYouTubeAPI();
        updateCarousel();
        
        setTimeout(() => {
            startAutoplay();
        }, 1000);
    </script>
</body>
</html>
