export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          return stringValue.includes(',') || stringValue.includes('"')
            ? `"${stringValue.replace(/"/g, '""')}"`
            : stringValue;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateHTMLReport(data: {
  title: string;
  period: string;
  sections: {
    title: string;
    content: string | { headers: string[]; rows: string[][] };
  }[];
}): string {
  const summarySection = data.sections.find((s) => typeof s.content === 'string');
  const tableSections = data.sections.filter((s) => typeof s.content !== 'string');

  const parseSummaryValues = (content: string) => {
    const items: { label: string; value: string; highlight?: string }[] = [];
    const pairs = content.split('<br>').map((s) => s.trim()).filter(Boolean);
    for (const pair of pairs) {
      const clean = pair.replace(/<[^>]*>/g, '');
      const colonIdx = clean.indexOf(':');
      if (colonIdx !== -1) {
        const label = clean.slice(0, colonIdx).trim();
        const value = clean.slice(colonIdx + 1).trim();
        let highlight = '';
        if (label.toLowerCase().includes('income')) highlight = 'income';
        else if (label.toLowerCase().includes('expense')) highlight = 'expense';
        else if (label.toLowerCase().includes('net') || label.toLowerCase().includes('saving')) highlight = 'net';
        else if (label.toLowerCase().includes('transaction')) highlight = 'neutral';
        items.push({ label, value, highlight });
      }
    }
    return items;
  };

  const summaryItems = summarySection ? parseSummaryValues(summarySection.content as string) : [];

  const summaryCardsHTML = summaryItems.length > 0 ? `
    <div class="summary-grid">
      ${summaryItems.map((item) => {
        const isNegative = item.value.includes('-');
        let cardClass = 'summary-card';
        let valueClass = 'summary-value';
        let iconSVG = '';
        if (item.highlight === 'income') {
          cardClass += ' card-income';
          valueClass += ' value-income';
          iconSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`;
        } else if (item.highlight === 'expense') {
          cardClass += ' card-expense';
          valueClass += ' value-expense';
          iconSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>`;
        } else if (item.highlight === 'net') {
          cardClass += isNegative ? ' card-loss' : ' card-savings';
          valueClass += isNegative ? ' value-loss' : ' value-savings';
          iconSVG = isNegative
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>`;
        } else {
          cardClass += ' card-neutral';
          valueClass += ' value-neutral';
          iconSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`;
        }
        return `
          <div class="${cardClass}">
            <div class="card-icon">${iconSVG}</div>
            <div class="card-label">${item.label}</div>
            <div class="${valueClass}">${item.value}</div>
          </div>
        `;
      }).join('')}
    </div>
  ` : '';

  const tablesSectionsHTML = tableSections.map((section) => {
    const tableData = section.content as { headers: string[]; rows: string[][] };
    return `
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">${section.title}</h2>
        </div>
        <table>
          <thead>
            <tr>${tableData.headers.map((h) => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${tableData.rows.map((row, i) =>
              `<tr class="${i % 2 === 1 ? 'row-alt' : ''}">${row.map((cell, ci) => `<td class="${ci > 0 ? 'text-right' : ''}">${cell}</td>`).join('')}</tr>`
            ).join('')}
          </tbody>
        </table>
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f8fafc;
      color: #1e293b;
      padding: 0;
      min-height: 100vh;
    }
    .report-wrapper {
      max-width: 860px;
      margin: 0 auto;
      padding: 40px 32px 60px;
      background: #fff;
      min-height: 100vh;
    }

    /* Header */
    .report-header {
      background: linear-gradient(135deg, #1e40af 0%, #0369a1 50%, #0891b2 100%);
      border-radius: 16px;
      padding: 36px 40px;
      margin-bottom: 36px;
      position: relative;
      overflow: hidden;
    }
    .report-header::before {
      content: '';
      position: absolute;
      top: -40px; right: -40px;
      width: 180px; height: 180px;
      background: rgba(255,255,255,0.07);
      border-radius: 50%;
    }
    .report-header::after {
      content: '';
      position: absolute;
      bottom: -60px; left: -20px;
      width: 220px; height: 220px;
      background: rgba(255,255,255,0.04);
      border-radius: 50%;
    }
    .brand-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
      position: relative; z-index: 1;
    }
    .brand-icon {
      width: 36px; height: 36px;
      background: rgba(255,255,255,0.2);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .brand-icon svg {
      width: 20px; height: 20px;
      color: #fff; stroke: #fff;
    }
    .brand-name {
      font-size: 15px;
      font-weight: 700;
      color: rgba(255,255,255,0.9);
      letter-spacing: 0.5px;
    }
    .report-title {
      font-size: 32px;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.5px;
      line-height: 1.1;
      position: relative; z-index: 1;
      margin-bottom: 8px;
    }
    .report-period {
      font-size: 14px;
      color: rgba(255,255,255,0.75);
      position: relative; z-index: 1;
      display: flex; align-items: center; gap: 6px;
    }
    .report-period::before {
      content: '';
      display: inline-block;
      width: 16px; height: 2px;
      background: rgba(255,255,255,0.5);
      border-radius: 2px;
    }

    /* Summary Cards */
    .summary-section-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 14px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
      margin-bottom: 36px;
    }
    .summary-card {
      border-radius: 14px;
      padding: 20px 22px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      border: 1px solid transparent;
    }
    .card-income { background: #f0fdf4; border-color: #bbf7d0; }
    .card-expense { background: #fef2f2; border-color: #fecaca; }
    .card-savings { background: #f0fdf4; border-color: #86efac; }
    .card-loss { background: #fff7ed; border-color: #fed7aa; }
    .card-neutral { background: #f1f5f9; border-color: #e2e8f0; }
    .card-icon {
      width: 32px; height: 32px;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 4px;
    }
    .card-income .card-icon { background: #dcfce7; color: #16a34a; }
    .card-expense .card-icon { background: #fee2e2; color: #dc2626; }
    .card-savings .card-icon { background: #dcfce7; color: #16a34a; }
    .card-loss .card-icon { background: #ffedd5; color: #ea580c; }
    .card-neutral .card-icon { background: #e2e8f0; color: #64748b; }
    .card-icon svg { width: 16px; height: 16px; stroke: currentColor; }
    .card-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: #64748b;
    }
    .summary-value {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      line-height: 1;
    }
    .value-income { color: #16a34a; }
    .value-expense { color: #dc2626; }
    .value-savings { color: #16a34a; }
    .value-loss { color: #ea580c; }
    .value-neutral { color: #334155; }

    /* Sections */
    .section {
      margin-bottom: 32px;
      page-break-inside: avoid;
    }
    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
      padding-bottom: 12px;
      border-bottom: 2px solid #f1f5f9;
    }
    .section-title {
      font-size: 17px;
      font-weight: 700;
      color: #1e293b;
      letter-spacing: -0.2px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    thead tr {
      background: linear-gradient(90deg, #1e3a8a 0%, #1d4ed8 100%);
    }
    th {
      padding: 13px 16px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.9);
    }
    th:not(:first-child) { text-align: right; }
    td {
      padding: 12px 16px;
      font-size: 14px;
      color: #334155;
      border-bottom: 1px solid #f1f5f9;
    }
    td.text-right { text-align: right; font-variant-numeric: tabular-nums; }
    tr.row-alt td { background: #f8fafc; }
    tbody tr:last-child td { border-bottom: none; }
    tbody tr:hover td { background: #eff6ff; }

    /* Footer */
    .report-footer {
      margin-top: 48px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .footer-brand {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .footer-brand-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #06b6d4);
    }
    .footer-brand-name {
      font-size: 13px;
      font-weight: 700;
      color: #334155;
    }
    .footer-timestamp {
      font-size: 12px;
      color: #94a3b8;
    }
    .confidential-badge {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #64748b;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 3px 8px;
    }

    @media print {
      body { background: #fff; }
      .report-wrapper { padding: 20px; }
      .section { page-break-inside: avoid; }
      .summary-grid { page-break-inside: avoid; }
      tbody tr:hover td { background: transparent; }
    }
  </style>
</head>
<body>
  <div class="report-wrapper">
    <div class="report-header">
      <div class="brand-row">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5"><polyline points="13 2 13 9 20 9"></polyline><polygon points="20 2 13 9 3 9 3 22 20 22 20 9"></polygon></svg>
        </div>
        <span class="brand-name">FinanceFlow</span>
      </div>
      <div class="report-title">${data.title}</div>
      <div class="report-period">${data.period}</div>
    </div>

    ${summaryItems.length > 0 ? `
      <div class="summary-section-label">Financial Overview</div>
      ${summaryCardsHTML}
    ` : ''}

    ${tablesSectionsHTML}

    <div class="report-footer">
      <div class="footer-brand">
        <div class="footer-brand-dot"></div>
        <span class="footer-brand-name">FinanceFlow</span>
      </div>
      <span class="footer-timestamp">Generated on ${new Date().toLocaleString()}</span>
      <span class="confidential-badge">Confidential</span>
    </div>
  </div>
</body>
</html>
  `;
}

export function printHTMLReport(html: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate the report');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}
