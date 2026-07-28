#!/bin/bash

# 🚀 ALM Helper Script for Portfolio Project
# Usage: ./alm.sh [command] [parameters]

COLOR_GREEN='\033[0;32m'
COLOR_BLUE='\033[0;34m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_NC='\033[0m' # No Color

print_header() {
    echo -e "${COLOR_BLUE}🚀 Portfolio ALM Helper${COLOR_NC}"
    echo -e "${COLOR_BLUE}========================${COLOR_NC}"
}

print_success() {
    echo -e "${COLOR_GREEN}✅ $1${COLOR_NC}"
}

print_warning() {
    echo -e "${COLOR_YELLOW}⚠️ $1${COLOR_NC}"
}

print_error() {
    echo -e "${COLOR_RED}❌ $1${COLOR_NC}"
}

show_help() {
    print_header
    echo ""
    echo "Available commands:"
    echo ""
    echo "  📝 Feature Development:"
    echo "    start-feature <name>     Create new feature branch"
    echo "    finish-feature <name>    Merge feature to develop"
    echo ""
    echo "  🚨 Hotfix Management:"
    echo "    start-hotfix <name>      Create hotfix branch from main"
    echo "    finish-hotfix <name>     Merge hotfix to main and develop"
    echo ""
    echo "  📦 Release Management:"
    echo "    start-release <version>  Create release branch"
    echo "    finish-release <version> Complete release process"
    echo ""
    echo "  ℹ️ Information:"
    echo "    status                   Show current branch status"
    echo "    branches                 List all branches"
    echo "    sync                     Sync current branch with remote"
    echo ""
    echo "  Examples:"
    echo "    ./alm.sh start-feature contact-validation"
    echo "    ./alm.sh start-hotfix mobile-menu-fix"
    echo "    ./alm.sh start-release v1.3.0"
}

start_feature() {
    if [ -z "$1" ]; then
        print_error "Feature name required!"
        echo "Usage: ./alm.sh start-feature <feature-name>"
        exit 1
    fi
    
    print_header
    echo -e "${COLOR_YELLOW}Starting feature: $1${COLOR_NC}"
    
    git checkout develop
    git pull origin develop
    git checkout -b "feature/$1"
    
    print_success "Feature branch 'feature/$1' created and checked out"
    print_warning "Don't forget to push your branch: git push -u origin feature/$1"
}

finish_feature() {
    if [ -z "$1" ]; then
        print_error "Feature name required!"
        exit 1
    fi
    
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "feature/$1" ]; then
        print_error "You must be on the feature/$1 branch to finish it"
        exit 1
    fi
    
    print_header
    echo -e "${COLOR_YELLOW}Finishing feature: $1${COLOR_NC}"
    
    git push origin "feature/$1"
    print_success "Feature pushed to remote"
    print_warning "Create a Pull Request: feature/$1 → develop on GitHub"
}

start_hotfix() {
    if [ -z "$1" ]; then
        print_error "Hotfix name required!"
        exit 1
    fi
    
    print_header
    echo -e "${COLOR_YELLOW}Starting hotfix: $1${COLOR_NC}"
    
    git checkout main
    git pull origin main
    git checkout -b "hotfix/$1"
    
    print_success "Hotfix branch 'hotfix/$1' created and checked out"
    print_warning "Remember: Hotfixes need PRs to both main AND develop"
}

start_release() {
    if [ -z "$1" ]; then
        print_error "Release version required!"
        exit 1
    fi
    
    print_header
    echo -e "${COLOR_YELLOW}Starting release: $1${COLOR_NC}"
    
    git checkout develop
    git pull origin develop
    git checkout -b "release/$1"
    
    print_success "Release branch 'release/$1' created"
    print_warning "Update version numbers and test thoroughly"
}

show_status() {
    print_header
    echo ""
    echo -e "${COLOR_BLUE}Current Branch:${COLOR_NC}"
    git branch --show-current
    echo ""
    echo -e "${COLOR_BLUE}Branch Status:${COLOR_NC}"
    git status --short
    echo ""
    echo -e "${COLOR_BLUE}Recent Commits:${COLOR_NC}"
    git log --oneline -5
}

show_branches() {
    print_header
    echo ""
    echo -e "${COLOR_BLUE}All Branches:${COLOR_NC}"
    git branch -a
}

sync_branch() {
    current_branch=$(git branch --show-current)
    print_header
    echo -e "${COLOR_YELLOW}Syncing branch: $current_branch${COLOR_NC}"
    
    git pull origin "$current_branch"
    print_success "Branch synced with remote"
}

# Main script logic
case "$1" in
    "start-feature")
        start_feature "$2"
        ;;
    "finish-feature")
        finish_feature "$2"
        ;;
    "start-hotfix")
        start_hotfix "$2"
        ;;
    "start-release")
        start_release "$2"
        ;;
    "status")
        show_status
        ;;
    "branches")
        show_branches
        ;;
    "sync")
        sync_branch
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
