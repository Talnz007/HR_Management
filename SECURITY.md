# Security Policy & Vulnerability Audit

## 🛡️ Security Overview

The **Enterprise HR Management System (HRMS)** implements defense-in-depth security across both the Next.js frontend and FastAPI backend. All software packages are monitored and audited against known Common Vulnerabilities and Exposures (CVEs).

---

## 📋 Comprehensive Dependency Audit Log

A full remediation was completed resolving all GitHub Dependabot security advisories. Below is the verified ledger of patched components:

### 1. Frontend & Client Dependencies (npm / pnpm)

| Package | Previous Version | Patched Version | Key CVEs / Advisories Remediated |
| :--- | :--- | :--- | :--- |
| `next` | `14.2.32` | `15.5.25` | • **GHSA-p293-qw3h-jr36**: Unauthenticated RCE on Windows-hosted servers<br />• **GHSA-2xp9-vwfh-vxw4**: Unauthenticated RCE in Image Optimization API (AVIF)<br />• **GHSA-gp8f-8m3g-qvj9**: SSRF in applications using WebSocket upgrades<br />• **GHSA-67hx-6x53-jw92**: Server-side request forgery in Server Actions<br />• **GHSA-7gfc-2v6g-6w9f**: Denial of service in App Router using Server Actions |
| `axios` | `< 1.18.0` | `^1.20.0` | • **GHSA-7q8q-rj6j-mhjq**: Prototype pollution in option objects<br />• **GHSA-jqh4-m9w3-8hp9**: `ReadableStream` uploads bypass `maxBodyLength`<br />• **GHSA-42h9-826w-cgv3**: Excessive recursion in `formDataToJSON` DoS<br />• **GHSA-264v-m52p-g75c**: NO_PROXY bypass via IPv4-mapped IPv6<br />• **GHSA-cph5-5p89-pp99**: MITM via proxy config prototype pollution |
| `jspdf` | `3.0.2` | `^4.2.1` | • **GHSA-f95h-29cx-v3v9**: Local file inclusion and path traversal<br />• **GHSA-8g9c-4458-7569**: HTML injection in new window paths<br />• **GHSA-pmjv-w892-rfvh**: PDF object injection in `addJS`<br />• **GHSA-q27w-9m88-3pcr**: Malicious GIF/BMP dimension DoS |
| `postcss` | `< 8.5.22` | `^8.5.28` | • **GHSA-6g55-p6wh-862q**: Arbitrary file read via `sourceMappingURL`<br />• **GHSA-r28c-9q8g-f849**: Path traversal in auto-loading source maps |
| `nanoid` | `< 3.3.12` | `>= 3.3.12` | • **GHSA-xwg4-73v4-xw9w**: Integer overflow / infinite loop in non-secure generators |
| `browserslist`| `<= 4.28.6` | `>= 4.28.7` | • **GHSA-73wf-gq98-2v4g**: Uncaught crash / prototype write via stats<br />• **GHSA-c83g-rgw3-j3cx**: Unbounded memory growth (no cache eviction) |
| `ws` | `< 8.21.0` | `>= 8.21.0` | • **GHSA-96hv-2xvq-fx4p**: Memory exhaustion DoS from tiny fragments |

---

### 2. Backend & Core Dependencies (Python / pip)

| Package | Previous Version | Patched Version | Key CVEs / Advisories Remediated |
| :--- | :--- | :--- | :--- |
| `fastapi` | `0.115.0` | `0.141.1` | Upgraded to support modern Starlette without version pins. |
| `starlette` | `0.38.6` | `0.46.1` | • **GHSA-74m5-2c7w-9w3x**: Missing Host header validation poisons `request.url.path`<br />• **GHSA-f96h-pmfr-66vw**: DoS via multipart form parsing<br />• **GHSA-7f5h-p859-994r**: SSRF and NTLM credential theft via UNC paths on Windows |
| `sqladmin` | `0.21.0` | `0.31.1` | • **GHSA-v4cw-gqcq-5c68**: Unvalidated `sortBy` parameter bypasses `column_sortable_list`<br />• **GHSA-957m-9hph-722p**: Authorization bypass on `ajax_lookup` |
| `urllib3` | `2.5.0` | `2.8.0` | • **GHSA-34jh-p97f-mpxf**: Decompression-bomb safeguard bypass<br />• **GHSA-4842-763m-jc65**: Sensitive headers forwarded across origins in proxied redirects |
| `pillow` | `11.3.0` | `12.3.0` | • **GHSA-4fx9-vc88-q2xc**: Out-of-bounds write in PSD images<br />• **GHSA-6477-ffh6-5382**: Heap out-of-bounds write in `Image.paste` / `Image.crop`<br />• **GHSA-3f3h-p57h-pp87**: WindowsViewer command injection |
| `python-multipart` | `0.0.6` | `0.0.32` | • **GHSA-2cch-fv33-wqh5**: Arbitrary file write via non-default configuration<br />• **GHSA-7wvp-7f3h-6wmm**: Quadratic-time querystring parsing CPU DoS |
| `tornado` | `6.5.1` | `6.5.10` | • **GHSA-785h-hx65-p5w2**: Authorization header forwarded on cross-origin redirects<br />• **GHSA-w235-7p84-5m7v**: Quadratic DoS via repeated header coalescing |
| `cryptography` | `45.0.5` | `50.0.1` | • **GHSA-9v9h-cgj8-p64p**: Subgroup attack for SECT curves<br />• **GHSA-r9hx-vwmv-q5vh**: PKCS#7 Bleichenbacher oracle<br />• **GHSA-h4gh-qq45-5x5m**: Wildcard DNS constraint escape |
| `PyJWT` | `2.10.1` | `2.14.0` | • **GHSA-75c5-xw7c-p5pm**: Public-key JWK accepted as HMAC secret enables token forgery<br />• **GHSA-ffhq-mf77-hxpv**: Missing scheme allowlist in `PyJWKClient` enables SSRF |
| `weasyprint` | `66.0` | `70.0` | • **GHSA-qv23-958v-8whx**: SSRF protection bypass via HTTP redirect |

---

## 🔍 Security Best Practices Implemented

1. **Role-Based Access Control (RBAC)**: All administrative routes and API mutations require verified claims in cryptographically signed JWT tokens.
2. **Input Validation**: Strict request validation using Pydantic V2 schemas and Zod client validators.
3. **CORS & Middleware**: Configured origin validation and header sanitation.
4. **Credential Safety**: No hardcoded production secrets or database credentials committed to source control.
5. **Continuous Verification**: Dependabot security alerts and lockfile consistency checks.

---

## 📢 Reporting a Vulnerability

If you discover a potential security vulnerability in this project, please report it privately via GitHub Security Advisories or by contacting the maintainer directly.
