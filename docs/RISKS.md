# DHSE Top-15 Risk Register & Mitigations (Chapter 27)

| # | Risk Description | Category | Severity | Likelihood | Risk Score | Mitigation Strategy | Owner |
|---|---|---|---|---|---|---|---|
| **1** | Signature forgery misuse | Security | 5 | 2 | **10** | Stylus liveness verification + TS-GATR anti-forgery micro-perturbations + forensic watermarks | Security |
| **2** | Model extraction attack | Security | 4 | 3 | **12** | Client-side rate limiting + style-vector watermarking + obfuscated Wasm binaries | ML |
| **3** | Browser engine fragmentation | Tech | 3 | 4 | **12** | Cross-browser CI matrix (Chromium, WebKit, Gecko) + Canvas 2D fallback | QA |
| **4** | WebGPU not available on target | Tech | 3 | 3 | **9** | Automatic fallback to Wasm CPU compute (3x slower but 100% compatible) | Infra |
| **5** | HTR benchmark accuracy drift | Tech | 3 | 3 | **9** | Reference dataset checksums + automated regression gates in CI | Eval |
| **6** | Style vector regression on updates | Tech | 4 | 3 | **12** | Continuous drift monitor + automatic champion/challenger rollback | MLOps |
| **7** | GDPR / BIPA enforcement action | Regulatory | 5 | 2 | **10** | Strict zero-knowledge architecture: biometrics never leave local device | Legal |
| **8** | Patent infringement claims | Regulatory | 4 | 2 | **8** | Prior-art search + defensive publication of biomechanical equations | Legal |
| **9** | University RFP cycle delays | Market | 3 | 3 | **9** | EDU sales outreach starts 6 months ahead of autumn procurement cycle | Sales |
| **10** | Competitor ships similar feature | Market | 3 | 3 | **9** | Ship open plugin SDK + deep accessibility integration as defensive moat | Product |
| **11** | Key engineer attrition | Operational | 4 | 3 | **12** | Encyclopedic architecture documentation + pair programming rotations | Eng |
| **12** | CDN outage (Cloudflare R2) | Operational | 3 | 2 | **6** | Multi-CDN failover (Cloudflare R2 + AWS S3 edge origin) | Infra |
| **13** | Steganographic watermark stripping | Security | 4 | 2 | **8** | Dual-domain embedding: spatial micro-kerning + discrete wavelet frequency | Security |
| **14** | Dysgraphia mode user dissatisfaction | Product | 3 | 2 | **6** | Co-design partnerships with neurodivergent student organizations | A11y |
| **15** | Mobile battery drain from 3D WebGL | Tech | 3 | 3 | **9** | Frame-throttling on mobile batteries; static 2D snapshot caching | Eng |
