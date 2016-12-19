#!/usr/bin/env bash

# more bash-friendly output for jq
JQ="jq --raw-output --exit-status"

configure_aws_cli(){
	aws --version
	aws configure set default.region us-east-1
	aws configure set default.output json
}

deploy_cluster() {

    family="api"

    make_task_def
    register_definition
    if [[ $(aws ecs update-service --cluster kit_production --service api --task-definition $revision | \
                   $JQ '.service.taskDefinition') != $revision ]]; then
        echo "Error updating service."
        return 1
    fi

    # wait for older revisions to disappear
    # not really necessary, but nice for demos
    for attempt in {1..30}; do
        if stale=$(aws ecs describe-services --cluster kit_production --services api | \
                       $JQ ".services[0].deployments | .[] | select(.taskDefinition != \"$revision\") | .taskDefinition"); then
            echo "Waiting for stale deployments:"
            echo "$stale"
            sleep 5
        else
            echo "Deployed!"
            return 0
        fi
    done
    echo "Service update took too long."
    return 1
}

make_task_def(){
	task_template='{
    "containerDefinitions": [
      {
        "name": "nginx",
        "image": "%s.dkr.ecr.us-east-1.amazonaws.com/kit_api/nginx%s",
        "portMappings": [
          {
            "containerPort": 80,
            "hostPort": 80
          }
        ],
        "links": ["api:api"],
        "cpu": 256,
        "memory": 100
      },
      {
        "name": "api",
        "image": "%s.dkr.ecr.us-east-1.amazonaws.com/kit_api/api%s",
        "portMappings": [
          {
            "containerPort": 5000,
            "hostPort": 5000
          }
        ],
        "cpu": 768,
        "memory": 300
      }
    ],
    "family": "api"
  }'

	task_def=$(printf "$task_template" $AWS_ACCOUNT_ID $CIRCLE_SHA1)
}

push_ecr_image(){
	eval $(aws ecr get-login --region us-east-1)
	docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/kit_api/api:$CIRCLE_SHA1
}

register_definition() {

    if revision=$(aws ecs register-task-definition --container-definitions "$task_def" --family $family | $JQ '.taskDefinition.taskDefinitionArn'); then
        echo "Revision: $revision"
    else
        echo "Failed to register task definition"
        return 1
    fi

}

configure_aws_cli
push_ecr_image
deploy_cluster
