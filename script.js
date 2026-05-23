// =============================================
// GDS Training Simulator - Amadeus Style
// Complete Client-Side Vanilla JS
// =============================================

let commandHistory = [];
let historyIndex = -1;
let activePNR = null;
let lastAvailability = null;
let sessionState = {};

// Database
const airports = {
    'DAC': 'Dhaka', 'BKK': 'Bangkok', 'DXB': 'Dubai', 'SIN': 'Singapore',
    'DEL': 'Delhi', 'LHR': 'London', 'JFK': 'New York', 'CGK': 'Jakarta',
    'KUL': 'Kuala Lumpur', 'HKG': 'Hong Kong', 'BOM': 'Mumbai', 'MCT': 'Muscat'
};

const airlines = {
    'BG': 'Biman Bangladesh', 'TG': 'Thai Airways', 'EK': 'Emirates',
    'SQ': 'Singapore Airlines', 'AI': 'Air India', 'BA': 'British Airways',
    'QR': 'Qatar Airways', 'MH': 'Malaysia Airlines'
};

const sampleFlights = [
    { id: 1, airline: 'BG', flight: '388', dep: 'DAC', arr: 'BKK', depTime: '1030', arrTime: '1430', aircraft: '738', classes: { Y:9, B:9, M:8, H:7, K:5 } },
    { id: 2, airline: 'BG', flight: '390', dep: 'DAC', arr: 'BKK', depTime: '1800', arrTime: '2130', aircraft: '738', classes: { Y:9, B:8, M:7, H:6, K:4 } },
    { id: 3, airline: 'TG', flight: '321', dep: 'DAC', arr: 'BKK', depTime: '0850', arrTime: '1230', aircraft: '333', classes: { Y:12, B:10, M:9, H:8 } },
    { id: 4, airline: 'EK', flight: '584', dep: 'DAC', arr: 'DXB', depTime: '2200', arrTime: '0130', aircraft: '77W', classes: { Y:15, B:12, M:10, H:8 } },
    { id: 5, airline: 'SQ', flight: '446', dep: 'DAC', arr: 'SIN', depTime: '0130', arrTime: '0730', aircraft: '77W', classes: { Y:9, B:8, M:7 } },
];

// State
function initState() {
    if (!localStorage.getItem('gdsSimulator')) {
        localStorage.setItem('gdsSimulator', JSON.stringify({
            pnr: null,
            history: []
        }));
    }
    const saved = JSON.parse(localStorage.getItem('gdsSimulator'));
    activePNR = saved.pnr;
}

// Terminal functions
const terminal = document.getElementById('terminal-output');
const input = document.getElementById('command-input');

function printLine(text, color = '#00ff00') {
    const line = document.createElement('div');
    line.style.color = color;
    line.textContent = text;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
}

function printHeader(text) {
    printLine('='.repeat(60), '#00ff88');
    printLine(text, '#ffff00');
    printLine('='.repeat(60), '#00ff88');
}

function clearTerminal() {
    terminal.innerHTML = '';
    printLine('GDS TRAINING SIMULATOR v1.0 - TRAINING ENVIRONMENT', '#88ff88');
    printLine('Type HELP for available commands.', '#66ff66');
}

// Command Parser
function parseAN(command) {
    const match = command.match(/^AN(\d{2})([A-Z]{3})(\d{2})([A-Z]{3})(?:\/([A-Z]{2}))?$/i);
    if (!match) return null;

    const [, day, month, , dest, airlineFilter] = match;
    const dateStr = `${day}${month.toUpperCase()}`;
    
    // Validate airports
    const origin = 'DAC'; // Default for training
    if (!airports[origin] || !airports[dest]) {
        return { error: 'CITY/AIRPORT CODE NOT FOUND' };
    }
    
    if (airlineFilter && !airlines[airlineFilter]) {
        return { error: 'AIRLINE CODE NOT FOUND' };
    }

    return {
        date: dateStr,
        origin,
        dest,
        airlineFilter: airlineFilter ? airlineFilter.toUpperCase() : null
    };
}

// Availability Engine
function showAvailability(parsed) {
    lastAvailability = [];
    printHeader(`AN${parsed.date}${parsed.origin}${parsed.dest}${parsed.airlineFilter ? '/' + parsed.airlineFilter : ''}`);
    
    let results = sampleFlights.filter(f => 
        f.dep === parsed.origin && 
        f.arr === parsed.dest &&
        (!parsed.airlineFilter || f.airline === parsed.airlineFilter)
    );

    if (results.length === 0) {
        printLine('NO FLIGHTS AVAILABLE', '#ff6666');
        return;
    }

    results.forEach((flight, index) => {
        lastAvailability.push(flight);
        let classStr = Object.entries(flight.classes)
            .map(([cls, seats]) => `${cls}${seats}`).join(' ');
        
        const line = `${(index+1).toString().padStart(2)} ${flight.airline}${flight.flight.padEnd(4)} ${classStr.padEnd(25)} ${flight.dep}${flight.arr} ${flight.depTime} ${flight.arrTime} ${flight.aircraft}`;
        printLine(line);
    });
    
    printLine('');
    printLine('** AVAILABILITY DISPLAYED **', '#ffff00');
}

// SS Command - Sell Segment
function sellSegment(cmd) {
    if (!lastAvailability || lastAvailability.length === 0) {
        printLine('NO AVAILABILITY TO SELL FROM. DO AN FIRST.', '#ff6666');
        return;
    }

    const match = cmd.match(/^SS(\d)([A-Z])(\d?)/i);
    if (!match) {
        printLine('INVALID SS FORMAT. USE: SS1Y1', '#ff6666');
        return;
    }

    const [, lineNum, bookingClass, paxCount] = match;
    const idx = parseInt(lineNum) - 1;
    const numPax = parseInt(paxCount) || 1;

    if (idx < 0 || idx >= lastAvailability.length) {
        printLine('SEGMENT NOT FOUND', '#ff6666');
        return;
    }

    const flight = lastAvailability[idx];
    if (!flight.classes[bookingClass]) {
        printLine(`CLASS ${bookingClass} NOT AVAILABLE`, '#ff6666');
        return;
    }

    if (flight.classes[bookingClass] < numPax) {
        printLine('INSUFFICIENT SEATS', '#ff6666');
        return;
    }

    // Reduce seats
    flight.classes[bookingClass] -= numPax;

    // Create PNR if not exists
    if (!activePNR) {
        activePNR = {
            recordLocator: generateRecordLocator(),
            passengers: [],
            itinerary: [],
            fare: 450,
            status: 'HK'
        };
    }

    activePNR.itinerary.push({
        ...flight,
        bookingClass,
        pax: numPax,
        status: 'HK'
    });

    printLine(`SS${lineNum}${bookingClass}${numPax} - SEGMENT ADDED TO PNR`, '#00ff88');
    saveState();
}

// Generate Record Locator
function generateRecordLocator() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let loc = '';
    for (let i = 0; i < 6; i++) {
        loc += chars[Math.floor(Math.random() * chars.length)];
    }
    return loc;
}

// PNR Display
function showPNR() {
    if (!activePNR) {
        printLine('NO ACTIVE PNR', '#ff6666');
        return;
    }

    printHeader(`RP/DAC1A0980/DAC1A0980 AA/SU ${new Date().toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'2-digit'}).replace(' ', '')}/1200Z`);

    printLine(`1.${activePNR.passengers.length > 0 ? activePNR.passengers[0].name : 'RAHIM/MR'}`);
    
    activePNR.itinerary.forEach((seg, i) => {
        printLine(`${i+1}. ${seg.airline}${seg.flight} ${seg.bookingClass} ${new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short'})} ${seg.dep}${seg.arr} HK${seg.pax} ${seg.depTime} ${seg.arrTime}`);
    });

    printLine('AP 017XXXXXXXX');
    printLine(`RF ${activePNR.passengers.length > 0 ? activePNR.passengers[0].name.split('/')[0] : 'RAHIM'}`);
    printLine('');
    printLine(`FARE: USD ${activePNR.fare}   PNR: ${activePNR.recordLocator}`, '#ffff00');
}

// NM - Name
function addPassenger(name) {
    if (!activePNR) activePNR = { recordLocator: generateRecordLocator(), passengers: [], itinerary: [], fare: 450, status: 'HK' };
    
    activePNR.passengers.push({ name: name.toUpperCase() });
    printLine(`NM ${name} - PASSENGER ADDED`, '#00ff88');
    saveState();
}

// Other Commands
function handleCommand(cmd) {
    const upperCmd = cmd.trim().toUpperCase();
    
    if (upperCmd === '') return;
    
    printLine(`> ${upperCmd}`, '#88ff88');
    
    // Availability
    if (upperCmd.startsWith('AN')) {
        const parsed = parseAN(upperCmd);
        if (parsed && parsed.error) {
            printLine(parsed.error, '#ff6666');
        } else if (parsed) {
            showAvailability(parsed);
        } else {
            printLine('INVALID FORMAT. EXAMPLE: AN10JUNDACBKK', '#ff6666');
        }
    }
    
    // Sell Segment
    else if (upperCmd.startsWith('SS')) {
        sellSegment(upperCmd);
    }
    
    // Retrieve PNR
    else if (upperCmd === 'RT') {
        showPNR();
    }
    
    // Name
    else if (upperCmd.startsWith('NM')) {
        const name = upperCmd.substring(2).trim();
        if (name) addPassenger(name);
        else printLine('INVALID NAME FORMAT', '#ff6666');
    }
    
    // Help
    else if (upperCmd === 'HELP') {
        printLine('AVAILABLE COMMANDS:');
        printLine('AN10JUNDACBKK     - Availability');
        printLine('SS1Y1             - Sell Y class from line 1');
        printLine('NMRAHIM/MR        - Add passenger');
        printLine('RT                - Display PNR');
        printLine('IG                - Ignore changes');
        printLine('IR                - Retrieve PNR');
        printLine('TTP               - Ticket PNR');
    }
    
    // IG - Ignore
    else if (upperCmd === 'IG') {
        printLine('IGNORING CHANGES - RESTORING PREVIOUS STATE', '#ffff00');
        activePNR = null;
        lastAvailability = null;
    }
    
    // IR - Retrieve
    else if (upperCmd === 'IR') {
        printLine('RETRIEVING SAVED PNR...', '#00ff88');
        const saved = JSON.parse(localStorage.getItem('gdsSimulator'));
        if (saved && saved.pnr) {
            activePNR = saved.pnr;
            showPNR();
        } else {
            printLine('NO SAVED PNR FOUND', '#ff6666');
        }
    }
    
    // TTP - Ticket
    else if (upperCmd === 'TTP') {
        if (!activePNR || activePNR.itinerary.length === 0) {
            printLine('NO ITINERARY TO TICKET', '#ff6666');
        } else {
            activePNR.ticketed = true;
            activePNR.ticketNumber = '125-' + Math.floor(100000000 + Math.random() * 900000000);
            printLine(`TICKET ISSUED: ${activePNR.ticketNumber}`, '#00ff88');
            saveState();
        }
    }
    
    else {
        printLine('COMMAND NOT RECOGNIZED', '#ff6666');
    }
    
    commandHistory.unshift(upperCmd);
    historyIndex = -1;
}

// Save to localStorage
function saveState() {
    localStorage.setItem('gdsSimulator', JSON.stringify({
        pnr: activePNR,
        history: commandHistory.slice(0, 50)
    }));
}

// PDF Ticket Generator
function printTicket() {
    if (!activePNR || !activePNR.ticketed) {
        alert("Please ticket the PNR first with TTP command.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFont("courier");
    doc.setFontSize(16);
    doc.text("ELECTRONIC TICKET", 105, 20, { align: "center" });
    
    doc.setFontSize(11);
    doc.text(`PNR: ${activePNR.recordLocator}`, 20, 40);
    doc.text(`TICKET #: ${activePNR.ticketNumber}`, 20, 48);
    doc.text(`ISSUE DATE: ${new Date().toLocaleDateString()}`, 20, 56);
    
    if (activePNR.passengers.length > 0) {
        doc.text(`PASSENGER: ${activePNR.passengers[0].name}`, 20, 70);
    }
    
    doc.text("ITINERARY:", 20, 85);
    
    let y = 95;
    activePNR.itinerary.forEach((seg, i) => {
        doc.text(`${i+1}. ${seg.airline}${seg.flight}  ${seg.dep}-${seg.arr}  ${seg.depTime}-${seg.arrTime}  ${seg.bookingClass}`, 25, y);
        y += 10;
    });
    
    doc.text(`TOTAL FARE: USD ${activePNR.fare}`, 20, y + 15);
    doc.text("Thank you for flying with us!", 105, y + 35, { align: "center" });
    
    doc.save(`ETicket_${activePNR.recordLocator}.pdf`);
}

// Input handling
input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const cmd = this.value.trim();
        if (cmd) {
            handleCommand(cmd);
        }
        this.value = '';
    }
    
    // History navigation
    else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (commandHistory.length > 0) {
            historyIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
            this.value = commandHistory[historyIndex];
        }
    }
    else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex > 0) {
            historyIndex--;
            this.value = commandHistory[historyIndex];
        } else {
            historyIndex = -1;
            this.value = '';
        }
    }
});

// Auto focus
setTimeout(() => {
    input.focus();
}, 500);

// Clock
function updateClock() {
    const timeEl = document.getElementById('current-time');
    setInterval(() => {
        const now = new Date();
        timeEl.textContent = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) + 'Z';
    }, 1000);
}

// Initialize
function init() {
    initState();
    clearTerminal();
    updateClock();
    
    // Welcome message
    printLine('WELCOME TO AMADEUS GDS TRAINING ENVIRONMENT', '#00ff88');
    printLine('SIMULATOR READY. TYPE HELP FOR COMMANDS.', '#66ff66');
    printLine('');
}

// Start
init();