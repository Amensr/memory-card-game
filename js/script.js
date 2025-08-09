document.addEventListener('DOMContentLoaded', () => {
    const pseudoForm = document.getElementById('pseudoForm');
    const pseudoInput = document.getElementById('pseudo');
    const gameBoard = document.getElementById('gameBoard');
    const inviteFriend = document.getElementById('inviteFriend');
    const inviteLinkContainer = document.getElementById('inviteLinkContainer');
    const leaderboard = document.getElementById('leaderboard');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const totalScoreDisplay = document.getElementById('totalScoreDisplay'); // ➕ Affichage score cumulé
    let pseudo = localStorage.getItem('pseudo') || '';
    let level = localStorage.getItem('level') || 'facile';
    let cards = [];
    let flippedCards = [];
    let canPlay = false;
    let score = parseInt(localStorage.getItem('score') || '0', 10);

    // Affichage du pseudo et du score au chargement
    if (pseudo) {
        document.getElementById('pseudo').innerText = pseudo;
    }
    if (scoreDisplay) scoreDisplay.innerText = score;

    // Gestion pseudo form
    if (pseudoForm) {
        pseudoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            pseudo = pseudoInput.value;
            const birthYear = document.getElementById('birthYear').value;
            localStorage.setItem('birthYear', birthYear);
            const age = new Date().getFullYear() - parseInt(birthYear, 10);
            const email = document.getElementById('email').value;
            localStorage.setItem('pseudo', pseudo);
            localStorage.setItem('age', age);
            localStorage.setItem('email', email);
            window.location.href = 'jeu.html';
        });
    }

    // Invitation d'ami
    inviteFriend ? .addEventListener('click', () => {
        const inviteUrl = `inviter.html?amis=${encodeURIComponent(pseudo)}`;
        inviteLinkContainer.innerHTML = `<a href="${inviteUrl}" target="_blank">Partagez ce lien avec votre ami : ${inviteUrl}</a>`;
    });

    // Sauvegarde du score avec historique
    function saveScore(pseudo, score) {
        const scores = JSON.parse(localStorage.getItem('scores')) || [];
        scores.push({ pseudo, score, date: new Date().toLocaleString() });
        localStorage.setItem('scores', JSON.stringify(scores));
        console.log('Score sauvegardé:', { pseudo, score });
    }

    // Récupération des scores
    function getScores() {
        return JSON.parse(localStorage.getItem('scores')) || [];
    }

    // Calcul du score total d'un joueur
    function getTotalScore(pseudo) {
        return getScores()
            .filter(entry => entry.pseudo === pseudo)
            .reduce((sum, entry) => sum + entry.score, 0);
    }

    // Initialisation jeu
    if (window.location.pathname.endsWith('jeu.html')) {
        createGameBoard(level);
        console.log('Scores actuels:', getScores());
    }

    // Affichage leaderboard et scores cumulés
    if (window.location.pathname.includes('joueur.html')) {
        displayLeaderboard();
        if (totalScoreDisplay) {
            totalScoreDisplay.innerText = `Score cumulé : ${getTotalScore(pseudo)}`;
        }
    }

    function displayLeaderboard() {
        const scores = getScores();
        leaderboard.innerHTML = '';
        if (scores.length === 0) {
            leaderboard.innerHTML = '<li>Aucun score enregistré</li>';
            return;
        }
        scores.forEach((entry, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${index + 1}. ${entry.pseudo}: ${entry.score} points (${entry.date})`;
            leaderboard.appendChild(listItem);
        });
    }

    // Gestion images selon niveau
    function getImagesForLevel(level) {
        let count = 0;
        let folder = '';
        if (level === 'facile') {
            count = 10;
            folder = 'facile';
        } else if (level === 'moyen') {
            count = 15;
            folder = 'moyen';
        } else if (level === 'difficile') {
            count = 18;
            folder = 'difficile';
        }
        return Array.from({ length: count }, (_, i) => `images/${folder}/image${i + 1}.png`);
    }

    // Création du board
    function createGameBoard(level) {
        gameBoard.innerHTML = '';
        score = 0;
        localStorage.setItem('score', score);
        if (scoreDisplay) scoreDisplay.innerText = score;
        const images = getImagesForLevel(level);

        cards = (level === 'difficile') ?
            images.flatMap(image => [{ src: image, flipped: false }, { src: image, flipped: false }, { src: image, flipped: false }]) :
            images.flatMap(image => [{ src: image, flipped: false }, { src: image, flipped: false }]);

        cards.sort(() => Math.random() - 0.5);
        flippedCards = [];
        canPlay = false;

        cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.classList.add('card', 'flipped');
            cardElement.innerHTML = `<img src="${card.src}" alt="Card" class="front">`;
            card.element = cardElement;
            gameBoard.appendChild(cardElement);
            cardElement.addEventListener('click', () => {
                if (!canPlay) return;
                flipCard(cardElement, card);
            });
        });

        const delayMap = { facile: 5000, moyen: 7000, difficile: 10000 };
        setTimeout(() => {
            cards.forEach(card => card.element.classList.remove('flipped'));
            canPlay = true;
        }, delayMap[level] || 5000);
    }

    // Retourner carte
    function flipCard(cardElement, card) {
        const maxFlips = (level === 'difficile') ? 3 : 2;
        if (!canPlay || flippedCards.length >= maxFlips || card.flipped || cardElement.classList.contains('flipped')) return;
        cardElement.classList.add('flipped');
        flippedCards.push({ element: cardElement, card });

        if (flippedCards.length === maxFlips) {
            canPlay = false;
            setTimeout(checkForMatch, 800);
        }
    }

    // Vérification match
    function checkForMatch() {
        if (level === 'difficile') {
            const [first, second, third] = flippedCards;
            if (first.card.src === second.card.src && second.card.src === third.card.src) {
                first.card.flipped = second.card.flipped = third.card.flipped = true;
                flippedCards = [];
                canPlay = true;
                score += 13;
            } else {
                setTimeout(() => {
                    flippedCards.forEach(({ element }) => element.classList.remove('flipped'));
                    flippedCards = [];
                    canPlay = true;
                }, 1000);
                return;
            }
        } else {
            const [first, second] = flippedCards;
            if (first.card.src === second.card.src) {
                first.card.flipped = second.card.flipped = true;
                flippedCards = [];
                canPlay = true;
                score += 7;
            } else {
                setTimeout(() => {
                    first.element.classList.remove('flipped');
                    second.element.classList.remove('flipped');
                    flippedCards = [];
                    canPlay = true;
                }, 1000);
                return;
            }
        }
        localStorage.setItem('score', score);
        if (scoreDisplay) scoreDisplay.innerText = score;
        if (cards.every(card => card.flipped)) {
            alert('Vous avez gagné !');
            saveScore(pseudo, score);
            window.location.href = 'joueur.html';
        }
    }

    // Bouton sortie
    if (window.location.pathname.endsWith('jeu.html')) {
        let exitBtn = document.createElement('button');
        exitBtn.textContent = "Sortir";
        exitBtn.style.marginTop = "20px";
        exitBtn.onclick = () => window.location.href = "index.html";
        document.querySelector('main').appendChild(exitBtn);
    }

    // Invitation page
    if (window.location.pathname.endsWith('inviter.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const ami = urlParams.get('amis');
        inviteLink.innerText = `Invitation de ${ami}`;
    }

    // Changement de niveau
    const difficultySelect = document.getElementById('difficulty');
    if (difficultySelect) {
        difficultySelect.value = level;
        difficultySelect.addEventListener('change', (event) => {
            level = event.target.value;
            localStorage.setItem('level', level);
            createGameBoard(level);
        });
    }
});