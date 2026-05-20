pipeline {
    agent any

    environment {
        SONAR_PROJECT_KEY = 'mindbloom'
        BACKEND_DIR = 'backend'
        FRONTEND_DIR = 'frontend'
    }

    stages {

        stage('Install Backend Dependencies') {
            steps {
                bat 'cd backend && npm ci'
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                bat 'cd frontend && npm ci'
            }
        }

        stage('Backend Audit') {
            steps {
                bat 'cd backend && npm audit --audit-level=high'
            }
        }

        stage('Frontend Audit') {
            steps {
                bat 'cd frontend && npm audit --audit-level=high'
            }
        }

        stage('Docker Build') {
            steps {
                bat 'docker build -t mindbloom-backend -f Dockerfile .'
            }
        }

        stage('Compose Validation') {
            steps {
                bat 'docker compose config'
            }
        }
    }

    post {
        always {
            echo 'Pipeline completed.'
        }
    }
}