pipeline {
  options {
    disableConcurrentBuilds()
  }
  agent {
    dockerfile {
      args "-u root:root"
    }
  }
  environment {
    CF_HOME='/root' // Revert override from Jenkins global env
    CF_API="${env.CF_API}"
    CF_LOGIN=credentials('portaljs-contentful-cache.cloudfoundry.login')
    CF_ORG="${env.CF_ORG}"
    CF_SPACE="${env.BRANCH_NAME == 'master' ? 'test' : 'production'}"
  }
  stages {
    stage('Login to CF') {
      steps {
        sh 'cf login -a ${CF_API} -u ${CF_LOGIN_USR} -p "${CF_LOGIN_PSW}" -o ${CF_ORG} -s ${CF_SPACE}'
      }
    }
    stage('Deploy to CF') {
      environment {
        CF_APP_NAME="portaljs-contentful-cache${env.CF_SPACE == 'production' ? '' : '-' + env.CF_SPACE}"
      }
      steps {
        configFileProvider([configFile(fileId: "portaljs-contentful-cache.${env.CF_SPACE}.env", targetLocation: '.env')]) {
          sh 'cf blue-green-deploy ${CF_APP_NAME} -f manifest.yml --delete-old-apps'
        }
      }
    }
  }
}
