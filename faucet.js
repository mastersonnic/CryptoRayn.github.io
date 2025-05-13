document.addEventListener('DOMContentLoaded', function() {
    const timeLeftElement = document.getElementById('time-left');
    const claimNowButton = document.getElementById('claim-now-button');
    const claimStatusElement = document.getElementById('claim-status');
    const timerInterval = 1000; // 1 segundo
    const claimIntervalHours = 1;
    const appsScriptUrl = 'https://script.google.com/macros/s/AKfycbxN94R_-DiLxyWjoJkoxyOmpMyYD37CrtbUNaSBryAmh4DsYItY1VVOhx2vR3N0Prt5ag/exec';
    let timer;
    let userEmail; // Variable para almacenar el correo electrónico del usuario

    // Función para obtener el correo electrónico del usuario (necesitas implementarla)
    function getUserEmail() {
        // Esto es un ejemplo. En una implementación real, podrías obtenerlo de localStorage,
        // una cookie o pasarlo como parámetro en la URL después del inicio de sesión.
        return localStorage.getItem('faucetpayEmail');
    }

    function updateTimerDisplay(remainingTime) {
        const hours = Math.floor(remainingTime / 3600);
        const minutes = Math.floor((remainingTime % 3600) / 60);
        const seconds = Math.floor(remainingTime % 60);
        timeLeftElement.textContent = `<span class="math-inline">\{String\(hours\)\.padStart\(2, '0'\)\}\:</span>{String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        if (remainingTime <= 0) {
            clearInterval(timer);
            claimNowButton.disabled = false;
            timeLeftElement.textContent = 'Listo para reclamar';
        }
    }

    function startTimer(lastClaimTime) {
        const nextClaimTime = new Date(lastClaimTime.getTime() + claimIntervalHours * 60 * 60 * 1000);
        const now = new Date();
        let remainingTime = Math.max(0, Math.floor((nextClaimTime.getTime() - now.getTime()) / 1000));

        updateTimerDisplay(remainingTime);
        timer = setInterval(() => {
            remainingTime = Math.max(0, remainingTime - 1);
            updateTimerDisplay(remainingTime);
        }, timerInterval);
    }

    function getLastClaimTime() {
        userEmail = getUserEmail();
        if (!userEmail) {
            console.error('No se pudo obtener el correo electrónico del usuario.');
            claimStatusElement.textContent = 'Error: No se pudo identificar al usuario.';
            claimStatusElement.classList.remove('hidden');
            return;
        }

        fetch(appsScriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'getLastClaimTime',
                email: userEmail
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.lastClaimTime) {
                startTimer(new Date(data.lastClaimTime));
            } else {
                // Si no hay hora de reclamo previa, permitir reclamar inmediatamente
                claimNowButton.disabled = false;
                timeLeftElement.textContent = 'Listo para reclamar';
                console.log(data.message || 'No se encontró la última hora de reclamo para este usuario.');
            }
        })
        .catch(error => {
            console.error('Error al obtener la última hora de reclamo:', error);
            claimStatusElement.textContent = 'Error al cargar el temporizador.';
            claimStatusElement.classList.remove('hidden');
        });
    }

    claimNowButton.addEventListener('click', function() {
        claimNowButton.disabled = true;
        timeLeftElement.textContent = 'Reclamando...';
        userEmail = getUserEmail();
        if (!userEmail) {
            console.error('No se pudo obtener el correo electrónico del usuario.');
            claimStatusElement.textContent = 'Error: No se pudo identificar al usuario para el reclamo.';
            claimStatusElement.classList.remove('hidden');
            claimNowButton.disabled = false;
            timeLeftElement.textContent = 'Listo para reclamar';
            return;
        }

        fetch(appsScriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'recordClaimTime',
                email: userEmail
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                claimStatusElement.textContent = 'Reclamo exitoso. Espera 1 hora para el próximo reclamo.';
                claimStatusElement.classList.remove('hidden', 'error-animation');
                claimStatusElement.classList.add('success-animation');
                getLastClaimTime(); // Volver a obtener la
