// AMADEUS AIRLINE RESERVATION TERMINAL SIMULATOR
// Complete functional implementation with all required commands

// ============ DATA STRUCTURES ============

const AIRPORTS = {
    DAC: { name: 'Dhaka Hazrat Shahjalal', country: 'Bangladesh', timezone: 'UTC+6' },
    BKK: { name: 'Bangkok Suvarnabhumi', country: 'Thailand', timezone: 'UTC+7' },
    SIN: { name: 'Singapore Changi', country: 'Singapore', timezone: 'UTC+8' },
    KUL: { name: 'Kuala Lumpur International', country: 'Malaysia', timezone: 'UTC+8' },
    DXB: { name: 'Dubai International', country: 'UAE', timezone: 'UTC+4' },
    DOH: { name: 'Doha Hamad International', country: 'Qatar', timezone: 'UTC+3' },
    CGP: { name: 'Chittagong International', country: 'Bangladesh', timezone: 'UTC+6' },
    DEL: { name: 'Delhi Indira Gandhi', country: 'India', timezone: 'UTC+5:30' },
    CCU: { name: 'Kolkata Netaji Subhas', country: 'India', timezone: 'UTC+5:30' },
    KTM: { name: 'Kathmandu Tribhuvan', country: 'Nepal', timezone: 'UTC+5:45' },
    HKG: { name: 'Hong Kong International', country: 'Hong Kong', timezone: 'UTC+8' },
    NRT: { name: 'Tokyo Narita', country: 'Japan', timezone: 'UTC+9' },
    ICN: { name: 'Seoul Incheon', country: 'South Korea', timezone: 'UTC+9' },
    CAN: { name: 'Guangzhou Baiyun', country: 'China', timezone: 'UTC+8' },
    IST: { name: 'Istanbul Airport', country: 'Turkey', timezone: 'UTC+3' },
    LHR: { name: 'London Heathrow', country: 'United Kingdom', timezone: 'UTC+0' },
    JFK: { name: 'New York JFK', country: 'USA', timezone: 'UTC-5' },
    FCO: { name: 'Rome Fiumicino', country: 'Italy', timezone: 'UTC+1' },
    SYD: { name: 'Sydney International', country: 'Australia', timezone: 'UTC+10' },
    MEL: { name: 'Melbourne Tullamarine', country: 'Australia', timezone: 'UTC+10' },
    DMM: { name: 'Dammam King Fahd', country: 'Saudi Arabia', timezone: 'UTC+3' },
    MCT: { name: 'Muscat International', country: 'Oman', timezone: 'UTC+4' },
    AUH: { name: 'Abu Dhabi International', country: 'UAE', timezone: 'UTC+4' },
    CMB: { name: 'Colombo Bandaranaike', country: 'Sri Lanka', timezone: 'UTC+5:30' },
    BJS: { name: 'Beijing Capital', country: 'China', timezone: 'UTC+8' },
    SHA: { name: 'Shanghai Pudong', country: 'China', timezone: 'UTC+8' },
};

const AIRLINES = {
    BG: { name: 'Biman Bangladesh Airlines', iata: 'BG', aircraft: '787' },
    EK: { name: 'Emirates', iata: 'EK', aircraft: '777' },
    QR: { name: 'Qatar Airways', iata: 'QR', aircraft: '787' },
    SQ: { name: 'Singapore Airlines', iata: 'SQ', aircraft: '787' },
    TG: { name: 'Thai Airways International', iata: 'TG', aircraft: '777' },
    MH: { name: 'Malaysia Airlines', iata: 'MH', aircraft: '737' },
    AI: { name: 'Air India', iata: 'AI', aircraft: '777' },
    UK: { name: 'Vistara', iata: 'UK', aircraft: '787' },
    '6E': { name: 'IndiGo', iata: '6E', aircraft: 'A320' },
    G9: { name: 'Air Arabia', iata: 'G9', aircraft: 'A320' },
    FZ: { name: 'FlyDubai', iata: 'FZ', aircraft: '737' },
    WY: { name: 'Oman Air', iata: 'WY', aircraft: '787' },
    SV: { name: 'Saudia', iata: 'SV', aircraft: '777' },
    KU: { name: 'Kuwait Airways', iata: 'KU', aircraft: '777' },
    CX: { name: 'Cathay Pacific', iata: 'CX', aircraft: '777' },
    JL: { name: 'Japan Airlines', iata: 'JL', aircraft: '787' },
    NH: { name: 'All Nippon Airways', iata: 'NH', aircraft: '787' },
    KE: { name: 'Korean Air', iata: 'KE', aircraft: '777' },
    TK: { name: 'Turkish Airlines', iata: 'TK', aircraft: '787' },
    BA: { name: 'British Airways', iata: 'BA', aircraft: '777' },
    QF: { name: 'Qantas Airways', iata: 'QF', aircraft: '787' },
    EY: { name: 'Etihad Airways', iata: 'EY', aircraft: '787' },
    UL: { name: 'SriLankan Airlines', iata: 'UL', aircraft: '737' },
    GF: { name: 'Gulf Air', iata: 'GF', aircraft: '787' },
    PR: { name: 'Philippine Airlines', iata: 'PR', aircraft: '777' },
    CA: { name: 'Air China', iata: 'CA', aircraft: '777' },
    CI: { name: 'China Airlines', iata: 'CI', aircraft: '787' },
    MU: { name: 'China Eastern', iata: 'MU', aircraft: '737' },
};

const BOOKING_CLASSES = ['Y', 'B', 'M', 'K', 'H', 'L', 'V', 'Q', 'N', 'S'];

const MONTH_MAP = {
    JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
    JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
};

// ============ SESSION STATE ============

let session = {
    pnr: null,
    passengers: [],
    segments: [],
    receivedFrom: null,
    phoneNumbers: [],
    ticketNumber: null,
    lastFareData: null,
    lastAvailability: null,
};

// ============ DOM ELEMENTS ============

const terminal = document.getElementById('terminal');
const commandInput = document.getElementById('commandInput');
const sessionStatus = document.getElementById('sessionStatus');

// ============ UTILITY FUNCTIONS ============

function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}/${hours}${minutes}${seconds}`;
}

function generatePNR() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pnr = '';
    for (let i = 0; i < 6; i++) {
        pnr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pnr;
}

function generateFlightNumber(airlineCode) {
    const num = Math.floor(Math.random() * 900) + 100;
    return `${airlineCode}${num}`;
}

function formatDate(dateStr) {
    // Input: DDMONTHYY or DDMONTHYYYY
    const match = dateStr.match(/^(\d{2})([A-Z]{3})(\d{2,4})$/);
    if (!match) return null;
    const day = match[1];
    const month = MONTH_MAP[match[2]];
    let year = match[3];
    if (year.length === 2) {
        year = parseInt(year) > 50 ? '19' + year : '20' + year;
    }
    return `${year}-${month}-${day}`;
}

function getAirlineName(code) {
    return AIRLINES[code]?.name || 'UNKNOWN';
}

function addTerminalLine(text, type = 'text') {
    const line = document.createElement('div');
    line.className = 'terminal-line';
    
    const span = document.createElement('span');
    if (type === 'command') {
        const prompt = document.createElement('span');
        prompt.className = 'prompt';
        prompt.textContent = '>';
        line.appendChild(prompt);
        span.className = 'text';
        span.textContent = text;
    } else if (type === 'error') {
        const errorSymbol = document.createElement('span');
        errorSymbol.className = 'error';
        errorSymbol.textContent = '?';
        line.appendChild(errorSymbol);
        span.className = 'text';
        span.textContent = ' ' + text;
    } else if (type === 'success') {
        const tick = document.createElement('span');
        tick.className = 'success';
        tick.textContent = '*';
        line.appendChild(tick);
        span.className = 'text';
        span.textContent = ' ' + text;
    } else if (type === 'data') {
        span.className = 'data';
        span.textContent = text;
    } else {
        span.className = 'text';
        span.textContent = text;
    }
    
    line.appendChild(span);
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
}

function addBlankLine() {
    addTerminalLine('');
}

function getSessionTime() {
    return getCurrentDateTime();
}

function saveSessionToStorage() {
    localStorage.setItem('amadeus_session', JSON.stringify(session));
}

function loadSessionFromStorage() {
    const stored = localStorage.getItem('amadeus_session');
    if (stored) {
        try {
            session = JSON.parse(stored);
        } catch (e) {
            console.error('Failed to load session', e);
        }
    }
}

// ============ FLIGHT GENERATION ============

function generateFlights(origin, destination, date, filter = null) {
    const flights = [];
    const airlineCodes = Object.keys(AIRLINES);
    
    const today = new Date();
    const daysToAdd = Math.floor(Math.random() * 7);
    
    for (let i = 0; i < 7; i++) {
        let airline;
        if (filter) {
            airline = filter;
        } else {
            airline = airlineCodes[Math.floor(Math.random() * airlineCodes.length)];
        }
        
        const flightNum = generateFlightNumber(airline);
        const depHour = String(Math.floor(Math.random() * 24)).padStart(2, '0');
        const depMin = String(Math.floor(Math.random() * 60)).padStart(2, '0');
        const flightTime = Math.floor(Math.random() * 8) + 2;
        const arrHour = String((parseInt(depHour) + flightTime) % 24).padStart(2, '0');
        const arrMin = depMin;
        
        const classes = {};
        BOOKING_CLASSES.forEach(cls => {
            classes[cls] = Math.floor(Math.random() * 9) + 1;
        });
        
        flights.push({
            airline: airline,
            flightNum: flightNum,
            departure: `${depHour}${depMin}`,
            arrival: `${arrHour}${arrMin}`,
            origin: origin,
            destination: destination,
            date: date,
            aircraft: AIRLINES[airline].aircraft,
            classes: classes,
        });
    }
    
    return flights;
}

// ============ PARSE COMMANDS ============

function parseANCommand(input) {
    // Patterns:
    // AN10JUNDACBKK
    // AN15JUL26DACSIN
    // AN20AUG27DACDXB/AEK
    // AN01JAN27DACDMM/ABG
    // AN25JUN26DACBKK/ATG
    // AN10DECDACDOH/AQR
    
    const pattern = /^AN(\d{2})([A-Z]{3})(\d{0,2})([A-Z]{3})([A-Z]{3})(?:\/([A-Z0-9]{2}))?$/;
    const match = input.match(pattern);
    
    if (!match) return null;
    
    const day = match[1];
    const month = match[2];
    const year = match[3];
    const origin = match[4];
    const destination = match[5];
    const airlineFilter = match[6] || null;
    
    // Determine year
    let fullYear;
    if (!year) {
        fullYear = new Date().getFullYear();
    } else {
        fullYear = parseInt(year) > 50 ? '19' + year : '20' + year;
    }
    
    const dateStr = `${day}${month}${fullYear}`;
    const formattedDate = formatDate(`${day}${month}${fullYear.slice(-2)}`);
    
    return {
        command: 'AN',
        day: day,
        month: month,
        year: fullYear,
        dateStr: dateStr,
        formattedDate: formattedDate,
        origin: origin,
        destination: destination,
        airlineFilter: airlineFilter,
    };
}

function parseSSCommand(input) {
    // SS1Y1 or SS2M1 or SS3B2
    const pattern = /^SS(\d+)([A-Z])(\d+)$/;
    const match = input.match(pattern);
    if (!match) return null;
    
    return {
        command: 'SS',
        segmentNum: parseInt(match[1]),
        bookingClass: match[2],
        quantity: parseInt(match[3]),
    };
}

function parseNMCommand(input) {
    // NM1RAHIM/MR or NM1RAHIM/MR+KARIM/MRS or NM2BALAKRISHNAN/AMINMR
    const pattern = /^NM(\d+)(.+)$/;
    const match = input.match(pattern);
    if (!match) return null;
    
    const paxNum = parseInt(match[1]);
    const nameStr = match[2];
    const names = nameStr.split('+');
    
    const passengers = names.map(n => {
        const parts = n.split('/');
        const lastName = parts[0];
        const title = parts[1] || 'MR';
        return { lastName, title };
    });
    
    return {
        command: 'NM',
        paxNum: paxNum,
        passengers: passengers,
    };
}

function parseAPCommand(input) {
    // AP017XXXXXXXX or AP88017XXXXXXXX-H
    const pattern = /^AP(\d+)(.+?)(?:-(.+))?$/;
    const match = input.match(pattern);
    if (!match) return null;
    
    return {
        command: 'AP',
        paxNum: parseInt(match[1]),
        phone: match[2],
        type: match[3] || 'B',
    };
}

function parseRFCommand(input) {
    // RFRAHIM or RFBALAKRISHNAN
    const pattern = /^RF(.+)$/;
    const match = input.match(pattern);
    if (!match) return null;
    
    return {
        command: 'RF',
        name: match[1],
    };
}

function parseXECommand(input) {
    // XE1 or XE2
    const pattern = /^XE(\d+)$/;
    const match = input.match(pattern);
    if (!match) return null;
    
    return {
        command: 'XE',
        segmentNum: parseInt(match[1]),
    };
}

function parseFQCommand(input) {
    return { command: 'FQ' };
}

function parseFXDCommand(input) {
    return { command: 'FXD' };
}

function parseFXBCommand(input) {
    return { command: 'FXB' };
}

function parseFXXCommand(input) {
    return { command: 'FXX' };
}

function parseFXRCommand(input) {
    return { command: 'FXR' };
}

function parseFXPCommand(input) {
    return { command: 'FXP' };
}

function parseRTCommand(input) {
    // RTPNR or RTHELLX
    const pattern = /^RT(.+)$/;
    const match = input.match(pattern);
    if (!match) return null;
    
    return {
        command: 'RT',
        pnr: match[1],
    };
}

function parseERCommand(input) {
    return { command: 'ER' };
}

function parseETCommand(input) {
    return { command: 'ET' };
}

function parseIGCommand(input) {
    return { command: 'IG' };
}

function parseIRCommand(input) {
    return { command: 'IR' };
}

function parseTTPCommand(input) {
    // TKTL20JUN or TKOK
    const pattern = /^T[KT](.+)$/;
    const match = input.match(pattern);
    if (!match) return null;
    
    return {
        command: 'TTP',
        data: match[1],
    };
}

function parseTTRCommand(input) {
    return { command: 'TTR' };
}

// ============ COMMAND HANDLERS ============

function handleAN(parsed) {
    const { origin, destination, dateStr, formattedDate, airlineFilter } = parsed;
    
    // Validate airports
    if (!AIRPORTS[origin] || !AIRPORTS[destination]) {
        addTerminalLine('INVALID AIRPORT CODE', 'error');
        return;
    }
    
    // Validate airline filter if present
    if (airlineFilter && !AIRLINES[airlineFilter]) {
        addTerminalLine('INVALID AIRLINE CODE', 'error');
        return;
    }
    
    // Generate flights
    const flights = generateFlights(origin, destination, dateStr, airlineFilter);
    
    addTerminalLine(`${parsed.day}${parsed.month}${parsed.year} ${AIRPORTS[origin].name} TO ${AIRPORTS[destination].name}`);
    addBlankLine();
    
    flights.forEach((flight, index) => {
        const classStr = Object.entries(flight.classes)
            .map(([cls, count]) => `${cls}${count}`)
            .join(' ');
        
        const line = `${index + 1} ${flight.airline}${flight.flightNum} ${classStr} ${origin} ${destination}`;
        addTerminalLine(line, 'data');
    });
    
    addBlankLine();
    session.lastAvailability = flights;
    saveSessionToStorage();
}

function handleSS(parsed) {
    const { segmentNum, bookingClass, quantity } = parsed;
    
    if (!session.lastAvailability || session.lastAvailability.length === 0) {
        addTerminalLine('NO ACTIVE AVAILABILITY', 'error');
        return;
    }
    
    if (segmentNum > session.lastAvailability.length) {
        addTerminalLine('INVALID SEGMENT', 'error');
        return;
    }
    
    const flight = session.lastAvailability[segmentNum - 1];
    
    if (!flight.classes[bookingClass] || flight.classes[bookingClass] === 0) {
        addTerminalLine('CLASS CLOSED', 'error');
        return;
    }
    
    if (flight.classes[bookingClass] < quantity) {
        addTerminalLine('INSUFFICIENT SEATS', 'error');
        return;
    }
    
    // Generate PNR if not exists
    if (!session.pnr) {
        session.pnr = generatePNR();
    }
    
    // Create segment
    const segment = {
        airline: flight.airline,
        flightNum: flight.flightNum,
        departure: flight.departure,
        arrival: flight.arrival,
        origin: flight.origin,
        destination: flight.destination,
        date: flight.date,
        bookingClass: bookingClass,
        quantity: quantity,
        status: 'OK',
    };
    
    session.segments.push(segment);
    saveSessionToStorage();
    
    addTerminalLine(`SOLD ${flight.airline}${flight.flightNum} ${bookingClass}${quantity} ${segment.origin}-${segment.destination}`, 'success');
    addTerminalLine(`PNR: ${session.pnr}`, 'data');
    addBlankLine();
}

function handleNM(parsed) {
    const { paxNum, passengers } = parsed;
    
    if (!session.pnr) {
        session.pnr = generatePNR();
    }
    
    passengers.forEach((pax, index) => {
        const passenger = {
            number: paxNum + index,
            lastName: pax.lastName,
            title: pax.title,
            firstName: '',
        };
        
        session.passengers.push(passenger);
    });
    
    saveSessionToStorage();
    
    addTerminalLine(`PASSENGER ${paxNum} ${passengers.map(p => `${p.lastName}/${p.title}`).join(' ')} ADDED`, 'success');
    addTerminalLine(`PNR: ${session.pnr}`, 'data');
    addBlankLine();
}

function handleAP(parsed) {
    const { paxNum, phone, type } = parsed;
    
    const phoneEntry = {
        paxNum: paxNum,
        number: phone,
        type: type,
    };
    
    session.phoneNumbers.push(phoneEntry);
    saveSessionToStorage();
    
    addTerminalLine(`PHONE ${type} ${phone} ADDED FOR PAX ${paxNum}`, 'success');
    addBlankLine();
}

function handleRF(parsed) {
    const { name } = parsed;
    session.receivedFrom = name;
    saveSessionToStorage();
    
    addTerminalLine(`RECEIVED FROM: ${name}`, 'success');
    addBlankLine();
}

function handleXE(parsed) {
    const { segmentNum } = parsed;
    
    if (segmentNum > session.segments.length) {
        addTerminalLine('INVALID SEGMENT', 'error');
        return;
    }
    
    const deleted = session.segments.splice(segmentNum - 1, 1)[0];
    saveSessionToStorage();
    
    addTerminalLine(`SEGMENT ${segmentNum} ${deleted.airline}${deleted.flightNum} DELETED`, 'success');
    addBlankLine();
}

function handleFQ(parsed) {
    if (session.segments.length === 0) {
        addTerminalLine('NO SEGMENTS IN PNR', 'error');
        return;
    }
    
    if (!session.passengers.length) {
        addTerminalLine('NO PASSENGERS IN PNR', 'error');
        return;
    }
    
    addTerminalLine(`FARE QUOTE FOR PNR: ${session.pnr}`);
    addBlankLine();
    
    const baseFare = Math.floor(Math.random() * 500) + 200;
    const tax = Math.floor(baseFare * 0.15);
    const total = baseFare + tax;
    
    session.passengers.forEach((pax, index) => {
        addTerminalLine(`${pax.number} ${pax.lastName}/${pax.title} BASE FARE: ${baseFare} TAX: ${tax} TOTAL: ${total}`, 'data');
    });
    
    addBlankLine();
    session.lastFareData = { baseFare, tax, total };
    saveSessionToStorage();
}

function handleFXD(parsed) {
    if (!session.lastFareData) {
        addTerminalLine('NO FARE DATA', 'error');
        return;
    }
    
    addTerminalLine(`FARE DISPLAY`);
    addBlankLine();
    addTerminalLine(`BASE FARE: ${session.lastFareData.baseFare}`, 'data');
    addTerminalLine(`TAX: ${session.lastFareData.tax}`, 'data');
    addTerminalLine(`TOTAL: ${session.lastFareData.total}`, 'data');
    addBlankLine();
}

function handleFXB(parsed) {
    if (session.segments.length === 0) {
        addTerminalLine('NO SEGMENTS', 'error');
        return;
    }
    
    const baseFare = Math.floor(Math.random() * 400) + 150;
    const discountPercent = Math.floor(Math.random() * 20) + 5;
    const discount = Math.floor(baseFare * discountPercent / 100);
    const netFare = baseFare - discount;
    const tax = Math.floor(netFare * 0.15);
    const total = netFare + tax;
    
    addTerminalLine(`BEST FARE PRICING`);
    addBlankLine();
    addTerminalLine(`BASE FARE: ${baseFare}`, 'data');
    addTerminalLine(`DISCOUNT: ${discount} (${discountPercent}%)`, 'data');
    addTerminalLine(`NET FARE: ${netFare}`, 'data');
    addTerminalLine(`TAX: ${tax}`, 'data');
    addTerminalLine(`TOTAL: ${total}`, 'data');
    addBlankLine();
    
    session.lastFareData = { baseFare: netFare, tax, total };
    saveSessionToStorage();
}

function handleFXX(parsed) {
    if (session.segments.length === 0) {
        addTerminalLine('NO SEGMENTS TO REPRICE', 'error');
        return;
    }
    
    addTerminalLine(`REPRICING ITINERARY...`);
    addBlankLine();
    
    const baseFare = Math.floor(Math.random() * 450) + 200;
    const tax = Math.floor(baseFare * 0.12);
    const total = baseFare + tax;
    
    addTerminalLine(`NEW BASE FARE: ${baseFare}`, 'data');
    addTerminalLine(`NEW TAX: ${tax}`, 'data');
    addTerminalLine(`NEW TOTAL: ${total}`, 'data');
    addBlankLine();
    
    session.lastFareData = { baseFare, tax, total };
    saveSessionToStorage();
}

function handleFXR(parsed) {
    addTerminalLine(`FARE RULES`);
    addBlankLine();
    addTerminalLine(`- NON REFUNDABLE`, 'data');
    addTerminalLine(`- NON CHANGEABLE WITHOUT FEE`, 'data');
    addTerminalLine(`- VALID FOR 1 YEAR FROM BOOKING`, 'data');
    addTerminalLine(`- BAGGAGE: 2X23KG + 1X7KG`, 'data');
    addBlankLine();
}

function handleFXP(parsed) {
    if (!session.lastFareData) {
        addTerminalLine('NO FARE DATA', 'error');
        return;
    }
    
    addTerminalLine(`CONFIRMING FARE PRICING...`, 'success');
    addBlankLine();
    addTerminalLine(`TOTAL FARE: ${session.lastFareData.total}`, 'data');
    addTerminalLine(`FARE LOCKED`, 'success');
    addBlankLine();
}

function handleRT(parsed) {
    const { pnr } = parsed;
    
    // Simulate retrieval
    addTerminalLine(`RETRIEVING PNR: ${pnr}`);
    addBlankLine();
    
    if (session.pnr === pnr) {
        addTerminalLine(`PNR: ${session.pnr}`, 'data');
        addTerminalLine(`PASSENGERS: ${session.passengers.length}`, 'data');
        addTerminalLine(`SEGMENTS: ${session.segments.length}`, 'data');
        
        if (session.passengers.length > 0) {
            addBlankLine();
            addTerminalLine(`PASSENGER LIST:`, 'data');
            session.passengers.forEach(pax => {
                addTerminalLine(`  ${pax.number}. ${pax.lastName}/${pax.title}`, 'data');
            });
        }
        
        if (session.segments.length > 0) {
            addBlankLine();
            addTerminalLine(`ITINERARY:`, 'data');
            session.segments.forEach((seg, index) => {
                addTerminalLine(`  ${index + 1}. ${seg.airline}${seg.flightNum} ${seg.origin}-${seg.destination} ${seg.bookingClass}`, 'data');
            });
        }
    } else {
        addTerminalLine('PNR NOT FOUND', 'error');
    }
    
    addBlankLine();
}

function handleER(parsed) {
    if (!session.pnr) {
        addTerminalLine('NO ACTIVE PNR', 'error');
        return;
    }
    
    if (session.segments.length === 0) {
        addTerminalLine('NO SEGMENTS IN PNR', 'error');
        return;
    }
    
    if (!session.receivedFrom) {
        addTerminalLine('NEED RECEIVED FROM', 'error');
        return;
    }
    
    addTerminalLine(`ENDING PNR: ${session.pnr}`, 'success');
    addTerminalLine(`RECEIVED FROM: ${session.receivedFrom}`, 'data');
    addTerminalLine(`TIME: ${getSessionTime()}`, 'data');
    addBlankLine();
    
    saveSessionToStorage();
}

function handleET(parsed) {
    if (!session.pnr) {
        addTerminalLine('NO ACTIVE PNR', 'error');
        return;
    }
    
    addTerminalLine(`TRANSACTION ENDED`, 'success');
    addTerminalLine(`PNR: ${session.pnr}`, 'data');
    addTerminalLine(`TIME: ${getSessionTime()}`, 'data');
    addBlankLine();
}

function handleIG(parsed) {
    addTerminalLine(`SESSION IGNORED`, 'warning');
    session = {
        pnr: null,
        passengers: [],
        segments: [],
        receivedFrom: null,
        phoneNumbers: [],
        ticketNumber: null,
        lastFareData: null,
        lastAvailability: null,
    };
    localStorage.removeItem('amadeus_session');
    addBlankLine();
}

function handleIR(parsed) {
    addTerminalLine(`IGNORING AND RETRIEVING...`);
    addBlankLine();
    
    session = {
        pnr: null,
        passengers: [],
        segments: [],
        receivedFrom: null,
        phoneNumbers: [],
        ticketNumber: null,
        lastFareData: null,
        lastAvailability: null,
    };
    localStorage.removeItem('amadeus_session');
    
    addTerminalLine(`READY FOR NEW BOOKING`, 'success');
    addBlankLine();
}

function handleTTP(parsed) {
    if (!session.pnr) {
        addTerminalLine('NO ACTIVE PNR', 'error');
        return;
    }
    
    if (session.segments.length === 0) {
        addTerminalLine('NO SEGMENTS', 'error');
        return;
    }
    
    if (session.passengers.length === 0) {
        addTerminalLine('NO PASSENGERS', 'error');
        return;
    }
    
    // Generate ticket
    const ticketNum = `00` + Math.floor(Math.random() * 1000000).toString().padStart(8, '0');
    session.ticketNumber = ticketNum;
    
    addTerminalLine(`ISSUING TICKET...`, 'success');
    addBlankLine();
    addTerminalLine(`TICKET: ${ticketNum}`, 'data');
    addTerminalLine(`PNR: ${session.pnr}`, 'data');
    addTerminalLine(`ISSUED: ${getSessionTime()}`, 'data');
    addBlankLine();
    
    saveSessionToStorage();
}

function handleTTR(parsed) {
    if (!session.ticketNumber) {
        addTerminalLine('NO TICKET ISSUED', 'error');
        return;
    }
    
    addTerminalLine(`PRINTING TICKET: ${session.ticketNumber}`, 'success');
    addBlankLine();
    addTerminalLine(`>> TICKET PRINT REQUEST SENT TO PRINTER`, 'data');
    addBlankLine();
}

function handleHelp() {
    addTerminalLine(`AMADEUS COMMAND REFERENCE`);
    addBlankLine();
    addTerminalLine(`AVAILABILITY: AN10JUNDACBKK`, 'data');
    addTerminalLine(`SELL SEGMENT: SS1Y1`, 'data');
    addTerminalLine(`NAME PASSENGER: NM1RAHIM/MR`, 'data');
    addTerminalLine(`ADD PHONE: AP017XXXXXXXX`, 'data');
    addTerminalLine(`RECEIVED FROM: RFRAHIM`, 'data');
    addTerminalLine(`DELETE SEGMENT: XE1`, 'data');
    addTerminalLine(`FARE QUOTE: FQ`, 'data');
    addTerminalLine(`FARE DISPLAY: FXD`, 'data');
    addTerminalLine(`BEST FARE: FXB`, 'data');
    addTerminalLine(`REPRICE: FXX`, 'data');
    addTerminalLine(`FARE RULES: FXR`, 'data');
    addTerminalLine(`CONFIRM PRICE: FXP`, 'data');
    addTerminalLine(`TICKET: TTP`, 'data');
    addTerminalLine(`PRINT TICKET: TTR`, 'data');
    addTerminalLine(`RETRIEVE PNR: RTPNR`, 'data');
    addTerminalLine(`END & RETRIEVE: ER`, 'data');
    addTerminalLine(`END TRANSACTION: ET`, 'data');
    addTerminalLine(`IGNORE: IG`, 'data');
    addTerminalLine(`IGNORE & RETRIEVE: IR`, 'data');
    addBlankLine();
}

function handleInvalidCommand(input) {
    addTerminalLine(`INVALID COMMAND: ${input}`, 'error');
    addTerminalLine(`TYPE 'HELP' FOR COMMAND LIST`, 'error');
    addBlankLine();
}

// ============ MAIN COMMAND PROCESSOR ============

function processCommand(input) {
    const cmd = input.toUpperCase().trim();
    
    // Add command to terminal
    addTerminalLine(cmd, 'command');
    
    if (!cmd) {
        addBlankLine();
        return;
    }
    
    // Parse and execute
    if (cmd.startsWith('AN')) {
        const parsed = parseANCommand(cmd);
        if (parsed) {
            handleAN(parsed);
        } else {
            handleInvalidCommand(cmd);
        }
    } else if (cmd.startsWith('SS')) {
        const parsed = parseSSCommand(cmd);
        if (parsed) {
            handleSS(parsed);
        } else {
            handleInvalidCommand(cmd);
        }
    } else if (cmd.startsWith('NM')) {
        const parsed = parseNMCommand(cmd);
        if (parsed) {
            handleNM(parsed);
        } else {
            handleInvalidCommand(cmd);
        }
    } else if (cmd.startsWith('AP')) {
        const parsed = parseAPCommand(cmd);
        if (parsed) {
            handleAP(parsed);
        } else {
            handleInvalidCommand(cmd);
        }
    } else if (cmd.startsWith('RF')) {
        const parsed = parseRFCommand(cmd);
        if (parsed) {
            handleRF(parsed);
        } else {
            handleInvalidCommand(cmd);
        }
    } else if (cmd.startsWith('XE')) {
        const parsed = parseXECommand(cmd);
        if (parsed) {
            handleXE(parsed);
        } else {
            handleInvalidCommand(cmd);
        }
    } else if (cmd.startsWith('FXB')) {
        const parsed = parseFXBCommand(cmd);
        handleFXB(parsed);
    } else if (cmd.startsWith('FXX')) {
        const parsed = parseFXXCommand(cmd);
        handleFXX(parsed);
    } else if (cmd.startsWith('FXR')) {
        const parsed = parseFXRCommand(cmd);
        handleFXR(parsed);
    } else if (cmd.startsWith('FXP')) {
        const parsed = parseFXPCommand(cmd);
        handleFXP(parsed);
    } else if (cmd.startsWith('FXD')) {
        const parsed = parseFXDCommand(cmd);
        handleFXD(parsed);
    } else if (cmd.startsWith('FQ')) {
        const parsed = parseFQCommand(cmd);
        handleFQ(parsed);
    } else if (cmd.startsWith('RT')) {
        const parsed = parseRTCommand(cmd);
        if (parsed) {
            handleRT(parsed);
        } else {
            handleInvalidCommand(cmd);
        }
    } else if (cmd === 'ER') {
        handleER({});
    } else if (cmd === 'ET') {
        handleET({});
    } else if (cmd === 'IG') {
        handleIG({});
    } else if (cmd === 'IR') {
        handleIR({});
    } else if (cmd.startsWith('TT') || cmd.startsWith('TK')) {
        const parsed = parseTTPCommand(cmd);
        if (parsed) {
            handleTTP(parsed);
        } else {
            handleInvalidCommand(cmd);
        }
    } else if (cmd === 'HELP' || cmd === 'H') {
        handleHelp();
    } else if (cmd === 'CLEAR' || cmd === 'CLS') {
        terminal.innerHTML = '';
        addBlankLine();
    } else {
        handleInvalidCommand(cmd);
    }
    
    // Update session status
    if (session.pnr) {
        sessionStatus.textContent = `SESSION: ACTIVE | PNR: ${session.pnr}`;
    } else {
        sessionStatus.textContent = 'SESSION: ACTIVE';
    }
}

// ============ EVENT LISTENERS ============

commandInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const cmd = commandInput.value.trim();
        if (cmd) {
            processCommand(cmd);
            commandInput.value = '';
        }
    }
});

// Load session on startup
loadSessionFromStorage();

// Focus input on load
window.addEventListener('load', () => {
    commandInput.focus();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'F1') {
        e.preventDefault();
        processCommand('HELP');
    }
    if (e.altKey && e.key === 'x') {
        e.preventDefault();
        handleIG({});
    }
});

// Auto-focus input when clicking terminal
terminal.addEventListener('click', () => {
    commandInput.focus();
});

// Welcome message on load
window.addEventListener('load', () => {
    setTimeout(() => {
        if (terminal.children.length <= 6) {
            addTerminalLine('Welcome to AMADEUS Reservation System');
            addTerminalLine('Type HELP for command reference');
            addBlankLine();
        }
    }, 100);
});