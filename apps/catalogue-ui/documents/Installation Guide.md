# Installation Guide

This guide provides step-by-step instructions for installing and using the SIMPL Catalogue UI application, which provides a user interface for the xsfc catalogue with authentication, quick search, and advanced search capabilities.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Options](#installation-options)
  - [Option 1: Local Development Setup](#option-1-local-development-setup)
  - [Option 2: Docker Setup](#option-2-docker-setup)
  - [Option 3: Kubernetes/Helm Deployment](#option-3-kuberneteshelm-deployment)
- [Package Registry Configuration](#package-registry-configuration)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Using the Application](#using-the-application)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### For Local Development

- **Node.js**: Version 22 or higher
- **npm**: Usually comes with Node.js
- **Git**: For cloning the repository

### For Docker

- **Docker**: Version 20.10 or higher
- **Docker Compose** (optional): For easier container management

### For Kubernetes/Helm

- **Kubernetes cluster**: Version 1.18 or higher
- **Helm**: Version 3.0 or higher
- **kubectl**: Configured to access your cluster

## Installation Options

### Option 1: Local Development Setup

#### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd simpl-catalogue-client
```

#### Step 2: Install Dependencies

```bash
npm install
```

**Note**: This project uses the `@simpl/vue-components` package. If you encounter installation issues, see the [Package Registry Configuration](#package-registry-configuration) section below.

#### Step 3: Configure Environment Variables

Create a `.env` file in the root directory and configure the required environment variables (see [Configuration](#configuration) section below).

#### Step 4: Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:4321`

### Option 2: Docker Setup

#### Docker Step 1: Clone the Repository

```bash
git clone <repository-url>
cd simpl-catalogue-client
```

#### Docker Step 2: Configure Environment Variables

Create a `.env` file in the root directory with your configuration (see [Configuration](#configuration) section below).

**Important**: Also ensure you have a properly configured `.npmrc` file for the private package registry (see [Package Registry Configuration](#package-registry-configuration) section).

#### Docker Step 3: Build and Run with Docker

##### Using Docker directly

```bash
# Build the Docker image
docker build -t simpl-catalogue-ui .

# Run the container
docker run -p 4321:4321 --env-file .env simpl-catalogue-ui
```

##### Using Docker Compose (Recommended)

Create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  catalogue-ui:
    build: .
    ports:
      - "4321:4321"
    env_file:
      - .env
    environment:
      - HOST=0.0.0.0
      - PORT=4321
```

Then run:

```bash
docker-compose up -d
```

The application will be available at `http://localhost:4321`

### Option 3: Kubernetes/Helm Deployment

#### Kubernetes Step 1: Prerequisites

Ensure you have access to a Kubernetes cluster and the following tools installed:

- **kubectl**: Configured to access your cluster
- **Helm**: Version 3.0 or higher

#### Kubernetes Step 2: Configure Values

The application includes Helm charts in the `charts/` directory. Before deployment, you need to customize the `values.yaml` file or create your own values file.

**Important**: When building the Docker image for Kubernetes deployment, ensure your build environment has access to the private package registry with a properly configured `.npmrc` file (see [Package Registry Configuration](#package-registry-configuration) section).

Key configuration areas in `values.yaml`:

```yaml
# Image configuration
image:
  repository: your-registry/catalogue-ui
  tag: "latest"

# Ingress configuration (customize your domain)
ingress:
  enabled: true
  hosts:
    - host: your-domain.com
      paths:
        - path: /
          pathType: ImplementationSpecific
  tls:
    - secretName: your-tls-secret
      hosts:
        - your-domain.com

# Environment variables
env:
  PUBLIC_AUTH_KEYCLOAK_SERVER_URL: "https://your-keycloak-server.com"
  PUBLIC_AUTH_KEYCLOAK_REALM: "your-realm"
  PUBLIC_AUTH_KEYCLOAK_CLIENT_ID: "your-client-id"
  PUBLIC_SEARCH_API_URL: "https://your-search-api.com"
  PUBLIC_CONTRACT_CONSUMPTION_API_URL: "https://your-contract-api.com"
  PUBLIC_AGENT_TYPE: "consumer"
```

#### Kubernetes Step 3: Deploy with Helm

```bash
# Navigate to the project directory
cd simpl-catalogue-client

# Install or upgrade the Helm chart
helm upgrade --install catalogue-ui ./charts \
  --namespace your-namespace \
  --create-namespace \
  --values ./charts/values.yaml

# Or use a custom values file
helm upgrade --install catalogue-ui ./charts \
  --namespace your-namespace \
  --create-namespace \
  --values ./custom-values.yaml
```

#### Kubernetes Step 4: Verify Deployment

```bash
# Check pod status
kubectl get pods -n your-namespace

# Check service status
kubectl get services -n your-namespace

# Check ingress status
kubectl get ingress -n your-namespace

# View application logs
kubectl logs -f deployment/catalogue-ui -n your-namespace
```

The application will be available at the domain specified in your ingress configuration.

## Package Registry Configuration

This application uses the `@simpl/vue-components` package from a private registry. Before installation, you need to configure npm to retrieve `@simpl` scoped packages from the correct registry.

### Setting up .npmrc

1. **Create a `.npmrc` file** in the root of your project (same directory as `package.json`) with the following content:

   ```text
   @simpl:registry=https://code.europa.eu/api/v4/packages/npm/
   //code.europa.eu/api/v4/packages/npm/:_authToken=<auth_token>
   ```

2. **Replace `<auth_token>`** with a token generated on Code Europa. The token needs at least read API permissions.

3. **Add `.npmrc` to your `.gitignore`** file to avoid sharing tokens in the repository:

   ```gitignore
   # Add this line to your .gitignore
   .npmrc
   ```

### Generating an Auth Token

1. Go to [Code Europa](https://code.europa.eu)
2. Navigate to your user settings
3. Go to "Access Tokens"
4. Create a new token with at least "read_api" permissions
5. Copy the token and replace `<auth_token>` in your `.npmrc` file

### Troubleshooting Package Installation

If you encounter issues installing dependencies:

- **Error: "404 Not Found - GET <https://registry.npmjs.org/@simpl%2fvue-components>"**
  - This means the `.npmrc` file is not configured correctly
  - Ensure the `.npmrc` file is in the project root directory
  - Verify the registry URL and auth token are correct

- **Error: "401 Unauthorized"**
  - The auth token is invalid or has insufficient permissions
  - Generate a new token with "read_api" permissions
  - Update the `.npmrc` file with the new token

- **Error: "Network timeout" or "Registry connection failed"**
  - Check your network connection
  - Verify you can access <https://code.europa.eu>
  - Try clearing npm cache: `npm cache clean --force`

### Alternative: Environment Variables

Instead of using `.npmrc`, you can set environment variables:

```bash
export NPM_CONFIG_@simpl:registry=https://code.europa.eu/api/v4/packages/npm/
export NPM_CONFIG_//code.europa.eu/api/v4/packages/npm/:_authToken=<auth_token>
```

Then run:

```bash
npm install
```

## Configuration

### Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Keycloak Authentication Settings
PUBLIC_AUTH_KEYCLOAK_SERVER_URL="https://your-keycloak-server.com"
PUBLIC_AUTH_KEYCLOAK_REALM="your-realm"
PUBLIC_AUTH_KEYCLOAK_CLIENT_ID="your-client-id"

# Search API Configuration
PUBLIC_SEARCH_API_URL="https://your-search-api.com"
PUBLIC_SEARCH_API_VERSION="v1"

# Contract Consumption API Configuration
PUBLIC_CONTRACT_CONSUMPTION_API_URL="https://your-contract-api.com"
PUBLIC_CONTRACT_CONSUMPTION_API_VERSION="v1"

# Agent Type (consumer or provider)
PUBLIC_AGENT_TYPE="consumer"
```

### Configuration Notes

- **Important**: Do not add trailing slashes to base URLs
- Replace all placeholder URLs with your actual service endpoints
- The `PUBLIC_AGENT_TYPE` can be either "consumer" or "provider"
- All variables starting with `PUBLIC_` will be available in the client-side code

### Example Configuration

```bash
PUBLIC_AUTH_KEYCLOAK_SERVER_URL="https://auth.example.com"
PUBLIC_AUTH_KEYCLOAK_REALM="simpl"
PUBLIC_AUTH_KEYCLOAK_CLIENT_ID="catalogue-ui"
PUBLIC_SEARCH_API_URL="https://api.example.com/search"
PUBLIC_SEARCH_API_VERSION="v1"
PUBLIC_CONTRACT_CONSUMPTION_API_URL="https://api.example.com/contracts"
PUBLIC_CONTRACT_CONSUMPTION_API_VERSION="v1"
PUBLIC_AGENT_TYPE="consumer"
```

## Running the Application

### Development Mode (Local)

```bash
npm run dev
```

- Starts the development server with hot reload
- Available at `http://localhost:4321`

### Production Build (Local)

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

### Docker Production

```bash
# Using Docker directly
docker run -p 4321:4321 --env-file .env simpl-catalogue-ui

# Using Docker Compose
docker-compose up -d
```

### Kubernetes Production

```bash
# Deploy to Kubernetes using Helm
helm upgrade --install catalogue-ui ./charts \
  --namespace production \
  --create-namespace \
  --values ./production-values.yaml

# Check deployment status
kubectl get all -n production

# Scale the deployment
kubectl scale deployment catalogue-ui --replicas=3 -n production

# Update the deployment with new image
helm upgrade catalogue-ui ./charts \
  --namespace production \
  --set image.tag=new-version
```

### Running Unit Tests

```bash
# Run tests in watch mode
npm run test

# Run tests once (for CI)
npm run test:ci
```

### Running End-to-End Tests

```bash
# Run E2E tests
npm run e2e

# Run E2E tests with UI
npm run e2e:ui
```

### Test Coverage

Test coverage reports are generated in the `coverage/` directory after running tests with the `--coverage` flag.

## Troubleshooting

### Common Issues

#### 1. Authentication Problems

- **Issue**: Cannot log in or getting authentication errors
- **Solution**:
  - Verify Keycloak configuration in `.env` file
  - Check that Keycloak server is accessible
  - Ensure client ID and realm are correct

#### 2. API Connection Issues

- **Issue**: Search functionality not working
- **Solution**:
  - Verify API URLs in `.env` file
  - Check that API services are running and accessible
  - Ensure API versions are correct

#### 3. Docker Issues

- **Issue**: Container fails to start
- **Solution**:
  - Check Docker logs: `docker logs <container-id>`
  - Verify `.env` file is properly configured
  - Ensure port 4321 is not already in use

#### 4. Build Failures

- **Issue**: `npm run build` fails
- **Solution**:
  - Run `npm install` to ensure all dependencies are installed
  - Check for TypeScript errors: `npm run astro check`
  - Verify environment variables are set correctly

#### 5. Kubernetes/Helm Issues

- **Issue**: Pod fails to start or stays in pending state
- **Solution**:
  - Check pod status: `kubectl describe pod <pod-name> -n <namespace>`
  - Verify resource quotas and limits
  - Check if the image can be pulled: `kubectl get events -n <namespace>`
  - Ensure the namespace exists and has proper permissions

- **Issue**: Ingress not working or SSL certificate issues
- **Solution**:
  - Check ingress configuration: `kubectl describe ingress -n <namespace>`
  - Verify DNS configuration points to your cluster
  - Check cert-manager logs if using automatic SSL
  - Ensure ingress controller is properly installed

- **Issue**: Environment variables not being set correctly
- **Solution**:
  - Check the values.yaml configuration
  - Verify Helm template rendering: `helm template catalogue-ui ./charts --values ./values.yaml`
  - Check pod environment: `kubectl exec -it <pod-name> -n <namespace> -- env`

#### 6. Package Registry Issues

- **Issue**: `npm install` fails with 404 errors for `@simpl/vue-components`
- **Solution**:
  - Ensure `.npmrc` file is properly configured (see [Package Registry Configuration](#package-registry-configuration))
  - Verify the auth token has correct permissions
  - Check network access to Code Europa registry

- **Issue**: Docker build fails during `npm install`
- **Solution**:
  - Ensure `.npmrc` file is included in the Docker build context
  - Add `.npmrc` to your Dockerfile if needed:

    ```dockerfile
    COPY .npmrc ./
    RUN npm install
    RUN rm .npmrc
    ```

### Getting Help

If you encounter issues not covered in this guide:

1. Check the application logs for error messages
2. Verify all environment variables are correctly set
3. Ensure all required services (Keycloak, APIs) are running
4. Check network connectivity to external services

### Logs and Debugging

#### Local Development

- Check the terminal where you ran `npm run dev` for error messages
- Browser developer tools console for client-side errors

#### Docker

```bash
# View container logs
docker logs <container-name>

# Access container shell for debugging
docker exec -it <container-name> /bin/bash
```

#### Kubernetes

```bash
# View pod logs
kubectl logs <pod-name> -n <namespace>

# Follow logs in real-time
kubectl logs -f deployment/catalogue-ui -n <namespace>

# Access pod shell for debugging
kubectl exec -it <pod-name> -n <namespace> -- /bin/bash

# Describe pod for detailed information
kubectl describe pod <pod-name> -n <namespace>

# Check all resources in namespace
kubectl get all -n <namespace>

# View events for troubleshooting
kubectl get events -n <namespace> --sort-by='.lastTimestamp'
```

## Additional Commands

### npm Commands

| Command | Description |
|---------|-------------|
| `npm run cleanup` | Remove build artifacts and coverage reports |
| `npm run astro check` | Check for TypeScript and Astro issues |
| `npm run preview` | Preview production build locally |

### Kubernetes/Helm Commands

| Command | Description |
|---------|-------------|
| `helm lint ./charts` | Validate Helm chart syntax |
| `helm template catalogue-ui ./charts` | Render templates locally without installing |
| `helm upgrade --install catalogue-ui ./charts --dry-run` | Test deployment without applying changes |
| `helm rollback catalogue-ui <revision>` | Rollback to a previous release |
| `helm uninstall catalogue-ui -n <namespace>` | Remove the application from Kubernetes |
| `kubectl port-forward svc/catalogue-ui 8080:4321 -n <namespace>` | Access application via port forwarding |

## Support

For additional support or questions about the SIMPL Catalogue UI, please refer to your organization's internal documentation or contact the development team.
