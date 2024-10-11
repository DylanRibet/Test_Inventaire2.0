let foundItems = []; // Tableau pour les items trouvés
let notFoundItems = []; // Tableau pour les items non trouvés
let itemsList = []; // Liste de tous les items
let isScanning = false; // Indicateur pour savoir si le scan est en cours

// Lire le fichier CSV
function processCSV() {
    const fileInput = document.getElementById('csvFileInput');

    if (!fileInput.files.length) {
        alert("Veuillez sélectionner un fichier CSV.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        const text = e.target.result;
        const rows = text.split('\n').map(row => row.split(',')); // Séparer les lignes et les colonnes
        const items = rows.slice(7); // Prendre les lignes à partir de la 8ème
        displayItems(items); // Afficher les items
    };

    reader.readAsText(fileInput.files[0]);
}

// Afficher la liste des items dans un tableau
function displayItems(items) {
    const tbody = document.getElementById('itemList').getElementsByTagName('tbody')[0];
    tbody.innerHTML = ''; // Réinitialiser le tableau
    itemsList = []; // Réinitialiser la liste d'items

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">Aucun item trouvé.</td></tr>';
        return;
    }

    items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item[0]}</td>
            <td>${item[1] || 'N/A'}</td>
            <td>${item[11] || 'N/A'}</td>
            <td>${item[3] || 'N/A'}</td>
            <td>${item[2] || 'N/A'}</td>
        `;
        row.setAttribute('data-code', item[0]);
        tbody.appendChild(row);

        // Ajouter l'item à la liste
        itemsList.push({
            code: item[0],
            description: item[2] || 'N/A',
            scanned: false // Non scanné par défaut
        });
    });
}

// Vérifie si le code scanné correspond à un item dans la liste
function checkItem(scannedCode) {
    const items = document.querySelectorAll('#itemList tbody tr');
    let found = false;

    items.forEach(item => {
        if (item.getAttribute('data-code') === scannedCode) {
            item.classList.add('scanned'); // Marquer comme scanné
            found = true;

            const itemDetails = itemsList.find(i => i.code === scannedCode);
            if (itemDetails) {
                itemDetails.scanned = true;
                foundItems.push(itemDetails);
            }
        }
    });

    if (!found) {
        alert("Item non trouvé dans la liste.");
    }

    // Mettre à jour la liste des items non trouvés
    notFoundItems = itemsList.filter(item => !item.scanned);
}

// Téléchargement des rapports
async function downloadSummary(status) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('portrait', 'pt', 'letter');

    pdf.setFontSize(16);
    pdf.text(`Rapport des items ${status === 'found' ? 'trouvés' : 'non trouvés'}`, 10, 20);

    pdf.setFontSize(12);
    const startY = 40;
    const rowHeight = 15;
    const columnWidth = [100, 200];

    pdf.text("Code-barres", 10, startY);
    pdf.text("Description", columnWidth[0] + 10, startY);
    pdf.line(10, startY + 5, 10 + columnWidth[0] + columnWidth[1], startY + 5);

    let yPosition = startY + rowHeight;
    const margin = 10;

    const dataToDisplay = status === 'found' ? foundItems : notFoundItems;

    dataToDisplay.forEach((item) => {
        if (yPosition > pdf.internal.pageSize.height - margin) {
            pdf.addPage();
            pdf.text("Code-barres", 10, 20);
            pdf.text("Description", columnWidth[0] + 10, 20);
            pdf.line(10, 25, 10 + columnWidth[0] + columnWidth[1], 25);
            yPosition = 40;
        }

        pdf.text(item.code, 10, yPosition);
        pdf.text(item.description, columnWidth[0] + 10, yPosition);
        yPosition += rowHeight;
    });

    pdf.save(`rapport_items_${status === 'found' ? 'trouvés' : 'non_trouvés'}.pdf`);
}

// Événements
document.getElementById('csvFileInput').addEventListener('change', processCSV);

async function startScanner() {
    const constraints = {
        video: {
            facingMode: { exact: "environment" }
        }
    };

    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#scanner'),
            constraints
        },
        decoder: {
            readers: ["code_128_reader", "ean_reader"]
        }
    }, (err) => {
        if (err) {
            console.error(err);
            return;
        }
        Quagga.start();
        isScanning = true;
    });
}

function stopScanner() {
    Quagga.stop();
    isScanning = false;
}

Quagga.onDetected((data) => {
    if (isScanning) {
        const scannedCode = data.codeResult.code;
        checkItem(scannedCode);
    }
});

// Lier les événements aux boutons
document.getElementById('scanButton').addEventListener('mousedown', startScanner);
document.getElementById('scanButton').addEventListener('mouseup', stopScanner);