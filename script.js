document.addEventListener('DOMContentLoaded', function() {
    const galleryItems = document.querySelectorAll('.gallery a');
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const etsyLink = document.getElementById('etsy-link');
    const closeBtn = document.querySelector('.close-btn');

    galleryItems.forEach(item => {
        item.addEventListener('click', function(event) {
            event.preventDefault();

            const largeImageUrl = this.getAttribute('href');
            const etsyUrl = this.getAttribute('data-etsy-url');

            lightbox.style.display = 'block';
            lightboxImage.src = largeImageUrl;
            
            if (etsyUrl && etsyUrl !== '#') {
                etsyLink.href = etsyUrl;
                etsyLink.style.display = 'inline-block';
            } else {
                etsyLink.style.display = 'none';
            }
        });
    });

    closeBtn.addEventListener('click', function() {
        lightbox.style.display = 'none';
    });

    lightbox.addEventListener('click', function(event) {
        if (event.target === lightbox) {
            lightbox.style.display = 'none';
        }
    });
});