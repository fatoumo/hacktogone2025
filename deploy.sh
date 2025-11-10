#!/bin/bash

# deploy.sh - Deployment script for Hacktogone 2025 Python apps
# Usage: ./deploy.sh [start|stop|restart|logs|status|backup]

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    print_info "Docker and Docker Compose are installed."
}

# Check if .env file exists
check_env() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from .env.example..."
        if [ -f .env.example ]; then
            cp .env.example .env
            print_warning "Please edit .env and add your API keys before deploying."
        else
            print_error ".env.example not found. Cannot create .env file."
            exit 1
        fi
    else
        print_info ".env file found."
    fi
}

# Start services
start_services() {
    print_info "Starting services..."
    docker compose up -d --build
    print_info "Services started successfully!"
    print_info ""
    print_info "Access your services at:"
    print_info "  - Carbon RAG API: http://localhost:8000"
    print_info "  - Scoring API: http://localhost:8501"
    print_info "  - API Documentation (RAG): http://localhost:8000/docs"
    print_info ""
    print_info "View logs with: ./deploy.sh logs"
}

# Stop services
stop_services() {
    print_info "Stopping services..."
    docker compose down
    print_info "Services stopped."
}

# Restart services
restart_services() {
    print_info "Restarting services..."
    docker compose restart
    print_info "Services restarted."
}

# Show logs
show_logs() {
    print_info "Showing logs (Ctrl+C to exit)..."
    docker compose logs -f
}

# Show status
show_status() {
    print_info "Service status:"
    docker compose ps
}

# Backup ChromaDB data
backup_chromadb() {
    print_info "Backing up ChromaDB data..."
    BACKUP_DIR="./backups"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="${BACKUP_DIR}/chromadb_backup_${TIMESTAMP}.tar.gz"

    mkdir -p "$BACKUP_DIR"

    # Create backup from Docker volume
    docker run --rm -v hacktogone2025_chromadb-data:/data -v "$(pwd)/${BACKUP_DIR}":/backup alpine tar czf "/backup/chromadb_backup_${TIMESTAMP}.tar.gz" -C /data .

    print_info "Backup created: ${BACKUP_FILE}"
    print_info "Backup size: $(du -h "${BACKUP_FILE}" | cut -f1)"
}

# Restore ChromaDB data
restore_chromadb() {
    if [ -z "$1" ]; then
        print_error "Please provide backup file path: ./deploy.sh restore <backup_file>"
        exit 1
    fi

    if [ ! -f "$1" ]; then
        print_error "Backup file not found: $1"
        exit 1
    fi

    print_warning "This will overwrite current ChromaDB data. Are you sure? (yes/no)"
    read -r confirm

    if [ "$confirm" != "yes" ]; then
        print_info "Restore cancelled."
        exit 0
    fi

    print_info "Restoring ChromaDB data from $1..."
    docker run --rm -v hacktogone2025_chromadb-data:/data -v "$(pwd)/$(dirname "$1")":/backup alpine sh -c "rm -rf /data/* && tar xzf /backup/$(basename "$1") -C /data"
    print_info "Restore completed. Restart services to apply changes."
}

# Main script
main() {
    print_info "Hacktogone 2025 Deployment Script"
    print_info "=================================="

    check_docker

    case "${1:-start}" in
        start)
            check_env
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        logs)
            show_logs
            ;;
        status)
            show_status
            ;;
        backup)
            backup_chromadb
            ;;
        restore)
            restore_chromadb "$2"
            ;;
        *)
            print_error "Unknown command: $1"
            echo "Usage: ./deploy.sh [start|stop|restart|logs|status|backup|restore]"
            echo ""
            echo "Commands:"
            echo "  start    - Start all services (default)"
            echo "  stop     - Stop all services"
            echo "  restart  - Restart all services"
            echo "  logs     - Show service logs"
            echo "  status   - Show service status"
            echo "  backup   - Backup ChromaDB data"
            echo "  restore  - Restore ChromaDB data from backup"
            exit 1
            ;;
    esac
}

main "$@"
