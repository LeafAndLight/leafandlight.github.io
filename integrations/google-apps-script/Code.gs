const STATUS_OPTIONS = ['New', 'Reviewing', 'Shortlisted', 'Contacted', 'Interview', 'Hired', 'Rejected', 'Archived'];
const CANDIDATE_HEADERS = [
  'Submitted At UTC', 'Candidate ID', 'Status', 'Full Name', 'Email', 'Country / Region', 'Time Zone',
  'Role Category', 'Role Title', 'Seniority', 'Work Type', 'Availability', 'Rate Min', 'Rate Max',
  'Currency', 'Rate Basis', 'Portfolio URL', 'LinkedIn URL', 'Resume / CV URL', 'Subject', 'Message',
  'Selected Service', 'Source URL', 'Consent', 'Internal Notes', 'AI Tags', 'AI Score'
];
const INQUIRY_HEADERS = [
  'Submitted At UTC', 'Inquiry ID', 'Status', 'Inquiry Type', 'Selected Service', 'Full Name', 'Email',
  'Company', 'Subject', 'Message', 'Source URL'
];
const ROLE_CATEGORIES = ['Programming', '3D Art', '2D / Concept Art', 'Animation / Rigging', 'Technical Art / VFX', 'UI / UX', 'Game Design', 'Audio', 'Production / QA', 'Other'];
const SENIORITIES = ['Junior', 'Mid-level', 'Senior', 'Lead', 'Specialist'];
const WORK_TYPES = ['Freelance', 'Contract', 'Part-time', 'Full-time', 'Project-based'];
const AVAILABILITIES = ['', 'Immediately', 'Within 2 weeks', 'Within 1 month', 'More than 1 month', 'To be discussed'];
const CURRENCIES = ['USD', 'EUR', 'BRL', 'GBP', 'CAD', 'AUD', 'Other'];
const RATE_BASES = ['Per hour', 'Per day', 'Per month', 'Fixed project'];
const MAX_LENGTHS = { short: 180, subject: 160, message: 4000, url: 500 };

function setupSpreadsheet() {
  const spreadsheet = getSpreadsheet_();
  prepareSheet_(spreadsheet, 'Candidates', CANDIDATE_HEADERS);
  prepareSheet_(spreadsheet, 'General Inquiries', INQUIRY_HEADERS);
}

function doPost(event) {
  try {
    const payload = parsePayload_(event);
    const spreadsheet = getSpreadsheet_();
    const config = getConfig_();
    const submittedAt = new Date().toISOString();

    if (payload.submissionType === 'Hiring' || payload.type === 'Hiring') {
      const candidate = validateCandidate_(payload);
      const candidateId = makeId_('CAND');
      const row = [
        submittedAt, candidateId, 'New', candidate.name, candidate.email, candidate.hiring.country,
        candidate.hiring.timeZone, candidate.hiring.roleCategory, candidate.hiring.roleTitle,
        candidate.hiring.seniority, candidate.hiring.workType, candidate.hiring.availability,
        candidate.hiring.rateMin, candidate.hiring.rateMax, candidate.hiring.currency,
        candidate.hiring.rateBasis, candidate.hiring.portfolioUrl, candidate.hiring.linkedinUrl,
        candidate.hiring.resumeUrl, candidate.subject, candidate.message, candidate.selectedService,
        candidate.sourceUrl, candidate.hiring.consent ? 'Yes' : 'No', '', '', ''
      ];
      appendSafeRow_(spreadsheet.getSheetByName('Candidates'), row);
      sendHiringEmail_(candidate, candidateId, config);
      return json_({ ok: true, id: candidateId, type: 'Hiring' });
    }

    const inquiry = validateInquiry_(payload);
    const inquiryId = makeId_('INQ');
    appendSafeRow_(spreadsheet.getSheetByName('General Inquiries'), [
      submittedAt, inquiryId, 'New', inquiry.type, inquiry.selectedService, inquiry.name, inquiry.email,
      inquiry.company || '', inquiry.subject, inquiry.message, inquiry.sourceUrl
    ]);
    sendInquiryEmail_(inquiry, inquiryId, config);
    return json_({ ok: true, id: inquiryId, type: 'General' });
  } catch (error) {
    return json_({ ok: false, error: error.message || 'Invalid request' });
  }
}

function parsePayload_(event) {
  if (!event || !event.postData || !event.postData.contents) throw new Error('Missing request body.');
  let payload;
  try {
    payload = JSON.parse(event.postData.contents);
  } catch (error) {
    throw new Error('Request body must be valid JSON.');
  }
  if (payload.website) throw new Error('Spam check failed.');
  if (payload.openedAt && Date.now() - Number(payload.openedAt) < 2500) throw new Error('Please wait before submitting.');
  return payload;
}

function getConfig_() {
  const props = PropertiesService.getScriptProperties().getProperties();
  const required = ['SPREADSHEET_ID', 'SPREADSHEET_URL', 'CAREERS_EMAIL', 'GENERAL_EMAIL'];
  required.forEach(key => {
    if (!props[key]) throw new Error('Missing Script Property: ' + key);
  });
  return props;
}

function getSpreadsheet_() {
  const props = PropertiesService.getScriptProperties().getProperties();
  if (!props.SPREADSHEET_ID) throw new Error('Missing Script Property: SPREADSHEET_ID');
  return SpreadsheetApp.openById(props.SPREADSHEET_ID);
}

function prepareSheet_(spreadsheet, name, headers) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);

  const existingHeaders = sheet.getRange(1, 1, 1, Math.max(headers.length, sheet.getLastColumn() || headers.length)).getValues()[0];
  const hasHeaders = headers.every((header, index) => existingHeaders[index] === header);
  if (!hasHeaders) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#111827').setFontColor('#ffffff');
  if (!sheet.getFilter()) sheet.getRange(1, 1, Math.max(sheet.getMaxRows(), 2), headers.length).createFilter();
  sheet.autoResizeColumns(1, headers.length);

  const statusRule = SpreadsheetApp.newDataValidation().requireValueInList(STATUS_OPTIONS, true).setAllowInvalid(false).build();
  sheet.getRange(2, 3, Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(statusRule);
}

function validateInquiry_(payload) {
  const inquiry = {
    type: cleanText_(payload.type || 'General', MAX_LENGTHS.short),
    selectedService: cleanText_(payload.selectedService || '', MAX_LENGTHS.short),
    name: cleanText_(payload.name, MAX_LENGTHS.short),
    email: cleanEmail_(payload.email),
    company: cleanText_(payload.company || '', MAX_LENGTHS.short),
    subject: cleanText_(payload.subject, MAX_LENGTHS.subject),
    message: cleanText_(payload.message, MAX_LENGTHS.message),
    sourceUrl: cleanUrl_(payload.sourceUrl || '', false)
  };
  if (!inquiry.name) throw new Error('Name is required.');
  if ((inquiry.type === 'Business' || inquiry.type === 'Partnership') && !inquiry.company) throw new Error('Company / Organization is required.');
  if (!inquiry.subject) throw new Error('Subject is required.');
  if (!inquiry.message) throw new Error('Message is required.');
  return inquiry;
}

function validateCandidate_(payload) {
  const hiring = payload.hiring || {};
  const candidate = {
    name: cleanText_(payload.name, MAX_LENGTHS.short),
    email: cleanEmail_(payload.email),
    subject: cleanText_(payload.subject, MAX_LENGTHS.subject),
    message: cleanText_(payload.message || '', MAX_LENGTHS.message),
    selectedService: cleanText_(payload.selectedService || '', MAX_LENGTHS.short),
    sourceUrl: cleanUrl_(payload.sourceUrl || '', false),
    hiring: {
      country: cleanText_(hiring.country, MAX_LENGTHS.short),
      timeZone: cleanText_(hiring.timeZone || '', 80),
      roleCategory: oneOf_(hiring.roleCategory, ROLE_CATEGORIES, 'Role Category'),
      roleTitle: cleanText_(hiring.roleTitle, MAX_LENGTHS.short),
      seniority: oneOf_(hiring.seniority, SENIORITIES, 'Seniority'),
      workType: oneOf_(hiring.workType, WORK_TYPES, 'Work Type'),
      availability: oneOf_(hiring.availability || '', AVAILABILITIES, 'Availability'),
      rateMin: cleanPositiveNumber_(hiring.rateMin, 'Expected Rate Min'),
      rateMax: hiring.rateMax ? cleanPositiveNumber_(hiring.rateMax, 'Expected Rate Max') : '',
      currency: oneOf_(hiring.currency, CURRENCIES, 'Currency'),
      rateBasis: oneOf_(hiring.rateBasis, RATE_BASES, 'Rate Basis'),
      portfolioUrl: cleanUrl_(hiring.portfolioUrl, true),
      linkedinUrl: cleanUrl_(hiring.linkedinUrl || '', false),
      resumeUrl: cleanUrl_(hiring.resumeUrl || '', false),
      consent: hiring.consent === true
    }
  };

  if (!candidate.name) throw new Error('Name is required.');
  if (!candidate.subject) throw new Error('Subject is required.');
  if (!candidate.hiring.country) throw new Error('Country / Region is required.');
  if (!candidate.hiring.roleTitle) throw new Error('Role Title is required.');
  if (candidate.hiring.rateMax !== '' && Number(candidate.hiring.rateMax) < Number(candidate.hiring.rateMin)) {
    throw new Error('Expected Rate Max cannot be lower than Expected Rate Min.');
  }
  if (!candidate.hiring.consent) throw new Error('Consent is required.');
  return candidate;
}

function cleanText_(value, maxLength) {
  if (value === undefined || value === null) return '';
  const text = String(value).trim();
  if (text.length > maxLength) throw new Error('A field is too long.');
  return text;
}

function cleanEmail_(value) {
  const email = cleanText_(value, MAX_LENGTHS.short).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error('Invalid email.');
  return email;
}

function cleanUrl_(value, required) {
  const url = cleanText_(value, MAX_LENGTHS.url);
  if (!url) {
    if (required) throw new Error('A required URL is missing.');
    return '';
  }
  if (!/^https?:\/\//i.test(url)) throw new Error('Invalid URL.');
  return url;
}

function cleanPositiveNumber_(value, label) {
  const number = Number(value);
  if (!isFinite(number) || number <= 0) throw new Error(label + ' must be a positive number.');
  return number;
}

function oneOf_(value, options, label) {
  const clean = cleanText_(value, MAX_LENGTHS.short);
  if (options.indexOf(clean) === -1) throw new Error('Invalid ' + label + '.');
  return clean;
}

function appendSafeRow_(sheet, values) {
  sheet.appendRow(values.map(safeSheetValue_));
}

function safeSheetValue_(value) {
  if (value === undefined || value === null) return '';
  const text = String(value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function makeId_(prefix) {
  const stamp = Utilities.formatDate(new Date(), 'UTC', 'yyyyMMddHHmmss');
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return prefix + '-' + stamp + '-' + random;
}

function sendHiringEmail_(candidate, candidateId, config) {
  const h = candidate.hiring;
  const basis = emailRateBasis_(h.rateBasis);
  const rate = h.rateMax ? `${h.currency} ${h.rateMin}-${h.rateMax}/${basis}` : `${h.currency} ${h.rateMin}/${basis}`;
  const subject = `[HIRING] ${h.seniority} ${h.roleTitle} | ${h.country} | ${rate} | ${candidate.name}`;
  const html = [
    section_('Candidate', [['ID', candidateId], ['Name', candidate.name], ['Email', candidate.email]]),
    section_('Role', [['Category', h.roleCategory], ['Title', h.roleTitle], ['Seniority', h.seniority], ['Work Type', h.workType]]),
    section_('Location', [['Country / Region', h.country], ['Time Zone', h.timeZone]]),
    section_('Availability', [['Availability', h.availability || 'Not specified']]),
    section_('Expected Rate', [['Rate', rate]]),
    section_('Portfolio Links', [['Portfolio', link_(h.portfolioUrl)], ['LinkedIn', link_(h.linkedinUrl)], ['Resume / CV', link_(h.resumeUrl)]]),
    section_('Message', [['Message', candidate.message || 'No message provided.']]),
    `<p><a href="${escapeHtml_(config.SPREADSHEET_URL)}">Open hiring spreadsheet</a></p>`
  ].join('');
  MailApp.sendEmail({ to: config.CAREERS_EMAIL, replyTo: candidate.email, subject: subject, htmlBody: html, name: 'Leaf & Light Studio' });
}

function sendInquiryEmail_(inquiry, inquiryId, config) {
  const subject = inquiry.subject || `[CONTACT] ${inquiry.type} | ${inquiry.name}`;
  const html = [
    section_('Inquiry', [['ID', inquiryId], ['Type of inquiry', inquiry.type], ['Selected service', inquiry.selectedService || 'None'], ['Company', inquiry.company || '']]),
    section_('Visitor', [['Name', inquiry.name], ['Email', inquiry.email]]),
    section_('Message', [['Subject', inquiry.subject], ['Message', inquiry.message]]),
    section_('Source', [['Source URL', link_(inquiry.sourceUrl)]])
  ].join('');
  MailApp.sendEmail({ to: config.GENERAL_EMAIL, replyTo: inquiry.email, subject: subject, htmlBody: html, name: 'Leaf & Light Studio' });
}

function emailRateBasis_(basis) {
  return { 'Per hour': 'hour', 'Per day': 'day', 'Per month': 'month', 'Fixed project': 'project' }[basis] || 'rate';
}

function section_(title, rows) {
  const body = rows.map(row => `<tr><th align="left" style="padding:4px 12px 4px 0;">${escapeHtml_(row[0])}</th><td style="padding:4px 0;">${row[1] || ''}</td></tr>`).join('');
  return `<h2>${escapeHtml_(title)}</h2><table>${body}</table>`;
}

function link_(url) {
  if (!url) return '';
  const safe = escapeHtml_(url);
  return `<a href="${safe}">${safe}</a>`;
}

function escapeHtml_(value) {
  return String(value || '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}