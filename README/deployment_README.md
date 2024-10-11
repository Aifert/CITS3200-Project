# Hosting the CITS3200 Web App on Azure Web App Services

## Prerequisites

To host this web application on Azure, you'll need the following:

- **Azure Account**: Create an account at [Azure Portal](https://portal.azure.com/).
- **Git**: Ensure Git is installed and your project is pushed to a GitHub repository.
- **Docker Hub Account**: Sign up at [Docker Hub](https://hub.docker.com/) to store your Docker images.

## Step 1: Create an Azure Web App Service for Docker Compose

In the Azure portal:

1. Go to "Create a Resource" and select "Web App".
2. Choose the Docker Compose option under "Publish".
3. Select your subscription, resource group, and region.
4. Define your app name, e.g., `cits3200-web-app`.
5. Select Linux as the OS and Docker Compose under the Docker tab.
6. Once created, go to your Deployment Center to set up CI/CD.

## Step 2: Set Up GitHub Secrets

[Using Secrets in GitHub Actions](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions)

You'll need to configure the following GitHub Secrets in your repository:

| Secret Name | Value |
|-------------|-------|
| DOCKER_USERNAME | Your Docker Hub username |
| DOCKER_PASSWORD | Your Docker Hub password |
| NEXTAUTH_SECRET | Your NextAuth secret |
| NEXTAUTH_URL | Your frontend URL |
| NEXT_PUBLIC_BACKEND_URL | Backend service URL |
| NEXT_PUBLIC_SDR_URL | SDR service URL |
| AZURE_AD_CLIENT_ID | Your Azure AD Client ID |
| AZURE_AD_CLIENT_SECRET | Your Azure AD Client Secret |
| AZURE_AD_TENANT_ID | Your Azure AD Tenant ID |


## Step 3: Set Up Docker Hub Webhooks
Go to your Docker Hub repository and set up a webhook with the Azure webhook URL (found in Azure's Deployment Center) for both your web and frontend images. This will automatically trigger deployments when new Docker images are pushed.
