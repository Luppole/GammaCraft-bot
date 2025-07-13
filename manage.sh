#!/bin/bash

# Bot management script
case "$1" in
    start)
        echo "🚀 Starting GammaCraft Bot..."
        docker-compose up -d
        ;;
    stop)
        echo "⏹️  Stopping GammaCraft Bot..."
        docker-compose down
        ;;
    restart)
        echo "🔄 Restarting GammaCraft Bot..."
        docker-compose restart
        ;;
    logs)
        echo "📋 Showing bot logs..."
        docker-compose logs -f bot
        ;;
    update)
        echo "🔄 Updating bot..."
        docker-compose down
        docker-compose build --no-cache
        docker-compose up -d
        ;;
    status)
        echo "📊 Bot status:"
        docker-compose ps
        ;;
    backup)
        echo "💾 Creating backup..."
        tar -czf "backup-$(date +%Y%m%d-%H%M%S).tar.gz" data/ .env
        echo "✅ Backup created"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|update|status|backup}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the bot"
        echo "  stop    - Stop the bot"
        echo "  restart - Restart the bot"
        echo "  logs    - View bot logs"
        echo "  update  - Update and rebuild the bot"
        echo "  status  - Show bot status"
        echo "  backup  - Create a backup of data and config"
        exit 1
        ;;
esac
