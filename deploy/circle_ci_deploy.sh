#!/usr/bin/env bash

# more bash-friendly output for jq
JQ="jq --raw-output --exit-status"
family="api"
cluster="kit_production"
desired_count=2

configure_aws_cli() {
	aws --version
	aws configure set default.region us-east-1
	aws configure set default.output json
}

deploy_cluster() {
    make_task_def
    register_definition
    if service=$(aws ecs update-service --cluster $cluster --service $family --task-definition $family --desired-count $desired_count); then
        echo "Service Updated: $service"
    else
        echo "Error updating service."
        return 1
    fi
}

make_task_def() {
	task_template=$(cat ./deploy/api-task-definition.json)
	task_def=$(printf "$task_template" $AWS_ACCOUNT_ID)
}

push_ecr_image(){
	eval $(aws ecr get-login --region us-east-1)
	docker push https://$AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/kit_api/api
}

register_definition() {
    if task_revision=$(aws ecs register-task-definition --container-definitions "$task_def" --family $family); then
        echo "Task Revision: $task_revision"
    else
        echo "Failed to register task definition"
        return 1
    fi
}

configure_aws_cli
push_ecr_image
deploy_cluster
