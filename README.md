# Budgeteer

A simple, self-hosted web application for personal budget management. Budgeteer provides a clean interface for tracking income and expenses, with secure user authentication and automated deployments.

---

## Core Features

-   **Secure User Authentication:** User registration and login system using JWT (JSON Web Tokens) with hashed passwords.
-   **Transaction Management:** Add, view, sort, and delete income and expense transactions.
-   **Persistent Storage:** All user and transaction data is stored in a SQLite database.
-   **Customizable UI:** Includes user preferences for currency selection and a dark mode theme.
-   **Automated CI/CD:** Infrastructure and application deployments are fully automated using GitHub Actions and Terraform.

## Tech Stack

The project is divided into three main components: frontend, backend, and infrastructure.

-   **Frontend:**
    -   HTML5
    -   CSS3
    -   Vanilla JavaScript (ES6+)

-   **Backend:**
    -   Node.js
    -   Express.js (for the REST API)
    -   SQLite3 (for the database)
    -   `bcrypt.js` (for password hashing)
    -   `jsonwebtoken` (for session management)

-   **Infrastructure & DevOps:**
    -   **Terraform:** Manages cloud infrastructure (compute and networking) as code.
    -   **Caddy:** Used as a secure, automatic HTTPS reverse proxy.
    -   **systemd:** Manages the backend Node.js application as a persistent service on the host.
    -   **GitHub Actions:** Automates the entire CI/CD pipeline.

## Project Structure

```
/
├── .github/workflows/   # GitHub Actions for CI/CD
│   ├── _deploy.yaml         # Reusable application deployment logic
│   ├── deploy-dev.yaml      # Deploys 'dev' branch to the dev environment
│   ├── deploy-prod.yaml     # Deploys 'main' branch to the prod environment
│   └── infrastructure.yaml  # Deploys Terraform infrastructure
├── backend/               # Node.js REST API and database
├── frontend/              # HTML, CSS, and JavaScript client
└── infra/                 # Terraform code for cloud infrastructure
    ├── compute/
    ├── networking/
    └── scripts/
```

## Deployment

Deployment is a two-step process, fully automated with GitHub Actions.

### 1. Infrastructure Provisioning

The cloud infrastructure is managed by Terraform. The configuration is defined in the `/infra` directory and can be deployed by manually triggering the `infrastructure.yaml` workflow. This provisions all necessary cloud resources, including the VM and networking, and securely injects the `JWT_SECRET` via a `cloud-init` script.

### 2. Application Deployment

The application is deployed automatically whenever code is pushed to the `dev` or `main` branches.

1.  **Trigger:** A `git push` to a deployment branch triggers the corresponding workflow.
2.  **Execution:** The workflow connects to the server via SSH.
3.  **Code Update:** It clones the latest version of the repository into `/opt/budgeteer`.
4.  **Permissions:** It sets the correct file ownership (`chown -R www-data:www-data /opt/budgeteer`) to allow the backend service to write to the database file.
5.  **Dependencies:** It runs `npm install` in the `/backend` directory.
6.  **Restart:** It restarts the `budgeteer-backend` service using `systemctl` to apply the changes.

## Configuration

### Backend

-   **`JWT_SECRET`**: The secret for signing JSON Web Tokens is not stored in the repository. It is generated and injected into the server environment by the Terraform `cloud-init` script during infrastructure provisioning.

### Frontend

-   **`API_URL`**: The backend API endpoint is configured in `frontend/config.js`. The repository contains a placeholder value. This file must be created or updated manually on the server with the correct API URL (e.g., `https://api.budgeteer.sammosios.com`) after the first deployment. The deployment workflow is configured to preserve this file across subsequent deployments.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any bugs or feature requests.

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.
