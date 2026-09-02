export const formatKz = (amount: number): string => {
  if (isNaN(amount)) return '0 Kz';
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('pt-AO', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(rounded);
  return `${formatted} Kz`;
};

export const formatKzDecimal = (amount: number): string => {
  if (isNaN(amount)) return '0,00 Kz';
  const formatted = new Intl.NumberFormat('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} Kz`;
};

export const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  if (dateString.includes('/')) return dateString;
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
};

export const getTodayFormatted = (): string => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const getDueDateFormatted = (daysAhead: number = 15): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const numberToKzWords = (value: number): string => {
  if (!value || isNaN(value)) return 'zero kwanzas';
  const val = Math.round(value);
  if (val === 0) return 'zero kwanzas';

  const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezasseis', 'dezassete', 'dezoito', 'dezanove'];
  const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  const convertGroup = (n: number): string => {
    if (n === 0) return '';
    if (n === 100) return 'cem';
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;
    const parts: string[] = [];

    if (c > 0) parts.push(hundreds[c]);
    if (d === 1) {
      parts.push(teens[u]);
    } else {
      if (d > 1) parts.push(tens[d]);
      if (u > 0) parts.push(units[u]);
    }
    return parts.join(' e ');
  };

  if (val < 1000) {
    return `${convertGroup(val)} kwanzas`;
  }

  const millions = Math.floor(val / 1000000);
  const thousands = Math.floor((val % 1000000) / 1000);
  const remainder = val % 1000;

  const resParts: string[] = [];

  if (millions > 0) {
    if (millions === 1) {
      resParts.push('um milhão');
    } else {
      resParts.push(`${convertGroup(millions)} milhões`);
    }
  }

  if (thousands > 0) {
    if (thousands === 1) {
      resParts.push('mil');
    } else {
      resParts.push(`${convertGroup(thousands)} mil`);
    }
  }

  if (remainder > 0) {
    resParts.push(convertGroup(remainder));
  }

  return `${resParts.join(' e ')} kwanzas`;
};

export const formatKzCompact = (amount: number): string => {
  if (isNaN(amount) || amount === 0) return '0 Kz';
  if (Math.abs(amount) >= 1_000_000) {
    const val = (amount / 1_000_000).toFixed(1).replace('.0', '');
    return `${val}M Kz`;
  }
  if (Math.abs(amount) >= 1_000) {
    const val = (amount / 1_000).toFixed(0);
    return `${val}k Kz`;
  }
  return `${amount} Kz`;
};

