# GitHub Setup Instructions

## Step 1: Create a GitHub Repository

1. Go to https://github.com and log in
2. Click the "+" icon in the top right → "New repository"
3. Repository name: `stock-inventory-app` (or any name you prefer)
4. Description: "Thai E-commerce Inventory Management System"
5. Choose **Private** or **Public**
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

## Step 2: Push to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add the remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/stock-inventory-app.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Alternative: Using SSH

If you have SSH keys set up:

```bash
git remote add origin git@github.com:YOUR_USERNAME/stock-inventory-app.git
git branch -M main
git push -u origin main
```

## That's it!

Your code is now on GitHub. You can view it at:
https://github.com/YOUR_USERNAME/stock-inventory-app


