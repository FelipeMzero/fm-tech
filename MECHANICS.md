# Mechanics and System Parameters - MapOS PF

Documenting core business numbers, default values, and operational rules for the Autonomous Technician OS Management System.

| Parameter | Group | Value | Unit | Source / Rule |
| :--- | :--- | :--- | :--- | :--- |
| Default Warranty Duration | Warranty | 90 | days | Brazilian Consumer Code (CDC Art. 26 II) for durable goods & repairs |
| Issuer Fiscal Identifier | Legal / Tax | CPF (11 digits) | - | Autonomous professional / Pessoa Física standard |
| Thermal Print Width (Default) | Printing | 80 | mm | Standard POS thermal receipt roll width |
| Thermal Print Width (Compact) | Printing | 58 | mm | Compact portable thermal printer roll width |
| A4 Print Margin | Printing | 12 | mm | Standard laser/inkjet printable safe area margin |
| Pix EMV GUI (BRCode) | Payments | "br.gov.bcb.pix" | ID | Banco Central do Brasil BRCode Standard |
| Minimum Stock Alert Threshold | Inventory | 5 | units | Default fallback threshold for low stock indicator |
| Default Profit Margin | Pricing | 40 | % | Markup percentage on acquired parts cost price |
| OS Sequencer Start Index | Numbering | 1 | seq | Continuous integer formatting (#0001, #0002, etc.) |
| Tracking Token Entropy | Security | 128 | bits | UUID v4 public hash for client tracking URL |
