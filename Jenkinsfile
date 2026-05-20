pipeline {
    agent any

    environment {
        SONAR_PROJECT_KEY = 'mindbloom'
    }

    stages {

        stage('Install Backend Dependencies') {
            steps {
                bat 'npm ci'
            }
        }

        stage('Backend Audit') {
            steps {
                bat 'npm audit --audit-level=high'
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

        stage('Schema Check') {
            steps {
                bat 'node scripts/seed.js'
            }
        }
    }

    post {
        always {
            echo 'Pipeline completed.'
        }
    }
}