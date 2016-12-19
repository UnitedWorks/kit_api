#!/usr/bin/env bash

family="api"
cluster="kit_production"
desired_count=2

configure_aws_cli() {
	aws --version
	aws configure set default.region us-east-1
	aws configure set default.output json
}

push_ecr_image(){
	 eval $(aws ecr get-login --region us-east-1)
   docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/kit_api/api
  #  docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/kit_api/api:$CIRCLE_SHA1
}

register_definition() {
    if task_revision=$(aws ecs register-task-definition --cli-input-json file://deploy/api-task-definition.json); then
        echo "Task Revision: $task_revision"
    else
        echo "Failed to register task definition"
        return 1
    fi
}

update_cluster_service() {
    register_definition
    if service=$(aws ecs update-service --cluster $cluster --service $family --task-definition $family --desired-count $desired_count); then
        echo "Service Updated: $service"
    else
        echo "Error updating service."
        return 1
    fi
}

configure_aws_cli
push_ecr_image
update_cluster_service
