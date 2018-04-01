class Autocomplete {
    constructor(input, searchArray) {
        this.input = document.querySelector(input);
        this.searchArray = searchArray;

        this.makeSearchClick = this.handleSearchClick.bind(this);
        this.bindEvents();
    }

    bindEvents() {
        this.input.addEventListener('keyup', this.makeSearchClick, false);
    }

    removeEvents() {
        this.input.removeEventListener('keyup', this.makeSearchClick, false);
    }

    handleSearchClick(e) {
        const value = e.target.value;
        const searchableString = value.split(',').pop();

        if (searchableString.length <= 1) {
            return;
        }

        for (const item of this.searchArray) {
            if ((item.toLowerCase()).includes(searchableString)) {
                this.showAutocomplete(item);
            }
        }
    }

    showAutocomplete(item) {

    }

    createAutocomplete() {

    }

    destroy() {
        this.removeEvents();
    }
}
