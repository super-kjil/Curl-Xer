# 🌐 CurlXer - Enterprise Domain Intelligence & URL Analysis

![CurlXer Banner](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/og.png)

A modern, high-performance domain and URL checking application built with **Laravel 11**, **Inertia.js**, and **React**. CurlXer provides a comprehensive suite of tools for domain management, DNS analysis, and large-scale URL processing with intelligent caching and background execution.

---

## 🚀 Key Features

*   **⚡ High-Performance Checker**: Parallel processing of thousands of URLs with configurable batching.
*   **🔍 DNS Analysis**: Automatic and manual DNS server detection for precise resolution testing.
*   **📊 Advanced Analytics**: Visual dashboard with historical data tracking and trends.
*   **🛠️ Domain Toolkit**: Built-in generator, extractor (MS Word support), and comparer.
*   **🔐 Enterprise Security**: Role-based access control (RBAC) via Spatie and full audit logging.
*   **💾 Intelligent Caching**: Multi-layer caching (Local & Server) for near-instant data retrieval.

---

## 📖 User Guide: How to Use Each Function

CurlXer is designed to be intuitive but powerful. Here is a breakdown of how to use each core tool:

### 1. 📋 Domain Checker (Core Engine)
The heart of the application for checking domain status, IP addresses, and server headers.
- **How to use**: 
    1. Navigate to the **Domain Checker** via the sidebar.
    2. **Input**: Paste your URLs in the textarea (one per line).
    3. **DNS Selection**: Use "Auto Detect" or manually select specific DNS servers to test resolution from different providers.
    4. **Execute**: Click **"Check URLs"**.
    5. **Results**: Watch real-time progress. Results include HTTP Status, IP Address, Server Type, and Response Time.
    6. **Export**: Use the export buttons to save results as CSV or Excel.

### 2. ⚖️ Domain Comparer
Identify differences between two sets of domain lists instantly.
- **How to use**:
    1. Go to **Domain Comparer**.
    2. **Input A vs B**: Paste List 1 in the left box and List 2 in the right box (or upload `.txt` files).
    3. **Compare**: Click **"Compare Lists"**.
    4. **Analyze**: The system will highlight:
        - Domains in List 1 but missing from List 2.
        - Domains in List 2 but missing from List 1.
    5. **Copy**: Quickly copy the missing domains to your clipboard for further processing.

### 3. 📄 Domain Extractor (Word Document Support)
Cleanly extract domain names and IPv4 addresses from raw MS Word documents.
- **How to use**:
    1. Open the **Domain Extractor**.
    2. **Upload**: Drag and drop a `.docx` file into the upload zone.
    3. **Process**: The system automatically parses the raw text using the `mammoth` engine.
    4. **Output**: View a clean list of all domains and IP addresses found within the document.
    5. **Copy**: Use the "Copy All" buttons to grab the extracted data.

### 4. 🪄 Domain Generator
Create variations and formatted lists of domains for testing or migration.
- **How to use**:
    1. Navigate to **Domain Generator**.
    2. **Seed List**: Enter your base domains.
    3. **Tags & Dates**: Add custom tags (e.g., `#TRC`) or dates to be appended/prepended.
    4. **Variants**: Choose to generate `www` vs `non-www` variants.
    5. **Generate**: Click **"Generate Domains"** to get a formatted, deduplicated list.

### 5. 📉 Dashboard & History
Track your activity and analyze performance over time.
- **Dashboard**: View charts of check success rates, top server types, and activity volume. Filter by 7 days, 1 month, or custom ranges.
- **History**: Access every batch ever checked. You can re-run previous checks, view detailed logs, or bulk-delete old history to save space.

### 6. ⚙️ Performance Settings
Optimize CurlXer for your specific hardware/network.
- **Batch Size**: Control how many URLs are processed concurrently. (Default: 100).
- **Timeout**: Set the max wait time for slow domains (Default: 30s).
- **DNS Cache**: Refresh or clear the server-side DNS cache to ensure fresh results.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Backend** | Laravel 11, PHP 8.2+ |
| **Frontend** | React 18, TypeScript, Inertia.js |
| **Styling** | Tailwind CSS, shadcn/ui |
| **Database** | MySQL / PostgreSQL |
| **Caching** | Redis / LocalStorage |
| **Auth/Perms** | Laravel Breeze, Spatie Permission |

---

## 🏗️ Architecture & Permissions

### Role-Based Access Control (RBAC)
CurlXer uses a granular permission system:
- **Admin**: Full access to User Management, Role Management, Activity Logs, and System Settings.
- **User**: Access to checking tools and their own history.
- **Permissions**: `manage_users`, `manage_roles`, `view_dashboard`, `view_domain_checker`, etc.

### Key Directory Structure
```text
app/
├── Http/Controllers/    # Core logic (Checker, Comparer, Admin)
├── Services/            # DNS and Background processing logic
├── Models/              # DomainCheckBatch, Result, User
resources/js/
├── pages/               # React views for each tool
├── components/          # Reusable UI (shadcn/ui)
└── hooks/               # Custom hooks (permissions, caching)
```

---

## 🔧 Installation & Setup

### Prerequisites
- PHP 8.2+
- Node.js 18+
- MySQL 8.0+
- Composer & NPM

### Step-by-Step
1. **Clone & Install**:
   ```bash
   git clone <repo-url>
   composer install
   npm install
   ```
2. **Environment**:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
3. **Database**:
   ```bash
   php artisan migrate --seed
   ```
4. **Build & Run**:
   ```bash
   npm run dev
   php artisan serve
   ```

---

## 🆘 Support & Documentation

- **Issues**: Please report bugs via GitHub Issues.
- **Docs**: For deep technical details, refer to the [Laravel Documentation](https://laravel.com/docs).

---

