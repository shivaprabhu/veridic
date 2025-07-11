# Veridic

> Truthful compliance automation - straight from your infrastructure.

Veridic is a CLI-first compliance tool for engineers and startups. It pulls real-time configuration data from your cloud environments and maps it to controls from frameworks like SOC2 and ISO27001. No more screenshots, spreadsheets, or stale policies — just evidence you can trust.

---

## 🔥 Why Veridic?

- ✅ Designed for DevOps, not compliance managers
- 🛠 Framework-as-code — define what you need, verify in CI
- ☁️ Supports AWS (GCP, Azure coming soon)
- 📦 Exports to JSON, PDF, Markdown — ready for auditors or GRC tools

---

## ⚙️ Install

```bash
curl -sSL https://veridic.io/install.sh | bash
```
---

## 🚀 Quickstart

```bash
veridic init --framework soc2 --cloud aws
veridic check
veridic report --summary
veridic export --format pdf
```
Or define everything in `veridic.yaml`:

```yaml
framework: soc2
cloud: aws
account: prod
controls:
  - AC-2
  - AC-6
  - CM-2
```

---

### 📋 Supported Frameworks (WIP)

  - [ ] SOC2

  - [ ] ISO 27001

  - [ ] HIPAA

  - [ ] NIST 800-53

---

---

### 📤 Outputs

  - `veridic-report.md` - human-readable control report

  - `evidence.json` - structured data for export or ingestion

  - `screenshots/` - auto-generated console screenshots (optional)

  - `audit-ready.zip` - shareable bundle for auditors

---
