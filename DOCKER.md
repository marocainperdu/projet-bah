# 🐳 Docker Setup

## Configuration

1. **Copiez le fichier d'exemple** :
   ```bash
   cp docker-compose.example.yml docker-compose.yml
   cp .env.example .env
   ```

2. **Modifiez le fichier `.env`** avec vos paramètres :
   ```env
   # Configuration de la base de données
   DB_HOST=your_database_host
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_NAME=projet-bah
   DB_PORT=3306
   
   # Configuration JWT
   JWT_SECRET=your_super_secret_jwt_key
   
   # Configuration email
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   FROM_EMAIL=your_email@gmail.com
   FROM_NAME=Plateforme de Gestion des Demandes
   ```

## Utilisation

### Démarrer l'application
```bash
docker-compose up -d
```

### Voir les logs
```bash
docker-compose logs -f
```

### Arrêter l'application
```bash
docker-compose down
```

### Reconstruire les images
```bash
docker-compose up --build
```

## Accès

- **Frontend** : http://localhost:36374
- **Backend API** : http://localhost:3015

## Notes importantes

- Le fichier `docker-compose.yml` contient vos informations sensibles et est dans `.gitignore`
- Utilisez toujours `docker-compose.example.yml` comme modèle
- Assurez-vous que votre base de données est accessible depuis les conteneurs Docker
