pipeline {
    agent any

    environment {
        SONAR_PROJECT_KEY = 'mindbloom'
    }

    stages {

        stage('Install Dependencies') {
            steps {
                bat 'npm ci'
            }
        }

        stage('Dependency Vulnerability Scan') {
            steps {
                script {

                    bat 'if not exist reports mkdir reports'

                    def auditStatus = bat(
                        returnStatus: true,
                        script: 'npm audit --audit-level=high --json > reports\\npm-audit-report.json'
                    )

                    if (auditStatus != 0) {
                        error 'High/Critical vulnerabilities found.'
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {

                    def scannerHome = tool 'SonarScanner'

                    withSonarQubeEnv('SonarQube-server') {

                        bat """
                        ${scannerHome}\\bin\\sonar-scanner.bat ^
                        -Dsonar.projectKey=%SONAR_PROJECT_KEY% ^
                        -Dsonar.sources=.
                        """
                    }
                }
            }
        }

        // stage('Quality Gate') {
        //     steps {
        //         timeout(time: 5, unit: 'MINUTES') {
        //             waitForQualityGate abortPipeline: true
        //         }
        //     }
        // }
    }

    post {
        always {
            archiveArtifacts artifacts: 'reports/npm-audit-report.json', allowEmptyArchive: true
        }
    }
}