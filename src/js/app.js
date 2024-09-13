const BATCH_SIZE = 100;
let currentIndex = 0;
let allImages = [];
let filteredImages = [];
let currentPage = 1;
let totalPages = 0;
let filterEnabled = false;
let sortCriteria = 'name';
let sortDirection = 'asc';

const masonry = new Masonry(document.getElementById('gallery'), {
    itemSelector: '.image-container',
    fitWidth: true,
    gutter: 5,
});

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function handleFileInput(event) {
    resetBatchLoading();

    const files = event.target.files;
    const previousPageButton = document.getElementById('previous-page');
    const currentPageButton = document.getElementById('current-page');
    const nextPageButton = document.getElementById('next-page');

    previousPageButton.classList.add('inactive');
    currentPageButton.classList.add('inactive');
    nextPageButton.classList.add('inactive');

    if (files.length > 0) {
        document.getElementById('gallery-bottom').classList.remove('hidden');
        setMessage();
        toggleUIVisibility(true);
    }

    allImages = Array.from(files).filter(file => file.type.startsWith('image/'));

    orderImages(); // Uses default values

    updateProgress(0);
    refreshPagination();
}

function loadPage(pageNumber, usingFilter = false) {
    const gallery = document.getElementById('gallery');
    currentIndex = (pageNumber - 1) * BATCH_SIZE;

    if (!usingFilter) batch = allImages.slice(currentIndex, currentIndex + BATCH_SIZE);
    else batch = filteredImages.slice(currentIndex, currentIndex + BATCH_SIZE);

    imagesLoaded(gallery, function() {
        setTimeout(function() {
            updateGalleryUI();
        }, 3000);
    });

    // Remove the last 100 images added
    clearGallery()

    batch.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageContainer = createImageContainer(file, e.target.result);
            gallery.appendChild(imageContainer);
            masonry.appended(imageContainer);
            debounce(updateGalleryUI(), 3000);

            const progress = ((currentIndex + index + 1) / allImages.length) * 100;
            updateProgress(progress);
        };
        reader.readAsDataURL(file);
    });

    updateProgress(currentIndex + BATCH_SIZE >= allImages.length ? 100 : (currentIndex + BATCH_SIZE) / allImages.length * 100);
}

function setupPaginationControls() {
    const paginationContainer = document.getElementById('pagination-controls');
    const previousPageButton = paginationContainer.querySelector('#previous-page');
    const currentPageButton = paginationContainer.querySelector('#current-page');
    const nextPageButton = paginationContainer.querySelector('#next-page');
    const seekPageInput = paginationContainer.querySelector('#seek-page');

    previousPageButton.classList.add('inactive')

    previousPageButton.addEventListener('click', () => {
        if (previousPageButton.classList.contains('inactive')) return;

        currentPage -= 1;
        loadPage(currentPage);
        currentPageButton.textContent = `${currentPage}/${totalPages}`
        nextPageButton.classList.remove('inactive');

        if (currentPage === 1) previousPageButton.classList.add('inactive');
    });

    currentPageButton.addEventListener('click', () => {
        if (currentPageButton.classList.contains('inactive')) return;

        seekPageInput.classList.remove('hidden');
        seekPageInput.focus();

        setTimeout(function() {
            seekPageInput.style.width = '150px';
        }, 40); // Slight delay so input can transition correctly
    });

    nextPageButton.addEventListener('click', () => {
        if (nextPageButton.classList.contains('inactive')) return;

        currentPage += 1;
        loadPage(currentPage);
        currentPageButton.textContent = `${currentPage}/${totalPages}`
        previousPageButton.classList.remove('inactive');

        if (currentPage >= totalPages) nextPageButton.classList.add('inactive');
    });

    seekPageInput.addEventListener('keyup', (event) => {
        const key = event.key;

        if (key === 'Enter') {
            const pageToSeek = parseInt(seekPageInput.value, 10);

            if (isNaN(pageToSeek) || pageToSeek < 1 || pageToSeek > totalPages) {
                seekPageInput.value = '';
                return;
            }

            currentPage = pageToSeek;
            loadPage(currentPage);

            currentPageButton.textContent = `${currentPage}/${totalPages}`

            if (currentPage === 1) previousPageButton.classList.add('inactive');
            else previousPageButton.classList.remove('inactive');

            if (currentPage >= totalPages) nextPageButton.classList.add('inactive');
            else nextPageButton.classList.remove('inactive');

            seekPageInput.style.width = '0px';

            setTimeout(function() {
                seekPageInput.classList.add('hidden');
            }, 300); // Matches CSS transition duration
        }
    });
}

function refreshPagination(usingFilter = false) {
    const paginationContainer = document.getElementById('pagination-controls');
    const previousPageButton = paginationContainer.querySelector('#previous-page');
    const currentPageButton = paginationContainer.querySelector('#current-page');
    const nextPageButton = paginationContainer.querySelector('#next-page');

    if (!usingFilter) {
        totalPages = Math.ceil(allImages.length / BATCH_SIZE);
        currentPage = 1;
        previousPageButton.classList.add('inactive');
        currentPageButton.classList.add('inactive');
        nextPageButton.classList.add('inactive');

        if (totalPages > 1) {
            currentPageButton.classList.remove('inactive');
            nextPageButton.classList.remove('inactive');
        }
    } else {
        totalPages = Math.ceil(filteredImages.length / BATCH_SIZE);
        currentPage = 1;
        previousPageButton.classList.add('inactive');
        currentPageButton.classList.add('inactive');
        nextPageButton.classList.add('inactive');

        if (totalPages > 1) {
            currentPageButton.classList.remove('inactive');
            nextPageButton.classList.remove('inactive');
        }
    }

    setMessage();
    updateProgress(0);
    currentPageButton.textContent = `${Math.min(currentPage, totalPages)}/${totalPages}`
    loadPage(currentPage, usingFilter);
}

function resetBatchLoading() {
    currentIndex = 0;
    allImages = [];
}

function updateProgress(progress) {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    progressBar.value = progress;
    progressText.textContent = `${Math.round(progress)}%`;

    if (progress === 100) {
        setTimeout(() => {
            progressBar.classList.add('hidden');
            progressText.textContent = 'Puff! Parece que você chegou ao fim...'
        }, 1000);
    } else {
        progressBar.classList.remove('hidden')
    }
}

function updateGalleryUI() {
    masonry.layout();
}

function clearGallery() {
    const gallery = document.getElementById('gallery');
    const imageElements = gallery.querySelectorAll('.image-container');
    imageElements.forEach(element => {
        masonry.remove(element);
    });
    updateGalleryUI();
}

function initializeModal() {
    const modal = document.getElementById('image-modal');
    modal.querySelector('.close').addEventListener('click', () => {
        modal.style.display = "none";
    });
}

function resetViewHandler() {
    const resetView = document.getElementById('reset-view');
    const fileInput = document.getElementById('file-input');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    if (resetView.classList.contains('inactive')) return;

    fileInput.value = '';
    progressBar.value = 0;
    progressText.textContent = '0%';
    document.getElementById('gallery-bottom').classList.add('hidden');

    setMessage('Parece que não há nada aqui ainda... Que tal começar adicionando uma pasta?');
    toggleUIVisibility(false);
    resetBatchLoading();
    clearGallery();
}

function showFilterMenu() {
    const filterButton = document.getElementById('filter');
    const filterMenu = document.getElementById('filter-menu');
    if (filterButton.classList.contains('inactive')) return;

    if (filterMenu.style.display === 'none' || filterMenu.style.display === '') {
        filterMenu.style.display = 'flex';
    } else {
        filterMenu.style.display = 'none';
    }
}

function handleFilterMenu() {
    const filterMenu = document.getElementById('filter-menu');
    const searchButton = filterMenu.querySelector('#search-btn');
    const clearButton = filterMenu.querySelector('#clear-filters');
    const searchInput = filterMenu.querySelector('#search');
    const dateStartInput = filterMenu.querySelector('#search-date-start');
    const dateEndInput = filterMenu.querySelector('#search-date-end');
    const fileTypeInput = filterMenu.querySelector('#search-file-type');
    const sizeMinInput = filterMenu.querySelector('#search-size-min');
    const sizeMaxInput = filterMenu.querySelector('#search-size-max');

    searchButton.addEventListener('click', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const dateStart = new Date(dateStartInput.value);
        const dateEnd = new Date(dateEndInput.value);
        const fileType = fileTypeInput.value;
        const sizeMin = parseFloat(sizeMinInput.value) || 0;
        const sizeMax = parseFloat(sizeMaxInput.value) || Infinity;

        // Debugging
        console.log(`
            -- Filter Terms --
            Search Term: ${searchTerm}
            Date Start: ${dateStart}
            Date End: ${dateEnd}
            File Type: ${fileType}
            Size Min: ${sizeMin} KB
            Size Max: ${sizeMax} KB
            `);

        filteredImages = allImages.filter(image => {
            const matchesName = image.name.toLowerCase().includes(searchTerm);
            const matchesDate = (!isNaN(dateStart.getTime()) ? image.lastModified >= dateStart.getTime() : true) &&
                                (!isNaN(dateEnd.getTime()) ? image.lastModified <= dateEnd.getTime() : true);
            const matchesType = fileType ? image.type === fileType : true;
            const matchesSize = (image.size / 1024 >= sizeMin) && (image.size / 1024 <= sizeMax);

            return matchesName && matchesDate && matchesType && matchesSize;
        });

        filterEnabled = true
        orderImages(sortCriteria, sortDirection, filteredImages);
        refreshPagination(true);

        if (filteredImages.length < 1) {
            setMessage('Nenhuma imagem encontrada com os filtros atuais.');
        }
    });

    clearButton.addEventListener('click', () => {
        filteredImages.length = 0;
        searchInput.value = '';
        dateStartInput.value = '';
        dateEndInput.value = '';
        fileTypeInput.value = '';
        sizeMinInput.value = '';
        sizeMaxInput.value = '';

        filterEnabled = false;
        refreshPagination(false);
    });
}

function showOrderMenu() {
    const orderMenu = document.getElementById('order-menu');
    const orderButton = document.getElementById('order-by');
    if (orderButton.classList.contains('inactive')) return;

    if (orderMenu.style.display === 'none' || orderMenu.style.display === '') {
        orderMenu.style.display = 'flex';
    } else {
        orderMenu.style.display = 'none';
    }
}

function handleOrderMenuOptions() {
    const orderMenu = document.getElementById('order-menu');
    const menuOptions = orderMenu.querySelectorAll('button');

    menuOptions.forEach(option => {
        option.addEventListener('click', () => {
            const sortBy = option.dataset.sort;
            sortCriteria = sortBy;

            if (filteredImages.length > 0) {
                orderImages(sortBy, sortDirection, filteredImages);
            } else {
                orderImages(sortBy, sortDirection, filteredImages);
            }

            loadPage(currentPage, filterEnabled);
            showOrderMenu();

            // Marks only the pressed button as active
            option.classList.add('active');
            menuOptions.forEach(button => {
                if (button.dataset.sort === sortBy) return;
                button.classList.remove('active');
            });
        });
    });

    const directionInputs = orderMenu.querySelectorAll('input[name="direction"]');
    directionInputs.forEach(input => {
        input.addEventListener('change', (event) => {
            sortDirection = event.target.value;
        });
    });
}

function showSettingsMenu() {
    const settingsMenu = document.getElementById('settings-menu');
    const settingsButton = document.getElementById('settings');
    if (settingsButton.classList.contains('inactive')) return;

    if (settingsMenu.style.display === 'none' || settingsMenu.style.display === '') {
        settingsMenu.style.display = 'flex';
    } else {
        settingsMenu.style.display = 'none';
    }
}

function handleSettingsMenu() {
    const settingsMenu = document.getElementById('settings-menu');
    const saveButton = document.getElementById('save-settings');

    saveButton.addEventListener('click', () => {
        const settingItems = settingsMenu.querySelectorAll('.setting-item');
        const settings = {};

        settingItems.forEach(item => {
            const settingEntry = item.id;
            if (item.type && item.type === 'checkbox') {
                return settings[settingEntry] = item.checked;
            }
            settings[settingEntry] = item.value;
        });

        const success = saveSettings(settings);

        if (success) alert('Suas novas preferências foram salvas! Elas serão aplicadas na página automáticamente.');
        else alert('Erro ao salvar suas preferências.');
    });
}

function saveSettings(settings) {
    try {
        localStorage.setItem('settings', JSON.stringify(settings));
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

function loadSettings() {
    const storedSettings = localStorage.getItem('settings');

    if (storedSettings) {
        return JSON.parse(storedSettings);
    } else {
        const settingsMenu = document.getElementById('settings-menu');
        const settingItems = settingsMenu.querySelectorAll('.setting-item');
        const settings = {};

        settingItems.forEach(item => {
            const settingEntry = item.id;
            if (item.type && item.type === 'checkbox') {
                return settings[settingEntry] = item.checked;
            }
            settings[settingEntry] = item.value;
        });

        const success = saveSettings(settings);
        
        if (success) return settings;
        else return false;
    }
}

function applySettings() {
    const storedSettings = loadSettings();
    const settingsMenu = document.getElementById('settings-menu');
    const settingItems = settingsMenu.querySelectorAll('.setting-item');

    if (storedSettings) {
        settingItems.forEach(item => {
            const settingEntry = item.id;
            if (item.type && item.type === 'checkbox') {
                item.checked = storedSettings[settingEntry];
            } else {
                item.value = storedSettings[settingEntry];
            }
        });
    } else {
        return false;
    }
}

function handleSubMenus() {
    handleFilterMenu();
    handleOrderMenuOptions();
    handleSettingsMenu();
}

function toggleSubMenuVisibility(event) {
    const navbarMenus = document.querySelectorAll('.sub-menu');
    navbarMenus.forEach(menu => {
        const controlButton = document.getElementById(menu.dataset.controlbutton);
        if (!controlButton.contains(event.target) && !menu.contains(event.target)) {
            menu.style.display = 'none';
        }
    });
}

function initializeEventListeners() {
    const fileInput = document.getElementById('file-input');
    const selectFolder = document.getElementById('select-folder');
    const resetView = document.getElementById('reset-view');
    const gallery = document.getElementById('gallery');
    const refreshLayout = document.getElementById('refresh-layout');
    const orderButton = document.getElementById('order-by');
    const filterButton = document.getElementById('filter');
    const settingsButton = document.getElementById('settings');

    selectFolder.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileInput);
    resetView.addEventListener('click', resetViewHandler);
    gallery.addEventListener('click', showModal);
    refreshLayout.addEventListener('click', () => {
        if (!refreshLayout.classList.contains('inactive')) {
            updateGalleryUI();
        }
    });
    orderButton.addEventListener('click', showOrderMenu);
    filterButton.addEventListener('click', showFilterMenu);
    settingsButton.addEventListener('click', showSettingsMenu);
    document.addEventListener('click', (event) => toggleSubMenuVisibility(event));

    handleSubMenus();
    initializeModal();
}

function orderImages(criteria = 'name', direction = 'asc', imageArray = allImages) {
    clearGallery();
    setMessage('Reordenando a lista de imagens. (Isso pode levar um tempo.)');

    switch(criteria) {
        case 'name':
            imageArray.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'date':
            imageArray.sort((a, b) => a.lastModified - b.lastModified);
            break;
        case 'size':
            imageArray.sort((a, b) => a.size - b.size);
            break;
        case 'format':
            imageArray.sort((a, b) => a.type.localeCompare(b.type));
            break;
        default:
            return console.error('Invalid order criteria');
    }

    if (direction === 'desc') {
        imageArray.reverse();
    }

    setMessage();
    return imageArray;
}

function showModal(event) {
    const modal = document.getElementById('image-modal');
    const modalImg = modal.querySelector('#modal-image');
    const modalInfo = modal.querySelector('#modal-info');

    const parent = event.target.parentElement;
    if (parent.classList.contains('image-container')) {
        modalImg.src = event.target.src;
        modalInfo.innerHTML = `
            <p>Nome: ${parent.dataset.name}</p>
            <p>Formato: ${parent.dataset.format}</p>
            <p>Dimensões: ${modalImg.width}x${modalImg.height}</p>
            <p>Data: ${parent.dataset.date}</p>
            <p>Tamanho: ${parent.dataset.size}</p>
        `;
        modal.style.display = "block";
    }
}

function createImageContainer(file, src) {
    const imageContainer = document.createElement('div');
    imageContainer.classList.add('image-container');
    imageContainer.dataset.name = file.name;
    imageContainer.dataset.format = file.type.split('/')[1].toUpperCase();
    imageContainer.dataset.date = new Date(file.lastModified).toLocaleDateString();
    imageContainer.dataset.size = (file.size / 1024).toFixed(2) + ' KB';

    const img = document.createElement('img');
    img.src = src;
    img.alt = imageContainer.dataset.name;

    if (file.type === 'image/gif') {
        const gifIndicator = document.createElement('span');
        gifIndicator.classList.add('gif-indicator');
        gifIndicator.textContent = 'GIF';
        imageContainer.appendChild(gifIndicator);
    }

    imageContainer.appendChild(img);
    return imageContainer;
}

function toggleUIVisibility(isVisible) {
    const resetView = document.getElementById('reset-view');
    const filterButton = document.getElementById('filter');
    const refreshLayout = document.getElementById('refresh-layout');
    const orderButton = document.getElementById('order-by');

    if (isVisible) {
        resetView.classList.remove('inactive');
        filterButton.classList.remove('inactive');
        refreshLayout.classList.remove('inactive');
        orderButton.classList.remove('inactive');
    } else {
        resetView.classList.add('inactive');
        filterButton.classList.add('inactive');
        refreshLayout.classList.add('inactive');
        orderButton.classList.add('inactive');
    }
}

function setMessage(message = '') {
    const messageElement = document.getElementById('message');

    if (!message) {
        messageElement.classList.add('hidden');
        messageElement.textContent = '';
        return;
    }

    messageElement.classList.remove('hidden');
    messageElement.textContent = message;
}

window.onload = () => {
    applySettings();
    initializeEventListeners();
    setupPaginationControls();
}