// Gerador de Payload e String BRCode PIX Estático (Padrão Banco Central do Brasil / EMV)

export interface PixOptions {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount?: number;
  txId?: string; // Identificador da transação, ex: OS0001
  description?: string;
}

function emvFormat(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

// Cálculo oficial do CRC16 CCITT (Polinômio 0x1021, valor inicial 0xFFFF)
function calculateCrc16(payload: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function generatePixPayload(options: PixOptions): string {
  const {
    pixKey,
    merchantName,
    merchantCity,
    amount,
    txId = '***'
  } = options;

  // Normalização de strings (máximo 25 caracteres, sem acentos para conformidade EMV)
  const cleanName = merchantName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .substring(0, 25)
    .trim() || 'RECEBEDOR';

  const cleanCity = merchantCity
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .substring(0, 15)
    .trim() || 'BRASIL';

  // 00: Payload Format Indicator
  let payload = emvFormat('00', '01');

  // 26: Merchant Account Information - PIX
  const gui = emvFormat('00', 'br.gov.bcb.pix');
  const key = emvFormat('01', pixKey);
  const desc = options.description ? emvFormat('02', options.description.substring(0, 40)) : '';
  const merchantAccountInfo = gui + key + desc;
  payload += emvFormat('26', merchantAccountInfo);

  // 52: Merchant Category Code (0000 = Geral)
  payload += emvFormat('52', '0000');

  // 53: Transaction Currency (986 = BRL)
  payload += emvFormat('53', '986');

  // 54: Transaction Amount (opcional, formatado com 2 casas)
  if (amount && amount > 0) {
    payload += emvFormat('54', amount.toFixed(2));
  }

  // 58: Country Code
  payload += emvFormat('58', 'BR');

  // 59: Merchant Name
  payload += emvFormat('59', cleanName);

  // 60: Merchant City
  payload += emvFormat('60', cleanCity);

  // 62: Additional Data Field Template (txId)
  const cleanTxId = (txId.replace(/[^a-zA-Z0-9]/g, '') || '***').substring(0, 25);
  const txIdField = emvFormat('05', cleanTxId);
  payload += emvFormat('62', txIdField);

  // 63: CRC16 (Tag 63 + tamanho '04' + valor do CRC)
  payload += '6304';
  const crc = calculateCrc16(payload);

  return payload + crc;
}
