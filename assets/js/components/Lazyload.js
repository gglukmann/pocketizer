class Lazyload {
    /**
     * @constructor
     */
    constructor() {
        this.imageCount = 0;
        this.observer = false;
    }

    /**
     * Add IntersectionObserver to images.
     *
     * @function load
     * @return {void}
     */
    load() {
        // Get all of the images that are marked up to lazy load
        const images = document.querySelectorAll('.js-lazyload');
        const config = {
            // If the image gets within 50px in the Y axis, start the download.
            rootMargin: '50px 0px',
            threshold: 0.01
        };
        this.imageCount = images.length;

        // If we don't have support for intersection observer, loads the images immediately
        if (!('IntersectionObserver' in window)) {
            this.loadImagesImmediately(images);
        } else {
            // It is supported, load the images
            this.observer = new IntersectionObserver(entries => {
                // Disconnect if we've already loaded all of the images
                if (this.imageCount === 0) {
                    this.disconnect();
                }

                // Loop through the entries
                for (let entry of entries) {
                    // Are we in viewport?
                    if (entry.intersectionRatio > 0) {
                        this.imageCount--;

                        // Stop watching and load the image
                        this.observer.unobserve(entry.target);
                        this.preloadImage(entry.target);
                    }
                }
            }, config);

            for (let image of images) {
                if (image.classList.contains('js-lazyloaded')) {
                    continue;
                }

                this.observer.observe(image);
            }
        }
    }

    /**
    * Fetchs the image for the given URL.
    *
    * @function fetchImage
    * @param {String} url - Url from data-src.
    * @return {void}
    */
    fetchImage(url) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.src = url;
            image.onload = resolve;
            image.onerror = reject;
        });
    }

    /**
    * Preloads the image.
    *
    * @function preloadImage
    * @param {Object} image - Image to preload.
    * @return {void}
    */
    preloadImage(image) {
        const src = image.dataset.src;
        if (!src) {
            return;
        }

        return this.fetchImage(src).then(() => {
            this.applyImage(image, src);
        });
    }

    /**
    * Load all of the images immediately.
    *
    * @function loadImagesImmediately
    * @param {NodeListOf<Element>} images - Image to load.
    * @return {void}
    */
    loadImagesImmediately(images) {
        for (let image of images) {
            this.preloadImage(image);
        }
    }

    /**
    * Disconnect the observer.
    *
    * @function disconnect
    * @return {void}
    */
    disconnect() {
        if (!this.observer) {
            return;
        }

        this.observer.disconnect();
    }

    /**
    * Apply the image.
    *
    * @function applyImage
    * @param {Object} img - Image HTMLElement.
    * @param {String} src - Source url to apply.
    * @return {void}
    */
    applyImage(img, src) {
        // Prevent this from being lazy loaded a second time.
        img.classList.remove('js-lazyload');
        img.classList.add('js-lazyloaded');

        if (img.tagName.toLowerCase() === 'img') {
            img.src = src;
        } else {
            img.style.backgroundImage = 'url(' + src + ')';
        }
    }
}

const lazyload = new Lazyload();
