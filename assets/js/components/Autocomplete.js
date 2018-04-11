class Autocomplete {
    constructor(input, searchArray, componentClass) {
        this.input = document.querySelector(input);
        this.searchArray = searchArray;
        this.searchableString = '';
        this.autocomplete = false;
        this.componentClass = componentClass ? componentClass : 'autocomplete';
        this.autocompleteList = false;

        this.makeSearchClick = this.handleSearchClick.bind(this);
        this.clickAutocomplete = this.handleClickAutocomplete.bind(this);
        this.autocompleteKeydown = this.handleAutocompleteKeydown.bind(this);
        this.bindEvents();
    }

    bindEvents() {
        document.body.addEventListener('click', this.clickAutocomplete, false);
        this.input.addEventListener('keyup', this.makeSearchClick, false);
        document.body.addEventListener('keydown', this.autocompleteKeydown, false);
    }

    removeEvents() {
        document.body.removeEventListener('click', this.clickAutocomplete, false);
        this.input.removeEventListener('keyup', this.makeSearchClick, false);
        document.body.removeEventListener('keydown', this.autocompleteKeydown, false);
    }

    handleAutocompleteKeydown(e) {
        if (
            e.target.id === 'js-tagsInput' &&
            this.isOpen() &&
            e.keyCode === 27
        ) {
            return this.hide();
        }
    }

    handleClickAutocomplete(e) {
        if (
            !e.target.classList.contains(`${this.componentClass}__list`) &&
            !e.target.classList.contains(`js-${this.componentClass}Link`)
        ) {
            this.hide();
        } else if (e.target.classList.contains(`js-${this.componentClass}Link`)) {
            this.setValue(e);
            this.hide();
            this.input.focus();
        }
    }

    handleSearchClick(e) {
        if (e.keyCode === 27 || e.keyCode === 13) {
            return;
        }

        const inputCurrentArray = e.target.value.split(',');
        this.searchableString = inputCurrentArray.pop();
        const foundArray = [];

        if (this.searchableString.length <= 1) {
            return this.hide();
        }

        for (const item of this.searchArray) {
            if (
                (item.toLowerCase()).includes(this.searchableString) &&
                (item.toLowerCase()) !== this.searchableString &&
                !inputCurrentArray.includes(item)
            ) {
                foundArray.push(item);
            }
        }

        if (foundArray.length > 0) {
            this.show(foundArray);
        } else {
            this.hide();
        }
    }

    show(foundArray) {
        Helper.clearChildren(this.autocompleteList);
        this.renderWrapper();
        Helper.addClass(this.autocomplete, 'is-open');

        for (const item of foundArray) {
            this.renderItem(item);
        }
    }

    hide() {
        if (this.autocomplete) {
            Helper.removeClass(this.autocomplete, 'is-open');
        }
    }

    isOpen() {
        return this.autocomplete && this.autocomplete.classList.contains('is-open');
    }

    renderWrapper() {
        if (this.input.parentNode.querySelector(`.${this.componentClass}`)) {
            return;
        }

        const element = Helper.createNode('div');
        element.setAttribute('class', this.componentClass);
        Helper.append(this.input.parentNode, element);

        this.autocomplete = this.input.parentNode.querySelector(`.${this.componentClass}`);

        const ulElement = Helper.createNode('ul');
        ulElement.setAttribute('class', `${this.componentClass}__list`);
        Helper.append(this.autocomplete, ulElement);

        this.autocompleteList = ulElement;
    }

    renderItem(item) {
        const listElement = Helper.createNode('li');
        const linkElement = Helper.createNode('a');
        const tagNode = Helper.createTextNode(item);

        listElement.setAttribute('class', 'autocomplete__item');
        linkElement.setAttribute('href', `#${item}`);
        linkElement.setAttribute('class', 'autocomplete__link js-autocompleteLink');
        linkElement.setAttribute('title', item);

        Helper.append(linkElement, tagNode);
        Helper.append(listElement, linkElement);
        Helper.append(this.autocompleteList, listElement);
    }

    setValue(e) {
        const currentInputValueArray = this.input.value.split(',');
        const lastInputValue = currentInputValueArray.pop();
        if (lastInputValue === this.searchableString) {
            this.input.value = currentInputValueArray;
            this.searchableString = '';
        }

        const value = e.target.hash.substr(1);
        this.input.value += currentInputValueArray.length === 0 ? value : `,${value}`;
    }

    remove() {
        if (this.autocomplete) {
            this.autocomplete.parentNode.removeChild(this.autocomplete);
        }
        this.autocomplete = false;
    }

    destroy() {
        this.removeEvents();
        this.hide();
        this.remove();
    }
}
