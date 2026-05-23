// Sabre Terminal Simulator - Full Working Version
let currentPNR = null;
let segments = [];
let passengers = [];
let phones = [];
let receivedFrom = '';
let ticketNumber = null;
let sessionData = {
    pnr: null,
    segments: [],
    passengers: [],
    phones: [],
    receivedFrom: ''
};

// Mock flight data
const mockFlights = {
    'DACBKK': [
        { line: 1, flight: 'BG123', dep: 'DAC', arr: 'BKK', depTime: '10:30', arrTime: '14:45', date: '10JUN', cabin: 'Y', avail: '9' },
        { line: 2, flight: 'TG456', dep: 'DAC', arr: 'BKK', depTime: '23:15', arrTime: '03:40', date: '10JUN', cabin: 'Y', avail: '12' }
    ],
    'DACSIN': [
        { line: 1, flight: 'SQ321', dep: 'DAC', arr: 'SIN', depTime: '08:45', arrTime: '15:20', date: '15JUL', cabin: 'Y', avail: '8' }
    ],
    'DACDXB': [
        { line: 1, flight: 'EK512', dep: 'DAC', arr: 'DXB', depTime: '02:10', arrTime: '05:55', date: '20AUG', cabin: 'Y', avail: '15' }
    ]
};

function printToTerminal(text, isCommand = false) {
    const output = document.getElementById('output');
    const line = document.createElement('div');
    line.textContent = text;
    if (isCommand) {
        line.style.color = '#00cc00';
    }
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
}

function clearScreen() {
    document.getElementById('output').innerHTML = '';
    printToTerminal('*** SCREEN CLEARED ***');
}

function getCurrentDate() {
    const now = new Date();
    const options = { weekday: 'short', month: 'short', day: '2-digit' };
    return now.toLocaleDateString('en-US', options).toUpperCase();
}

function generatePNR() {
    return 'ABC' + Math.floor(100000 + Math.random() * 900000);
}

function parseAN(command) {
    const match = command.match(/^AN(\d{2})(\w{3})(\w{3})(\w{3})?\/?(.*)?$/i);
    if (!match) return null;
    
    const day = match[1];
    const month = match[2].toUpperCase();
    const origin = match[3].toUpperCase();
    const dest = match[4] ? match[4].toUpperCase() : '';
    const airline = match[5] ? match[5].toUpperCase() : '';
    
    return { day, month, origin, dest, airline };
}

function handleAN(command) {
    const parsed = parseAN(command);
    if (!parsed) {
        printToTerminal('FORMAT: AN10JUNDACBKK');
        return;
    }
    
    const key = parsed.origin + parsed.dest;
    const flights = mockFlights[key] || [];
    
    printToTerminal(`*** AVAILABILITY ${parsed.origin}-${parsed.dest} ${parsed.day}${parsed.month} ***`);
    
    if (flights.length === 0) {
        printToTerminal('NO FLIGHTS FOUND');
        return;
    }
    
    flights.forEach(f => {
        const line = `${f.line}. ${f.flight} ${f.dep}-${f.arr} ${f.depTime}-${f.arrTime} ${f.cabin}${f.avail}`;
        printToTerminal(line);
    });
}

function handleSS(command) {
    const match = command.match(/^SS(\d+)([A-Z])(\d+)$/i);
    if (!match) {
        printToTerminal('FORMAT: SS1Y1');
        return;
    }
    
    const lineNum = parseInt(match[1]);
    const cabin = match[2].toUpperCase();
    const qty = parseInt(match[3]);
    
    // Simulate selling from last availability
    if (segments.length >= 5) {
        printToTerminal('MAX SEGMENTS REACHED');
        return;
    }
    
    const segment = {
        id: segments.length + 1,
        line: lineNum,
        flight: 'BG123',
        origin: 'DAC',
        dest: 'BKK',
        date: '10JUN',
        dep: '1030',
        arr: '1445',
        status: 'HK',
        cabin: cabin,
        qty: qty
    };
    
    segments.push(segment);
    printToTerminal(`*** SEGMENT ${segment.id} ADDED ***`);
    printToTerminal(`${segment.id}. ${segment.flight} ${segment.origin}${segment.dest} ${segment.date} ${segment.dep}-${segment.arr} ${segment.cabin}${segment.qty} HK`);
}

function handleNM(command) {
    const match = command.match(/^NM(\d+)(.+?)\/(.+)$/i);
    if (!match) {
        printToTerminal('FORMAT: NM1RAHIM/MR');
        return;
    }
    
    const count = parseInt(match[1]);
    const lastName = match[2].trim();
    const title = match[3].trim();
    
    passengers.push({
        id: passengers.length + 1,
        name: `${lastName}/${title}`,
        count: count
    });
    
    printToTerminal(`*** PASSENGER ADDED ***`);
    printToTerminal(`${passengers.length}. ${lastName}/${title}`);
}

function handleAP(command) {
    const phone = command.substring(2).trim();
    if (!phone) {
        printToTerminal('FORMAT: AP01712345678');
        return;
    }
    
    phones.push(phone);
    printToTerminal(`*** PHONE ADDED: ${phone} ***`);
}

function handleRF(command) {
    receivedFrom = command.substring(2).trim();
    if (!receivedFrom) {
        printToTerminal('FORMAT: RF RAHIM');
        return;
    }
    printToTerminal(`*** RECEIVED FROM: ${receivedFrom} ***`);
}

function handleFQ() {
    if (segments.length === 0) {
        printToTerminal('NO SEGMENTS IN PNR');
        return;
    }
    
    printToTerminal('*** FARE QUOTE ***');
    let total = 450 * segments.length;
    printToTerminal(`BASE FARE: BDT ${total}`);
    printToTerminal('TAX: BDT 85');
    printToTerminal(`TOTAL: BDT ${total + 85}`);
}

function handleFXB() {
    printToTerminal('*** FARE STORED ***');
    printToTerminal('FXB SUCCESSFUL - PNR READY FOR TICKETING');
}

function handleRT() {
    if (!currentPNR) {
        printToTerminal('NO ACTIVE PNR');
        return;
    }
    
    printToTerminal(`*** RETRIEVE PNR ${currentPNR} ***`);
    printToTerminal('1. BG123 DACBKK 10JUN 1030-1445 HK');
    
    passengers.forEach(p => {
        printToTerminal(`${p.id}. ${p.name}`);
    });
}

function handleTTP() {
    if (segments.length === 0 || passengers.length === 0) {
        printToTerminal('PNR NOT COMPLETE FOR TICKETING');
        return;
    }
    
    ticketNumber = '125-' + Math.floor(10000000 + Math.random() * 90000000);
    currentPNR = currentPNR || generatePNR();
    
    printToTerminal('*** TICKET ISSUED SUCCESSFULLY ***');
    printToTerminal(`PNR: ${currentPNR}`);
    printToTerminal(`TKT: ${ticketNumber}`);
    printToTerminal('E-TICKET DELIVERED');
    
    // Save to session
    sessionData = {
        pnr: currentPNR,
        segments: [...segments],
        passengers: [...passengers],
        phones: [...phones],
        receivedFrom: receivedFrom
    };
    localStorage.setItem('sabreSession', JSON.stringify(sessionData));
}

function handleXE(command) {
    const num = parseInt(command.substring(2));
    if (isNaN(num) || num < 1 || num > segments.length) {
        printToTerminal('INVALID SEGMENT');
        return;
    }
    
    segments.splice(num-1, 1);
    printToTerminal(`*** SEGMENT ${num} CANCELLED ***`);
}

function handleCommand(cmd) {
    cmd = cmd.trim().toUpperCase();
    if (!cmd) return;
    
    printToTerminal(`> ${cmd}`, true);
    
    if (cmd === 'HELP') {
        printToTerminal('AVAILABLE: AN, SS, NM, AP, RF, FQ, FXB, RT, TTP, XE, TKTL');
    } else if (cmd.startsWith('AN')) {
        handleAN(cmd);
    } else if (cmd.startsWith('SS')) {
        handleSS(cmd);
    } else if (cmd.startsWith('NM')) {
        handleNM(cmd);
    } else if (cmd.startsWith('AP')) {
        handleAP(cmd);
    } else if (cmd.startsWith('RF')) {
        handleRF(cmd);
    } else if (cmd === 'FQ' || cmd === 'FXD') {
        handleFQ();
    } else if (cmd === 'FXB') {
        handleFXB();
    } else if (cmd === 'RT') {
        handleRT();
    } else if (cmd === 'TTP') {
        handleTTP();
    } else if (cmd.startsWith('XE')) {
        handleXE(cmd);
    } else if (cmd === 'TKTL20JUN') {
        printToTerminal('*** TICKET TIME LIMIT SET TO 20JUN ***');
    } else {
        printToTerminal('COMMAND NOT RECOGNIZED');
    }
}

function printTicket() {
    if (!ticketNumber) {
        alert('No ticket issued yet. Use TTP command first.');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('AIRLINE E-TICKET', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`PNR: ${currentPNR || 'ABC123456'}`, 20, 40);
    doc.text(`TICKET: ${ticketNumber}`, 20, 50);
    
    doc.text('PASSENGER:', 20, 70);
    passengers.forEach((p, i) => {
        doc.text(`${i+1}. ${p.name}`, 30, 80 + i*10);
    });
    
    doc.text('ITINERARY:', 20, 120);
    segments.forEach((s, i) => {
        doc.text(`${i+1}. ${s.flight} ${s.origin}-${s.dest} ${s.date} ${s.dep}-${s.arr}`, 30, 130 + i*10);
    });
    
    doc.text('TOTAL FARE: BDT ' + (450 * segments.length + 85), 20, 190);
    doc.text('THANK YOU FOR FLYING WITH US!', 105, 220, { align: 'center' });
    
    doc.save(`ticket_${currentPNR || 'demo'}.pdf`);
    printToTerminal('*** PDF TICKET DOWNLOADED ***');
}

function saveSession() {
    sessionData = {
        pnr: currentPNR,
        segments: [...segments],
        passengers: [...passengers],
        phones: [...phones],
        receivedFrom: receivedFrom
    };
    localStorage.setItem('sabreSession', JSON.stringify(sessionData));
    printToTerminal('*** SESSION SAVED ***');
}

function loadSession() {
    const saved = localStorage.getItem('sabreSession');
    if (saved) {
        sessionData = JSON.parse(saved);
        currentPNR = sessionData.pnr;
        segments = sessionData.segments || [];
        passengers = sessionData.passengers || [];
        phones = sessionData.phones || [];
        receivedFrom = sessionData.receivedFrom || '';
        
        printToTerminal('*** SESSION LOADED ***');
        handleRT();
    } else {
        printToTerminal('NO SAVED SESSION');
    }
}

function endSession() {
    if (confirm('End current session?')) {
        localStorage.removeItem('sabreSession');
        currentPNR = null;
        segments = [];
        passengers = [];
        phones = [];
        receivedFrom = '';
        ticketNumber = null;
        printToTerminal('*** SESSION ENDED ***');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('current-date').textContent = getCurrentDate();
    
    const input = document.getElementById('command-input');
    
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const cmd = input.value.trim();
            if (cmd) {
                handleCommand(cmd);
                input.value = '';
            }
        }
    });
    
    // Welcome
    printToTerminal('*** SABRE CRS SIMULATOR v2.1 ***');
    printToTerminal('CONNECTED TO DAC01 - ' + new Date().toLocaleTimeString());
    printToTerminal('TYPE HELP FOR COMMANDS');
    printToTerminal('------------------------------');
    
    // Auto demo sequence
    setTimeout(() => {
        printToTerminal('Try: AN10JUNDACBKK');
    }, 800);
});