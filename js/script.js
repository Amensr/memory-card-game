document.addEventListener('DOMContentLoaded', () => {
    const pseudoForm = document.getElementById('pseudoForm');
    const pseudoInput = document.getElementById('pseudo');
    const gameBoard = document.getElementById('gameBoard');
    const inviteFriend = document.getElementById('inviteFriend');
    const inviteLinkContainer = document.getElementById('inviteLinkContainer');
    const leaderboard = document.getElementById('leaderboard');
    const scoreDisplay = document.getElementById('scoreDisplay');

    let pseudo = localStorage.getItem('pseudo') || '';
    let level = localStorage.getItem('level') || 'facile';
    let cards = [];
    let flippedCards = [];
    let canPlay = false;
    let score = parseInt(localStorage.getItem('score') || '0', 10);

    if (pseudo) {
        document.getElementById('pseudo').innerText = pseudo;
    }

    if (scoreDisplay) scoreDisplay.innerText = score;

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

    inviteFriend.addEventListener('click', () => {
        const inviteUrl = `inviter.html?amis=${encodeURIComponent(pseudo)}`;
        inviteLinkContainer.innerHTML = `<a href="${inviteUrl}" target="_blank">Partagez ce lien avec votre ami : ${inviteUrl}</a>`;
    });

    function saveScore(pseudo, score) {
        const scores = JSON.parse(localStorage.getItem('scores')) || [];
        scores.push({ pseudo, score });
        localStorage.setItem('scores', JSON.stringify(scores));
    }

    function getScores() {
        return JSON.parse(localStorage.getItem('scores')) || [];
    }

    if (window.location.pathname === '/jeu.html') {
        createGameBoard(level);
        const scores = getScores();
        console.log('Scores actuels:', scores);
    }

    if (window.location.pathname === '/joueurs.html') {
        const scores = getScores();
        scores.forEach(score => {
            const li = document.createElement('li');
            li.innerText = `${score.pseudo}: ${score.score}`;
            leaderboard.appendChild(li);
        });
    }

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
        const images = Array.from({ length: count }, (_, i) => `images/${folder}/image${i + 1}.png`);
        console.log('Images pour le niveau', level, images);
        return images;
    }

    function createGameBoard(level) {
        gameBoard.innerHTML = '';

        // Reset score au début de la partie
        score = 0;
        localStorage.setItem('score', score);
        if (scoreDisplay) scoreDisplay.innerText = score;

        const images = getImagesForLevel(level);
        if (level === 'difficile') {
            cards = images.flatMap(image => [
                { src: image, flipped: false },
                { src: image, flipped: false },
                { src: image, flipped: false }
            ]);
        } else {
            cards = images.flatMap(image => [
                { src: image, flipped: false },
                { src: image, flipped: false }
            ]);
        }
        cards.sort(() => Math.random() - 0.5);

        flippedCards = [];
        canPlay = false;

        cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.classList.add('card');
            cardElement.classList.add('flipped'); // face visible au départ
            cardElement.innerHTML = `<img src="${card.src}" alt="Card" class="front">`;
            card.element = cardElement;
            gameBoard.appendChild(cardElement);
            cardElement.addEventListener('click', () => {
                if (!canPlay) return;
                flipCard(cardElement, card);
            });
        });

        const delayMap = { facile: 5000, moyen: 7000, difficile: 10000 };
        const displayTime = delayMap[level] || 5000;

        setTimeout(() => {
            cards.forEach(card => {
                card.element.classList.remove('flipped');
            });
            canPlay = true;
        }, displayTime);
    }

    function flipCard(cardElement, card) {
        const maxFlips = (level === 'difficile') ? 3 : 2;
        if (!canPlay) return;
        if (flippedCards.length >= maxFlips) return;
        if (card.flipped) return;
        if (cardElement.classList.contains('flipped')) return;

        cardElement.classList.add('flipped');
        flippedCards.push({ element: cardElement, card });

        if (flippedCards.length === maxFlips) {
            canPlay = false;
            setTimeout(checkForMatch, 800);
        }
    }

    function checkForMatch() {
        if (level === 'difficile') {
            const [first, second, third] = flippedCards;
            if (first.card.src === second.card.src && second.card.src === third.card.src) {
                first.card.flipped = true;
                second.card.flipped = true;
                third.card.flipped = true;
                flippedCards = [];
                canPlay = true;

                score += 13; // 13 points pour une triplette trouvée
                localStorage.setItem('score', score);
                if (scoreDisplay) scoreDisplay.innerText = score;

                if (cards.every(card => card.flipped)) {
                    alert('Vous avez gagné !');
                    saveScore(pseudo, score);
                    window.location.href = 'joueur.html';
                }
            } else {
                setTimeout(() => {
                    flippedCards.forEach(({ element }) => element.classList.remove('flipped'));
                    flippedCards = [];
                    canPlay = true;
                }, 1000);
            }
        } else {
            const [first, second] = flippedCards;
            if (first.card.src === second.card.src) {
                first.card.flipped = true;
                second.card.flipped = true;
                flippedCards = [];
                canPlay = true;

                score += 7; // 2 points par paire trouvée
                localStorage.setItem('score', score);
                if (scoreDisplay) scoreDisplay.innerText = score;

                if (cards.every(card => card.flipped)) {
                    alert('Vous avez gagné !');
                    saveScore(pseudo, score);
                    window.location.href = 'joueur.html';
                }
            } else {
                setTimeout(() => {
                    first.element.classList.remove('flipped');
                    second.element.classList.remove('flipped');
                    flippedCards = [];
                    canPlay = true;
                }, 1000);
            }
        }
    }

    if (window.location.pathname === '/jeu.html') {
        let exitBtn = document.createElement('button');
        exitBtn.textContent = "Sortir";
        exitBtn.style.marginTop = "20px";
        exitBtn.onclick = () => window.location.href = "index.html";
        document.querySelector('main').appendChild(exitBtn);
    }

    if (window.location.pathname === '/joueurs.html') {
        const scores = getScores();
        scores.forEach(score => {
            const li = document.createElement('li');
            li.innerText = `${score.pseudo}: ${score.score}`;
            leaderboard.appendChild(li);
        });
    }

    if (window.location.pathname === '/inviter.html') {
        const urlParams = new URLSearchParams(window.location.search);
        const ami = urlParams.get('amis');
        inviteLink.innerText = `Invitation de ${ami}`;
    }

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